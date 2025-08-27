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
        
        # 방문한 부스 정보
        visited_records = participant.stamp_records.select_related('booth').all()
        visited_booths = []
        for record in visited_records:
            visited_booths.append({
                'booth': BoothSerializer(record.booth).data,
                'stamped_at': record.stamped_at
            })
        
        stats_data = {
            'id': participant.id,
            'stamp_count': stamp_count,
            'is_completed': participant.is_completed,
            'progress_percentage': round(progress_percentage, 1),
            'remaining_stamps': remaining_stamps,
            'next_booths': BoothSerializer(next_booths, many=True).data,
            'visited_booths': visited_booths
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


@api_view(['GET'])
def get_participant_detail(request, participant_id):
    """
    참여자 상세 정보 (전체 부스 목록 및 방문 여부 포함)
    """
    try:
        participant = Participant.objects.get(id=participant_id)
        stamp_count = participant.get_stamp_count()
        progress_percentage = min((stamp_count / 5) * 100, 100)
        remaining_stamps = max(5 - stamp_count, 0)
        
        # 방문한 부스 정보
        visited_records = participant.stamp_records.select_related('booth').all()
        visited_booths = []
        visited_booth_ids = set()
        
        for record in visited_records:
            visited_booths.append({
                'booth': BoothSerializer(record.booth).data,
                'stamped_at': record.stamped_at
            })
            visited_booth_ids.add(record.booth.id)
        
        # 전체 부스 목록 (방문 여부 표시)
        all_booths = Booth.objects.filter(is_active=True).order_by('code')
        booths_with_status = []
        
        for booth in all_booths:
            booth_data = BoothSerializer(booth).data
            booth_data['visited'] = booth.id in visited_booth_ids
            
            # 방문했다면 방문 시간 추가
            if booth.id in visited_booth_ids:
                visited_record = next(
                    (r for r in visited_records if r.booth.id == booth.id), 
                    None
                )
                if visited_record:
                    booth_data['stamped_at'] = visited_record.stamped_at
            
            booths_with_status.append(booth_data)
        
        detail_data = {
            'id': participant.id,
            'stamp_count': stamp_count,
            'is_completed': participant.is_completed,
            'progress_percentage': round(progress_percentage, 1),
            'remaining_stamps': remaining_stamps,
            'visited_booths': visited_booths,
            'all_booths': booths_with_status
        }
        
        return Response({
            'success': True,
            'data': detail_data
        })
        
    except Participant.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않는 참여자입니다.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def booth_list(request):
    """
    활성화된 부스 목록 조회
    """
    booths = Booth.objects.filter(is_active=True).order_by('code')
    serializer = BoothSerializer(booths, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })


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
def booth_management_list(request):
    """
    관리자용 전체 부스 목록 조회 (비활성화 포함)
    """
    booths = Booth.objects.all().order_by('code')
    booth_data = []
    
    for booth in booths:
        booth_data.append({
            'id': booth.id,
            'code': booth.code,
            'name': booth.name,
            'description': booth.description,
            'is_active': booth.is_active,
            'participant_count': booth.get_participant_count(),
            'created_at': booth.created_at
        })
    
    return Response({
        'success': True,
        'data': booth_data
    })


