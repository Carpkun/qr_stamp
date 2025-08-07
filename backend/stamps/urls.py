from django.urls import path
from . import views

app_name = 'stamps'

urlpatterns = [
    # 참여자 관련 API
    path('participants/', views.create_participant, name='create_participant'),
    path('participants/<uuid:participant_id>/', views.get_participant, name='get_participant'),
    path('participants/<uuid:participant_id>/stats/', views.get_participant_stats, name='get_participant_stats'),
    
    # 부스 관련 API
    path('booths/', views.BoothListView.as_view(), name='booth_list'),
    path('booths/<str:booth_code>/', views.get_booth_by_code, name='get_booth_by_code'),
    
    # 스탬프 관련 API
    path('stamps/', views.create_stamp, name='create_stamp'),
    
    # QR 스캔 통합 API (가장 중요한 엔드포인트)
    path('scan/', views.scan_qr, name='scan_qr'),
    
    # 관리자용 API
    path('admin/statistics/', views.admin_statistics, name='admin_statistics'),
    path('admin/gift-eligible/', views.gift_eligible_participants, name='gift_eligible_participants'),
    path('admin/health-check/', views.system_health_check, name='system_health_check'),
]
