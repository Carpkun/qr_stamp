from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from .models import Participant, Booth, StampRecord
from .serializers import (
    ParticipantSerializer, ParticipantCreateSerializer,
    BoothSerializer, StampCreateSerializer, 
    ParticipantStatsSerializer
)


def get_client_ip(request):
    """클라이언트 IP 주소 추출"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@api_view(['POST'])
def create_participant(request):
    """
    새로운 참여자 생성
    QR 스캔 시 첫 번째로 호출되는 API
    """
    serializer = ParticipantCreateSerializer(data={})
    if serializer.is_valid():
        participant = Participant.objects.create()
        response_serializer = ParticipantCreateSerializer(participant)
        return Response({
            'success': True,
            'message': '새로운 참여자가 생성되었습니다.',
            'data': response_serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_participant(request, participant_id):
    """
    참여자 정보 조회 (스탬프 기록 포함)
    """
    try:
        participant = Participant.objects.get(id=participant_id)
        serializer = ParticipantSerializer(participant)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Participant.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않는 참여자입니다.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def create_stamp(request):
    """
    스탬프 기록 생성
    QR 스캔 시 부스 방문 기록 생성
    """
    serializer = StampCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            participant = Participant.objects.get(id=serializer.validated_data['participant_id'])
            booth = Booth.objects.get(code=serializer.validated_data['booth_code'])
            
            # 스탬프 기록 생성
            stamp_record = StampRecord.objects.create(
                participant=participant,
                booth=booth,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # 참여자 완주 상태 체크 (모델에서 자동 처리됨)
            participant.refresh_from_db()
            
            return Response({
                'success': True,
                'message': f'{booth.name}에서 스탬프를 받았습니다!',
                'data': {
                    'participant_id': participant.id,
                    'booth_name': booth.name,
                    'stamp_count': participant.get_stamp_count(),
                    'is_completed': participant.is_completed,
                    'completed_at': participant.completed_at
                }
            }, status=status.HTTP_201_CREATED)
            
        except IntegrityError:
            return Response({
                'success': False,
                'message': '이미 이 부스에서 스탬프를 받았습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_participant_stats(request, participant_id):
    """
    참여자 진행 상황 통계
    """
    try:
        participant = Participant.objects.get(id=participant_id)
        stamp_count = participant.get_stamp_count()
        progress_percentage = min((stamp_count / 5) * 100, 100)
        remaining_stamps = max(5 - stamp_count, 0)
        
        # 아직 방문하지 않은 부스들
        visited_booth_ids = participant.stamp_records.values_list('booth_id', flat=True)
        next_booths = Booth.objects.filter(is_active=True).exclude(id__in=visited_booth_ids)[:3]
        
        stats_data = {
            'id': participant.id,
            'stamp_count': stamp_count,
            'is_completed': participant.is_completed,
            'progress_percentage': round(progress_percentage, 1),
            'remaining_stamps': remaining_stamps,
            'next_booths': BoothSerializer(next_booths, many=True).data
        }
        
        return Response({
            'success': True,
            'data': stats_data
        })
        
    except Participant.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않는 참여자입니다.'
        }, status=status.HTTP_404_NOT_FOUND)


class BoothListView(generics.ListAPIView):
    """
    활성화된 부스 목록 조회
    """
    queryset = Booth.objects.filter(is_active=True)
    serializer_class = BoothSerializer


@api_view(['GET'])
def get_booth_by_code(request, booth_code):
    """
    부스 코드로 부스 정보 조회
    """
    try:
        booth = Booth.objects.get(code=booth_code, is_active=True)
        serializer = BoothSerializer(booth)
        return Response({
            'success': True,
            'data': serializer.data
        })
    except Booth.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않거나 비활성화된 부스입니다.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def admin_statistics(request):
    """
    관리자용 전체 통계 API
    - 전체 참여자 수
    - 완주자 수
    - 부스별 참여 통계
    - 기념품 수령 대상자 현황
    """
    total_participants = Participant.objects.count()
    completed_participants = Participant.objects.filter(is_completed=True).count()
    
    # 부스별 통계
    booth_stats = []
    for booth in Booth.objects.filter(is_active=True):
        participant_count = booth.get_participant_count()
        booth_stats.append({
            'booth_code': booth.code,
            'booth_name': booth.name,
            'participant_count': participant_count,
            'popularity_rank': 0  # 추후 계산
        })
    
    # 인기도 순으로 정렬
    booth_stats.sort(key=lambda x: x['participant_count'], reverse=True)
    for i, booth_stat in enumerate(booth_stats):
        booth_stat['popularity_rank'] = i + 1
    
    # 시간대별 참여 현황 (최근 24시간, 1시간 단위)
    from django.utils import timezone
    from datetime import timedelta
    import json
    
    now = timezone.now()
    hourly_stats = []
    for i in range(24):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)
        
        participants_in_hour = Participant.objects.filter(
            created_at__gte=hour_start,
            created_at__lt=hour_end
        ).count()
        
        stamps_in_hour = StampRecord.objects.filter(
            stamped_at__gte=hour_start,
            stamped_at__lt=hour_end
        ).count()
        
        hourly_stats.append({
            'hour': hour_start.strftime('%H:00'),
            'new_participants': participants_in_hour,
            'stamps_collected': stamps_in_hour
        })
    
    hourly_stats.reverse()  # 시간순 정렬
    
    return Response({
        'success': True,
        'data': {
            'summary': {
                'total_participants': total_participants,
                'completed_participants': completed_participants,
                'completion_rate': round((completed_participants / total_participants * 100) if total_participants > 0 else 0, 1),
                'gift_eligible_count': completed_participants
            },
            'booth_statistics': booth_stats,
            'hourly_statistics': hourly_stats
        }
    })


@api_view(['POST'])
def scan_qr(request):
    """
    QR 스캔 통합 API
    참여자가 존재하지 않으면 생성하고, 스탬프 기록 생성
    """
    participant_id = request.data.get('participant_id')
    booth_code = request.data.get('booth_code')
    
    if not booth_code:
        return Response({
            'success': False,
            'message': '부스 코드가 필요합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 부스 유효성 확인
    try:
        booth = Booth.objects.get(code=booth_code, is_active=True)
    except Booth.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않거나 비활성화된 부스입니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # 참여자 확인 또는 생성
    if participant_id:
        try:
            participant = Participant.objects.get(id=participant_id)
            is_new_participant = False
        except Participant.DoesNotExist:
            participant = Participant.objects.create()
            is_new_participant = True
    else:
        participant = Participant.objects.create()
        is_new_participant = True
    
    # 중복 스탬프 체크
    if StampRecord.objects.filter(participant=participant, booth=booth).exists():
        return Response({
            'success': False,
            'message': '이미 이 부스에서 스탬프를 받았습니다.',
            'data': {
                'participant_id': participant.id,
                'booth_name': booth.name,
                'stamp_count': participant.get_stamp_count(),
                'is_completed': participant.is_completed
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 스탬프 기록 생성
    stamp_record = StampRecord.objects.create(
        participant=participant,
        booth=booth,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    # 참여자 상태 갱신
    participant.refresh_from_db()
    
    message = f'{booth.name}에서 스탬프를 받았습니다!'
    if is_new_participant:
        message = f'새로운 참여자로 등록되었습니다. {message}'
    
    return Response({
        'success': True,
        'message': message,
        'data': {
            'participant_id': participant.id,
            'booth_name': booth.name,
            'stamp_count': participant.get_stamp_count(),
            'is_completed': participant.is_completed,
            'completed_at': participant.completed_at,
            'is_new_participant': is_new_participant
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def gift_eligible_participants(request):
    """
    기념품 수령 대상자 목록 조회
    5개 부스를 모두 완주한 참여자들
    """
    completed_participants = Participant.objects.filter(is_completed=True).order_by('completed_at')
    
    participants_data = []
    for participant in completed_participants:
        # 방문한 부스 정보
        visited_booths = []
        for record in participant.stamp_records.all().order_by('stamped_at'):
            visited_booths.append({
                'booth_code': record.booth.code,
                'booth_name': record.booth.name,
                'stamped_at': record.stamped_at
            })
        
        participants_data.append({
            'participant_id': str(participant.id),
            'completed_at': participant.completed_at,
            'stamp_count': participant.get_stamp_count(),
            'visited_booths': visited_booths,
            'completion_duration': None if not participant.completed_at else 
                                 int((participant.completed_at - participant.created_at).total_seconds() / 60)  # 분 단위
        })
    
    return Response({
        'success': True,
        'data': {
            'total_eligible': len(participants_data),
            'participants': participants_data
        }
    })


@api_view(['GET'])
def system_health_check(request):
    """
    시스템 상태 체크 API
    - 데이터베이스 연결 상태
    - 기본 통계 정보
    - API 응답 시간 측정
    """
    import time
    start_time = time.time()
    
    try:
        # 데이터베이스 연결 테스트
        db_status = 'OK'
        total_participants = Participant.objects.count()
        total_booths = Booth.objects.filter(is_active=True).count()
        total_stamps = StampRecord.objects.count()
        
        # API 응답 시간 계산
        response_time = round((time.time() - start_time) * 1000, 2)  # ms
        
        from django.utils import timezone
        return Response({
            'success': True,
            'data': {
                'status': 'healthy',
                'database': db_status,
                'response_time_ms': response_time,
                'statistics': {
                    'total_participants': total_participants,
                    'active_booths': total_booths,
                    'total_stamps_collected': total_stamps
                },
                'timestamp': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'System health check failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
