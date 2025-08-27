"""
URL configuration for qr_stamp_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.views.static import serve
from django.views.generic import TemplateView
import os

@require_http_methods(["GET"])
def api_root(request):
    """
    API 루트 엔드포인트 - API 상태 및 사용 가능한 엔드포인트 목록 제공
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'QR 스탬프 투어 API 서버가 정상적으로 작동 중입니다.',
        'description': '소양강문화제 2025 - 17개 체험부스 중 5곳 방문 시 미션 완료',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api_docs': '/api/',
            'health_check': '/api/admin/health-check/',
            'booth_list': '/api/booths/',
            'scan_qr': '/api/scan/',
            'booth_management': '/api/admin/booths/',
            'statistics': '/api/admin/statistics/',
            'participant_stats': '/api/participants/{id}/stats/',
            'participant_detail': '/api/participants/{id}/detail/'
        },
        'frontend_url': 'http://localhost:3000'
    })

# stamps 앱에 stamp 라우트를 추가하기 전에 먼저 import
from stamps.views import stamp_view

urlpatterns = [
    path('stamp', stamp_view, name='stamp_view'),  # QR 링크 접속 시 직접 처리 (최우선)
    path('api/', include('stamps.urls')),  # QR 스탬프 API
    path('admin/', admin.site.urls),
    path('', api_root, name='api_root'),  # API 루트
]

# 프로덕션 환경에서 React 앱 서빙
if not settings.DEBUG:
    # React 빌드 파일들을 서빙
    react_build_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'build')
    
    if os.path.exists(react_build_path):
        # React 라우터를 위한 catch-all 패턴
        urlpatterns += [
            # static 파일들 서빙 (JS, CSS, 이미지 등)
            re_path(r'^static/(?P<path>.*)$', serve, {
                'document_root': os.path.join(react_build_path, 'static'),
            }),
            # manifest.json, favicon 등
            re_path(r'^(?P<path>manifest\.json|favicon\.ico|robots\.txt)$', serve, {
                'document_root': react_build_path,
            }),
            # 모든 다른 경로는 React의 index.html로 리다이렉트 (SPA 라우팅)
            re_path(r'^(?!api/)(?!admin/)(?!stamp).*', TemplateView.as_view(
                template_name='index.html'
            )),
        ]
    else:
        print("Warning: React build directory not found. Run 'npm run build' in frontend directory.")
