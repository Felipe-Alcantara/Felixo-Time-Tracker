from rest_framework import serializers
from django.db.models import Avg, Min, Count
from .models import Category, Task, Tag, TimeEntry

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'path', 'properties', 'icon', 'children', 'created_at', 'updated_at']
        read_only_fields = ['path']  # path é calculado automaticamente
    
    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True).data

class TaskSerializer(serializers.ModelSerializer):
    default_tags = TagSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.path', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'

class TimeEntrySerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    task_name = serializers.CharField(source='task.name', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.path', read_only=True)
    is_running = serializers.BooleanField(read_only=True)
    speedrun_dynamic = serializers.SerializerMethodField()

    def get_speedrun_dynamic(self, obj):
        if not obj.end_at:
            return None

        cache = self.context.setdefault('_speedrun_category_cache', {})
        category_path = obj.category.path

        stats = cache.get(category_path)
        if stats is None:
            base_queryset = TimeEntry.objects.filter(
                category__path__startswith=category_path,
                end_at__isnull=False
            )
            aggregates = base_queryset.aggregate(
                avg_duration=Avg('duration_seconds'),
                min_duration=Min('duration_seconds'),
                total_entries=Count('id'),
            )
            first_entry = base_queryset.order_by('end_at', 'id').values('id').first()
            stats = {
                'avg_duration': float(aggregates['avg_duration'] or 0),
                'min_duration': int(aggregates['min_duration'] or 0),
                'total_entries': int(aggregates['total_entries'] or 0),
                'first_entry_id': int(first_entry['id']) if first_entry else None,
            }
            cache[category_path] = stats

        current_seconds = int(obj.duration_seconds or 0)
        avg_duration = stats['avg_duration']
        min_duration = stats['min_duration']
        total_entries = stats['total_entries']
        first_entry_id = stats['first_entry_id']

        if total_entries <= 1 or avg_duration <= 0 or obj.id == first_entry_id:
            return {
                'status': 'first',
                'label': 'Primeira sessão',
                'current_seconds': current_seconds,
                'avg_duration': round(avg_duration),
                'min_duration': min_duration,
                'total_entries': total_entries,
                'ratio_percent': 100,
            }

        ratio = current_seconds / avg_duration
        ratio_percent = int(round(ratio * 100))

        if current_seconds <= min_duration:
            status = 'record'
            label = 'Recorde'
        elif ratio <= 0.90:
            status = 'fast'
            label = 'Bom ritmo'
        elif ratio <= 1.10:
            status = 'normal'
            label = 'Na média'
        elif ratio <= 1.35:
            status = 'slow'
            label = 'Abaixo da média'
        else:
            status = 'very_slow'
            label = 'Bem abaixo da média'

        return {
            'status': status,
            'label': label,
            'current_seconds': current_seconds,
            'avg_duration': round(avg_duration),
            'min_duration': min_duration,
            'total_entries': total_entries,
            'ratio_percent': ratio_percent,
        }
    
    class Meta:
        model = TimeEntry
        fields = '__all__'

class TimerStartSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    task_id = serializers.IntegerField(required=False, allow_null=True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    note = serializers.CharField(required=False, allow_blank=True, default='')

class TimerStopSerializer(serializers.Serializer):
    entry_id = serializers.IntegerField()