@api_view(['POST'])
def create_booth(request):
    """
    새로운 부스 생성
    """
    code = request.data.get('code')
    name = request.data.get('name')
    description = request.data.get('description', '')
    is_active = request.data.get('is_active', True)
    
    if not code or not name:
        return Response({
            'success': False,
            'message': '부스 코드와 이름은 필수입니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 중복 코드 체크
    if Booth.objects.filter(code=code).exists():
        return Response({
            'success': False,
            'message': f'부스 코드 "{code}"는 이미 존재합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    booth = Booth.objects.create(
        code=code,
        name=name,
        description=description,
        is_active=is_active
    )
    
    return Response({
        'success': True,
        'message': '부스가 성공적으로 생성되었습니다.',
        'data': {
            'id': booth.id,
            'code': booth.code,
            'name': booth.name,
            'description': booth.description,
            'is_active': booth.is_active,
            'created_at': booth.created_at
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
def update_booth(request, booth_id):
    """
    부스 정보 업데이트
    """
    try:
        booth = Booth.objects.get(id=booth_id)
    except Booth.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않는 부스입니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # 업데이트할 데이터 추출
    code = request.data.get('code', booth.code)
    name = request.data.get('name', booth.name)
    description = request.data.get('description', booth.description)
    is_active = request.data.get('is_active', booth.is_active)
    
    if not code or not name:
        return Response({
            'success': False,
            'message': '부스 코드와 이름은 필수입니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 다른 부스에서 동일한 코드 사용 체크
    if code != booth.code and Booth.objects.filter(code=code).exists():
        return Response({
            'success': False,
            'message': f'부스 코드 "{code}"는 이미 존재합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 업데이트
    booth.code = code
    booth.name = name
    booth.description = description
    booth.is_active = is_active
    booth.save()
    
    return Response({
        'success': True,
        'message': '부스 정보가 업데이트되었습니다.',
        'data': {
            'id': booth.id,
            'code': booth.code,
            'name': booth.name,
            'description': booth.description,
            'is_active': booth.is_active,
            'participant_count': booth.get_participant_count(),
            'created_at': booth.created_at
        }
    })


@api_view(['DELETE'])
def delete_booth(request, booth_id):
    """
    부스 삭제 (참여자가 있는 경우 비활성화)
    """
    try:
        booth = Booth.objects.get(id=booth_id)
    except Booth.DoesNotExist:
        return Response({
            'success': False,
            'message': '존재하지 않는 부스입니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # 이미 참여자가 있는지 체크
    if booth.get_participant_count() > 0:
        # 참여자가 있으면 비활성화만
        booth.is_active = False
        booth.save()
        return Response({
            'success': True,
            'message': '참여자가 있어 부스를 비활성화했습니다.',
            'data': {
                'action': 'deactivated',
                'booth_code': booth.code,
                'participant_count': booth.get_participant_count()
            }
        })
    else:
        # 참여자가 없으면 완전 삭제
        booth_code = booth.code
        booth.delete()
        return Response({
            'success': True,
            'message': f'부스 "{booth_code}"가 삭제되었습니다.',
            'data': {
                'action': 'deleted',
                'booth_code': booth_code
            }
        })


@api_view(['GET'])
def stamp_view(request):
    """
    QR 링크로 직접 접속 시 처리하는 뷰 (Django HTML 응답)
    프론트엔드 대신 백엔드에서 직접 HTML을 제공
    """
    booth_code = request.GET.get('booth')
    
    if not booth_code:
        from django.http import HttpResponse
        return HttpResponse(
            """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR 스탬프 오류</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                    .error { color: red; font-size: 18px; margin: 20px; }
                </style>
            </head>
            <body>
                <h1>📱 QR 스탬프 오류</h1>
                <div class="error">부스 코드가 포함된 유효한 QR 링크가 아닙니다.</div>
                <p>예: /stamp?booth=art1</p>
            </body>
            </html>
            """
        )
    
    # 부스 코드가 있으면 스탬프 처리 후 HTML 응답
    try:
        # 부스 유효성 확인
        try:
            booth = Booth.objects.get(code=booth_code, is_active=True)
        except Booth.DoesNotExist:
            from django.http import HttpResponse
            return HttpResponse(
                f"""
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>QR 스탬프 오류</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                        .error {{ color: red; font-size: 18px; margin: 20px; }}
                    </style>
                </head>
                <body>
                    <h1>📱 QR 스탬프 오류</h1>
                    <div class="error">존재하지 않거나 비활성화된 부스입니다: {booth_code}</div>
                </body>
                </html>
                """
            )
        
        # 참여자 ID를 세션에서 가져오거나 새로 생성
        participant_id = request.session.get('participant_id')
        if participant_id:
            try:
                participant = Participant.objects.get(id=participant_id)
                is_new_participant = False
            except Participant.DoesNotExist:
                participant = Participant.objects.create()
                is_new_participant = True
                request.session['participant_id'] = str(participant.id)
        else:
            participant = Participant.objects.create()
            is_new_participant = True
            request.session['participant_id'] = str(participant.id)
        
        # 중복 스탬프 체크
        if StampRecord.objects.filter(participant=participant, booth=booth).exists():
            message = f'이미 {booth.name}에서 스탬프를 받았습니다.'
            stamp_count = participant.get_stamp_count()
        else:
            # 스탬프 기록 생성
            stamp_record = StampRecord.objects.create(
                participant=participant,
                booth=booth,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            participant.refresh_from_db()
            stamp_count = participant.get_stamp_count()
            message = f'{booth.name}에서 스탬프를 받았습니다!'
            if is_new_participant:
                message = f'새로운 참여자로 등록되었습니다. {message}'
        
        # 전체 부스 수와 5개 목표에 대한 진행률 계산
        total_booths = Booth.objects.filter(is_active=True).count()
        target_stamps = 5  # 목표 스탬프 수
        progress_percentage = min((stamp_count / target_stamps) * 100, 100)
        remaining_stamps = max(target_stamps - stamp_count, 0)
        is_completed = stamp_count >= target_stamps
        
        # 방문한 부스 정보 가져오기
        visited_records = participant.stamp_records.select_related('booth').order_by('stamped_at')
        visited_booths = []
        for record in visited_records:
            visited_booths.append({
                'name': record.booth.name,
                'code': record.booth.code,
                'stamped_at': record.stamped_at.strftime('%m/%d %H:%M')
            })
        
        # 스탬프 진행 상황 아이콘 생성
        stamp_icons = ''
        for i in range(target_stamps):
            if i < stamp_count:
                stamp_icons += '✅'
            else:
                stamp_icons += '⭕'
        
        # 방문한 부스 HTML 생성
        visited_booths_html = ''
        if visited_booths:
            visited_items_html = ''
            for booth in visited_booths:
                visited_items_html += f'<div class="visited-item"><span class="booth-name">{booth["name"]}</span><span class="visit-time">{booth["stamped_at"]}</span></div>'
            visited_booths_html = f'<div class="visited-list">{visited_items_html}</div>'
        
        # HTML 응답 생성
        from django.http import HttpResponse
        return HttpResponse(
            f"""
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🏮 제46회 소양강문화제 - QR 스탬프 투어</title>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body {{ 
                        font-family: 'Noto Sans KR', Arial, sans-serif; 
                        margin: 0; padding: 20px; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        color: #333;
                    }}
                    .container {{
                        max-width: 420px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }}
                    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; }}
                    .header p {{ margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }}
                    .content {{ padding: 30px 25px; }}
                    .message {{ 
                        background: #d4edda; 
                        color: #155724; 
                        padding: 15px; 
                        border-radius: 10px; 
                        margin-bottom: 25px; 
                        font-weight: 600;
                        text-align: center;
                        border: 1px solid #c3e6cb;
                    }}
                    .progress-card {{
                        background: linear-gradient(135deg, #ff6b9d, #f093fb);
                        color: white;
                        border-radius: 15px;
                        padding: 25px;
                        text-align: center;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
                    }}
                    .progress-number {{
                        font-size: 42px;
                        font-weight: 700;
                        margin: 10px 0;
                    }}
                    .progress-text {{ font-size: 16px; opacity: 0.9; }}
                    .progress-bar {{
                        background: rgba(255,255,255,0.3);
                        height: 8px;
                        border-radius: 4px;
                        margin: 15px 0;
                        overflow: hidden;
                    }}
                    .progress-fill {{
                        background: white;
                        height: 100%;
                        width: {progress_percentage}%;
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    }}
                    .stamp-status {{
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }}
                    .stamp-status h3 {{
                        margin: 0 0 15px 0;
                        color: #667eea;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }}
                    .stamp-icons {{
                        font-size: 24px;
                        letter-spacing: 8px;
                        margin: 15px 0;
                        text-align: center;
                    }}
                    .booth-stats {{
                        background: #e3f2fd;
                        border-radius: 10px;
                        padding: 15px;
                        margin-bottom: 20px;
                        text-align: center;
                    }}
                    .booth-stats h4 {{ margin: 0 0 10px 0; color: #1976d2; }}
                    .booth-stats-number {{ font-size: 28px; font-weight: 700; color: #1976d2; }}
                    .visited-list {{
                        max-height: 150px;
                        overflow-y: auto;
                        margin-top: 15px;
                    }}
                    .visited-item {{
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: #f0f8ff;
                        border-radius: 6px;
                        margin-bottom: 5px;
                        font-size: 14px;
                    }}
                    .visited-item .booth-name {{ font-weight: 600; color: #333; }}
                    .visited-item .visit-time {{ color: #666; font-size: 12px; }}
                    .admin-link {{
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }}
                    .admin-btn {{
                        background: #6c757d;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        font-size: 14px;
                        text-decoration: none;
                        display: inline-block;
                        transition: all 0.3s ease;
                    }}
                    .admin-btn:hover {{ background: #5a6268; transform: translateY(-1px); }}
                    .completion-badge {{
                        background: linear-gradient(135deg, #28a745, #20c997);
                        color: white;
                        padding: 15px;
                        border-radius: 10px;
                        text-align: center;
                        font-weight: 600;
                        margin-bottom: 20px;
                        animation: pulse 2s infinite;
                    }}
                    @keyframes pulse {{
                        0% {{ transform: scale(1); }}
                        50% {{ transform: scale(1.02); }}
                        100% {{ transform: scale(1); }}
                    }}
                    .footer-info {{
                        text-align: center;
                        color: #6c757d;
                        font-size: 13px;
                        margin-top: 20px;
                        line-height: 1.4;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏮 제46회 소양강문화제</h1>
                        <p>체험부스 스탬프 투어</p>
                    </div>
                    
                    <div class="content">
                        <div class="message">{message}</div>
                        
                        {'<div class="completion-badge">🎉 축하합니다! 스탬프 미션 완료! 🎉</div>' if is_completed else ''}
                        
                        <div class="progress-card">
                            <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">스탬프 수집 현황</div>
                            <div class="progress-number">{stamp_count} / {target_stamps}</div>
                            <div class="progress-text">{'미션 완료!' if is_completed else f'{remaining_stamps}개 더 수집하면 완료!'}</div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-text">{progress_percentage:.0f}% 완료</div>
                        </div>
                        
                        <div class="stamp-status">
                            <h3>📋 스탬프 수집 현황</h3>
                            <div class="stamp-icons">{stamp_icons}</div>
                            <div style="text-align: center; color: #6c757d; font-size: 14px;">
                                {'완료' if is_completed else f'현재 {stamp_count}개 수집'} · {'목표 달성' if is_completed else f'{remaining_stamps}개 남음'}
                            </div>
                        </div>
                        
                        <div class="booth-stats">
                            <h4>🏢 체험부스 참여 현황</h4>
                            <div class="booth-stats-number">{stamp_count} / {total_booths}</div>
                            <div style="color: #666; font-size: 14px;">개의 체험부스를 방문했습니다</div>
                            
                            {visited_booths_html if visited_booths else ''}
                        </div>
                        
                        <div class="footer-info">
                            17개 체험부스 중 5곳을 방문하여 스탬프를 모으고<br>
                            기념품을 받아가세요!
                        </div>
                        
                        <div class="admin-link">
                            <a href="/admin/" class="admin-btn">⚙️ 관리자 페이지</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        
    except Exception as e:
        from django.http import HttpResponse
        return HttpResponse(
            f"""
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>QR 스탬프 오류</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 20px; text-align: center; }}
                    .error {{ color: red; font-size: 18px; margin: 20px; }}
                </style>
            </head>
            <body>
                <h1>📱 QR 스탬프 오류</h1>
                <div class="error">QR 처리 중 오류가 발생했습니다: {str(e)}</div>
            </body>
            </html>
            """
        )

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
