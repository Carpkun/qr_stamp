import uuid
from django.db import models
from django.utils import timezone


class Participant(models.Model):
    """
    참여자 모델
    - QR 스캔 시 자동으로 생성되는 고유 참여자
    - UUID를 통해 익명성 보장
    """
    id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False,
        help_text="참여자 고유 식별자 (UUID)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="참여자 생성 시간"
    )
    is_completed = models.BooleanField(
        default=False,
        help_text="5개 부스 완주 여부"
    )
    completed_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="미션 완료 시간"
    )

    class Meta:
        db_table = 'participants'
        verbose_name = '참여자'
        verbose_name_plural = '참여자들'
        ordering = ['-created_at']

    def __str__(self):
        return f"참여자 {str(self.id)[:8]}..."

    def get_stamp_count(self):
        """참여자의 현재 스탬프 개수 반환"""
        return self.stamp_records.count()

    def check_completion(self):
        """5개 부스 완주 확인 및 완료 처리"""
        stamp_count = self.get_stamp_count()
        if stamp_count >= 5 and not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()
        return self.is_completed


class Booth(models.Model):
    """
    체험부스 모델
    - 소양강문화제의 각 체험부스 정보
    """
    name = models.CharField(
        max_length=100,
        help_text="부스명"
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="부스 고유 코드 (QR에 포함)"
    )
    description = models.TextField(
        blank=True,
        help_text="부스 설명"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="부스 활성화 여부"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'booths'
        verbose_name = '체험부스'
        verbose_name_plural = '체험부스들'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_participant_count(self):
        """이 부스를 방문한 참여자 수"""
        return self.stamp_records.count()


class StampRecord(models.Model):
    """
    스탬프 기록 모델
    - 참여자가 특정 부스를 방문했을 때 생성
    - 중복 방지를 위한 unique_together 제약
    """
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='stamp_records',
        help_text="참여자"
    )
    booth = models.ForeignKey(
        Booth,
        on_delete=models.CASCADE,
        related_name='stamp_records',
        help_text="체험부스"
    )
    stamped_at = models.DateTimeField(
        auto_now_add=True,
        help_text="스탬프 획득 시간"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="스탬프 획득 시 IP 주소"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="사용자 브라우저 정보"
    )

    class Meta:
        db_table = 'stamp_records'
        verbose_name = '스탬프 기록'
        verbose_name_plural = '스탬프 기록들'
        ordering = ['-stamped_at']
        # 중복 방지: 한 참여자는 같은 부스에 한 번만 스탬프 가능
        unique_together = ['participant', 'booth']

    def __str__(self):
        return f"{self.participant} -> {self.booth.name}"

    def save(self, *args, **kwargs):
        """스탬프 저장 시 참여자 완주 상태 자동 체크"""
        super().save(*args, **kwargs)
        # 스탬프 저장 후 참여자 완주 체크
        self.participant.check_completion()
