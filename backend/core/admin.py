from django.contrib import admin
from .models import Category, Task, Tag, TimeEntry

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'path', 'parent', 'created_at']
    list_filter = ['parent', 'created_at']
    search_fields = ['name', 'path']
    readonly_fields = ['path']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['default_tags']

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'created_at']
    search_fields = ['name']

@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ['category', 'task', 'start_at', 'end_at', 'duration_seconds', 'is_running']
    list_filter = ['category', 'start_at', 'end_at']
    search_fields = ['category__name', 'task__name', 'note']
    readonly_fields = ['duration_seconds', 'is_running']
    filter_horizontal = ['tags']