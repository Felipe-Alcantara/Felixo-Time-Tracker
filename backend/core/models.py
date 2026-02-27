from django.db import models
from django.utils import timezone
import json

class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    path = models.CharField(max_length=500, db_index=True)
    properties = models.JSONField(default=dict, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['path']

    def __str__(self):
        return self.path

    def save(self, *args, **kwargs):
        if self.parent:
            self.path = f"{self.parent.path}/{self.name}"
        else:
            self.path = f"/{self.name}"
        super().save(*args, **kwargs)

    def get_descendants(self):
        return Category.objects.filter(path__startswith=f"{self.path}/")

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#C084FC")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='tasks')
    default_tags = models.ManyToManyField(Tag, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category.path} > {self.name}"

class TimeEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name='entries')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='entries')
    tags = models.ManyToManyField(Tag, blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    note = models.TextField(blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_at']

    def __str__(self):
        return f"{self.category.path} - {self.start_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        if self.end_at and self.start_at:
            self.duration_seconds = int((self.end_at - self.start_at).total_seconds())
        super().save(*args, **kwargs)

    @property
    def is_running(self):
        return self.end_at is None

    def stop(self):
        if self.is_running:
            self.end_at = timezone.now()
            self.save()
        return self