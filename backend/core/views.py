from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, timedelta
import csv
from django.http import HttpResponse
import logging
from .models import Category, Task, Tag, TimeEntry
from .serializers import (
    CategorySerializer, TaskSerializer, TagSerializer, 
    TimeEntrySerializer, TimerStartSerializer, TimerStopSerializer
)

logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()  # Incluir todas as categorias
    serializer_class = CategorySerializer

    def create(self, request, *args, **kwargs):
        print(f"Dados recebidos: {request.data}")  # Debug
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            print(f"Erros de validação: {serializer.errors}")  # Debug
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Estatísticas específicas da categoria"""
        category = self.get_object()
        
        # Buscar todas as entradas desta categoria e subcategorias
        entries = TimeEntry.objects.filter(
            category__path__startswith=category.path,
            end_at__isnull=False
        )
        
        if not entries.exists():
            return Response({
                'total_entries': 0,
                'avg_duration': 0,
                'min_duration': 0,
                'max_duration': 0,
                'total_time': 0
            })
        
        durations = entries.values_list('duration_seconds', flat=True)
        
        return Response({
            'total_entries': entries.count(),
            'avg_duration': sum(durations) / len(durations),
            'min_duration': min(durations),
            'max_duration': max(durations),
            'total_time': sum(durations),
            'recent_avg': sum(list(durations)[-10:]) / min(10, len(durations))  # Últimas 10 sessões
        })

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Retorna árvore completa de categorias"""
        root_categories = Category.objects.filter(parent=None)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.all()
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer

    def get_queryset(self):
        queryset = TimeEntry.objects.all()
        
        # Filtros por data
        from_date = self.request.query_params.get('from')
        to_date = self.request.query_params.get('to')
        
        if from_date:
            queryset = queryset.filter(start_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(start_at__date__lte=to_date)
            
        # Filtros por categoria e tag
        category_id = self.request.query_params.get('category')
        include_descendants = self.request.query_params.get('include_descendants')
        tag_name = self.request.query_params.get('tag')
        
        if category_id:
            include_descendants_flag = str(include_descendants).lower() in ('1', 'true', 'yes')
            if include_descendants_flag:
                category = Category.objects.filter(id=category_id).first()
                if category:
                    queryset = queryset.filter(category__path__startswith=category.path)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.filter(category_id=category_id)
        if tag_name:
            queryset = queryset.filter(tags__name=tag_name)
            
        return queryset

    @action(detail=False, methods=['get'])
    def running(self, request):
        """Retorna entry que está rodando atualmente"""
        running_entry = TimeEntry.objects.filter(end_at__isnull=True).first()
        if running_entry:
            serializer = self.get_serializer(running_entry)
            return Response(serializer.data)
        return Response(None)

    @action(detail=False, methods=['post'])
    def start_timer(self, request):
        """Inicia um novo timer"""
        # Para qualquer timer rodando
        TimeEntry.objects.filter(end_at__isnull=True).update(end_at=timezone.now())
        
        serializer = TimerStartSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            entry = TimeEntry.objects.create(
                category_id=data['category_id'],
                task_id=data.get('task_id'),
                start_at=timezone.now(),
                note=data.get('note', '')
            )
            
            # Adicionar tags
            if data.get('tag_ids'):
                entry.tags.set(data['tag_ids'])
            
            response_serializer = TimeEntrySerializer(entry)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def stop_timer(self, request):
        """Para o timer atual"""
        serializer = TimerStopSerializer(data=request.data)
        if serializer.is_valid():
            entry_id = serializer.validated_data['entry_id']
            try:
                entry = TimeEntry.objects.get(id=entry_id, end_at__isnull=True)
                entry.stop()
                response_serializer = TimeEntrySerializer(entry)
                return Response(response_serializer.data)
            except TimeEntry.DoesNotExist:
                return Response({'error': 'Timer não encontrado ou já parado'}, 
                              status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats_summary(self, request):
        """Estatísticas resumidas por período"""
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        queryset = TimeEntry.objects.filter(end_at__isnull=False)
        
        if from_date:
            queryset = queryset.filter(start_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(start_at__date__lte=to_date)
        
        # Tempo por categoria
        category_stats = queryset.values('category__path').annotate(
            total_seconds=Sum('duration_seconds'),
            entry_count=Count('id')
        ).order_by('-total_seconds')
        
        # Tempo por tag
        tag_stats = queryset.filter(tags__isnull=False).values('tags__name').annotate(
            total_seconds=Sum('duration_seconds'),
            entry_count=Count('id')
        ).order_by('-total_seconds')
        
        # Estatísticas gerais
        total_time = queryset.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        total_entries = queryset.count()
        avg_session = total_time / total_entries if total_entries > 0 else 0
        
        return Response({
            'total_seconds': total_time,
            'total_entries': total_entries,
            'avg_session_seconds': avg_session,
            'total_seconds_by_category': list(category_stats),
            'total_seconds_by_tag': list(tag_stats)
        })

    @action(detail=False, methods=['get'])
    def top_tasks(self, request):
        """Top N tasks por tempo"""
        limit = int(request.query_params.get('limit', 10))
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        queryset = TimeEntry.objects.filter(end_at__isnull=False, task__isnull=False)
        
        if from_date:
            queryset = queryset.filter(start_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(start_at__date__lte=to_date)
        
        top_tasks = queryset.values('task__name', 'task__category__path').annotate(
            total_seconds=Sum('duration_seconds'),
            entry_count=Count('id')
        ).order_by('-total_seconds')[:limit]
        
        return Response(list(top_tasks))

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Exporta entries em CSV"""
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        queryset = self.get_queryset()
        if from_date:
            queryset = queryset.filter(start_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(start_at__date__lte=to_date)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="time_entries.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Data', 'Categoria', 'Task', 'Início', 'Fim', 'Duração (min)', 'Tags', 'Nota'])
        
        for entry in queryset:
            tags = ', '.join([tag.name for tag in entry.tags.all()])
            duration_min = entry.duration_seconds / 60 if entry.duration_seconds else 0
            
            writer.writerow([
                entry.start_at.date(),
                entry.category.path,
                entry.task.name if entry.task else '',
                entry.start_at.strftime('%H:%M'),
                entry.end_at.strftime('%H:%M') if entry.end_at else '',
                f"{duration_min:.1f}",
                tags,
                entry.note
            ])
        
        return response
