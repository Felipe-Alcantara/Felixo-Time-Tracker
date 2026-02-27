from rest_framework import serializers
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