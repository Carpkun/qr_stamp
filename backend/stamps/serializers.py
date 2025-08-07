from rest_framework import serializers
from .models import Participant, Booth, StampRecord


class BoothSerializer(serializers.ModelSerializer):
    """부스 정보 serializer"""
    participant_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Booth
        fields = ['id', 'code', 'name', 'description', 'is_active', 'participant_count']
        read_only_fields = ['id']
    
    def get_participant_count(self, obj):
        return obj.get_participant_count()


class StampRecordSerializer(serializers.ModelSerializer):
    """스탬프 기록 serializer"""
    booth = BoothSerializer(read_only=True)
    booth_code = serializers.CharField(write_only=True, help_text="부스 코드")
    
    class Meta:
        model = StampRecord
        fields = ['id', 'booth', 'booth_code', 'stamped_at', 'ip_address']
        read_only_fields = ['id', 'stamped_at', 'ip_address']


class ParticipantSerializer(serializers.ModelSerializer):
    """참여자 정보 serializer"""
    stamp_count = serializers.SerializerMethodField()
    stamp_records = StampRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Participant
        fields = [
            'id', 'created_at', 'is_completed', 'completed_at', 
            'stamp_count', 'stamp_records'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at', 'is_completed']
    
    def get_stamp_count(self, obj):
        return obj.get_stamp_count()


class ParticipantCreateSerializer(serializers.ModelSerializer):
    """참여자 생성용 serializer (간단한 정보만)"""
    
    class Meta:
        model = Participant
        fields = ['id', 'created_at']
        read_only_fields = ['id', 'created_at']


class StampCreateSerializer(serializers.Serializer):
    """스탬프 생성용 serializer"""
    participant_id = serializers.UUIDField(help_text="참여자 UUID")
    booth_code = serializers.CharField(max_length=20, help_text="부스 코드")
    
    def validate_participant_id(self, value):
        """참여자 ID 유효성 검증"""
        try:
            Participant.objects.get(id=value)
        except Participant.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 참여자입니다.")
        return value
    
    def validate_booth_code(self, value):
        """부스 코드 유효성 검증"""
        try:
            booth = Booth.objects.get(code=value, is_active=True)
        except Booth.DoesNotExist:
            raise serializers.ValidationError("존재하지 않거나 비활성화된 부스입니다.")
        return value
    
    def validate(self, attrs):
        """중복 스탬프 검증"""
        participant = Participant.objects.get(id=attrs['participant_id'])
        booth = Booth.objects.get(code=attrs['booth_code'])
        
        if StampRecord.objects.filter(participant=participant, booth=booth).exists():
            raise serializers.ValidationError("이미 이 부스에서 스탬프를 받았습니다.")
        
        return attrs


class ParticipantStatsSerializer(serializers.Serializer):
    """참여자 통계 serializer"""
    id = serializers.UUIDField()
    stamp_count = serializers.IntegerField()
    is_completed = serializers.BooleanField()
    progress_percentage = serializers.FloatField()
    remaining_stamps = serializers.IntegerField()
    next_booths = BoothSerializer(many=True)
