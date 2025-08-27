# PythonAnywhere WSGI 설정 파일
# 이 파일을 PythonAnywhere의 /var/www/ccculture_pythonanywhere_com_wsgi.py 로 복사하세요

import os
import sys

# 프로젝트 경로를 Python path에 추가
path = '/home/ccculture/qr_stamp/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# 가상환경 활성화
# PythonAnywhere에서는 가상환경 경로가 다를 수 있습니다
# 아래 경로를 실제 가상환경 경로로 수정하세요
venv_path = '/home/ccculture/qr_stamp/backend/venv'
activate_this = os.path.join(venv_path, 'bin', 'activate_this.py')

# activate_this.py가 없는 경우를 대비한 대안 방법
if os.path.exists(activate_this):
    with open(activate_this) as file_:
        exec(file_.read(), dict(__file__=activate_this))
else:
    # 가상환경 경로를 직접 추가
    site_packages = os.path.join(venv_path, 'lib', 'python3.10', 'site-packages')
    if os.path.exists(site_packages):
        sys.path.insert(0, site_packages)

# Django 환경변수 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'qr_stamp_backend.settings')

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
