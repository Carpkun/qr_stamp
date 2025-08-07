from django.contrib import admin
from .models import Participant, Booth, StampRecord


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_stamp_count', 'is_completed', 'created_at', 'completed_at']
    list_filter = ['is_completed', 'created_at']
    readonly_fields = ['id', 'created_at', 'completed_at']
    search_fields = ['id']
    ordering = ['-created_at']
    
    def get_stamp_count(self, obj):
        return obj.get_stamp_count()
    get_stamp_count.short_description = '스탬프 개수'


@admin.register(Booth)
class BoothAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'get_participant_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code']
    ordering = ['code']
    
    def get_participant_count(self, obj):
        return obj.get_participant_count()
    get_participant_count.short_description = '참여자 수'


@admin.register(StampRecord)
class StampRecordAdmin(admin.ModelAdmin):
    list_display = ['participant', 'booth', 'stamped_at', 'ip_address']
    list_filter = ['booth', 'stamped_at']
    search_fields = ['participant__id', 'booth__name']
    readonly_fields = ['stamped_at']
    ordering = ['-stamped_at']
