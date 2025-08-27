# 🚀 QR 스탬프 투어 - 배포 가이드

이 문서는 QR 스탬프 투어 시스템의 배포 과정을 설명합니다.

## 📋 배포 개요

### 아키텍처
- **프론트엔드**: React (SPA) → 정적 파일로 빌드
- **백엔드**: Django → React 빌드 파일을 static serving
- **데이터베이스**: MySQL
- **배포 방식**: 단일 Django 서버에서 API + 프론트엔드 통합 서빙

### 배포 흐름
1. React 앱을 프로덕션 빌드 (`npm run build`)
2. Django static files 설정으로 React 빌드 파일 서빙
3. Django에서 API 및 SPA 라우팅 모두 처리

---

## 🛠️ 자동 배포 스크립트

### Windows (PowerShell)
```powershell
# 프론트엔드 빌드만
.\deploy.ps1 -Build

# 빌드 + 로컬 테스트
.\deploy.ps1 -Build -Test

# 프로덕션 배포
.\deploy.ps1 -Production

# 도움말
.\deploy.ps1 -Help
```

### Linux/Mac (Bash)
```bash
# 실행 권한 부여 (최초 1회)
chmod +x deploy.sh

# 프론트엔드 빌드만
./deploy.sh --build

# 빌드 + 로컬 테스트
./deploy.sh --build --test

# 프로덕션 배포
./deploy.sh --production

# 도움말
./deploy.sh --help
```

---

## 📝 수동 배포 과정

### 1단계: 프론트엔드 빌드

```bash
cd frontend

# 의존성 설치
npm install

# 프로덕션 빌드 생성
npm run build
```

**결과**: `frontend/build/` 디렉토리에 최적화된 정적 파일 생성

### 2단계: 백엔드 설정

```bash
cd backend

# Python 가상환경 활성화
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# 프로덕션 환경변수 적용 (선택사항)
cp .env.production .env

# Django 정적 파일 수집
python manage.py collectstatic --noinput

# 데이터베이스 마이그레이션 (필요한 경우)
python manage.py migrate
```

### 3단계: 서버 실행

```bash
# 개발 서버 (테스트용)
python manage.py runserver 0.0.0.0:8000

# 프로덕션 (Gunicorn 권장)
gunicorn qr_stamp_backend.wsgi:application --bind 0.0.0.0:8000
```

---

## ⚙️ 환경 설정

### 프론트엔드 환경변수

#### 개발용 (`.env`)
```env
REACT_APP_API_URL=https://your-localtunnel.loca.lt/api
REACT_APP_ENABLE_DEV_TOOLS=true
```

#### 프로덕션용 (`.env.production`)
```env
REACT_APP_API_URL=/api
REACT_APP_ENABLE_DEV_TOOLS=false
GENERATE_SOURCEMAP=false
```

### 백엔드 환경변수

#### 개발용 (`backend/.env`)
```env
DEBUG=True
SECRET_KEY=django-insecure-dev-key
ALLOWED_HOSTS=localhost,127.0.0.1,*.loca.lt
DB_NAME=qr_stamp_db
DB_USER=root
DB_PASSWORD=your_password
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-tunnel.loca.lt
```

#### 프로덕션용 (`backend/.env.production`)
```env
DEBUG=False
SECRET_KEY=SECURE_PRODUCTION_KEY_HERE
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=qr_stamp_db
DB_USER=db_user
DB_PASSWORD=secure_password
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 🖥️ 서버 배포

### 옵션 1: 간단한 단일 서버 배포

1. **서버 요구사항**:
   - Ubuntu 20.04+ / CentOS 8+ / Windows Server
   - Python 3.9+
   - MySQL 8.0+
   - Node.js 18+ (빌드용)

2. **배포 과정**:
   ```bash
   # 프로젝트 파일 업로드
   scp -r . user@server:/path/to/project/
   
   # 서버에서 배포 스크립트 실행
   ssh user@server
   cd /path/to/project/
   ./deploy.sh --production
   ```

### 옵션 2: Nginx + Gunicorn (권장)

#### Nginx 설정 (`/etc/nginx/sites-available/qr_stamp`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # React 정적 파일
    location /static/ {
        alias /path/to/project/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 요청
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Django 관리자
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # React SPA (모든 다른 요청)
    location / {
        try_files $uri $uri/ /index.html;
        root /path/to/project/frontend/build;
        index index.html;
    }
}
```

#### Gunicorn 서비스 (`/etc/systemd/system/qr_stamp.service`)
```ini
[Unit]
Description=QR Stamp Tour Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/project/backend
Environment="PATH=/path/to/project/backend/venv/bin"
ExecStart=/path/to/project/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 qr_stamp_backend.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

### 옵션 3: Docker 배포 (고급)

#### Dockerfile
```dockerfile
# 빌드 스테이지
FROM node:18 AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Python 런타임
FROM python:3.9
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend /frontend/build /frontend/build
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "qr_stamp_backend.wsgi:application"]
```

---

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. React 빌드 파일이 로드되지 않음
```bash
# Django static files 설정 확인
python manage.py collectstatic --noinput
python manage.py runserver --settings=qr_stamp_backend.settings
```

#### 2. API 호출 실패 (CORS 오류)
```python
# settings.py 확인
CORS_ALLOW_ALL_ORIGINS = False  # 프로덕션에서는 False
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']
```

#### 3. 정적 파일 경로 문제
```python
# settings.py 확인
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR.parent, 'frontend', 'build', 'static'),
]
```

### 디버깅 도구

```bash
# Django 디버그 모드로 실행 (개발 전용)
DEBUG=True python manage.py runserver

# 로그 확인
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Django 로그
python manage.py check
python manage.py check --deploy  # 프로덕션 체크
```

---

## ✅ 배포 체크리스트

### 프로덕션 배포 전 확인사항

- [ ] 프로덕션 환경변수 설정 완료
- [ ] `DEBUG=False` 설정
- [ ] 보안 키 (SECRET_KEY) 변경
- [ ] ALLOWED_HOSTS 설정
- [ ] CORS 설정 확인
- [ ] 데이터베이스 백업
- [ ] SSL 인증서 설정
- [ ] 도메인 DNS 설정
- [ ] 로그 모니터링 설정

### 배포 후 테스트

- [ ] 메인 페이지 로드 확인
- [ ] QR 스캔 기능 테스트
- [ ] API 엔드포인트 응답 확인
- [ ] 관리자 페이지 접근 확인
- [ ] 모바일 환경 테스트
- [ ] 성능 모니터링

---

## 📊 모니터링 및 유지보수

### 로그 모니터링
```bash
# Django 로그 (설정 필요)
tail -f /var/log/qr_stamp/django.log

# Nginx 접근 로그
tail -f /var/log/nginx/access.log

# 시스템 리소스
htop
df -h
```

### 정기적인 작업
- 데이터베이스 백업 (일일)
- 로그 파일 정리 (주간)
- 보안 업데이트 (월간)
- 성능 모니터링 및 최적화

---

**마지막 업데이트**: 2025-08-25  
**작성자**: QR 스탬프 투어 개발팀
