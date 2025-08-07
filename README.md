# 소양강문화제 QR 스탬프 투어 시스템

춘천문화원에서 개최하는 소양강문화제 체험부스 QR 코드 참여 시스템

## 프로젝트 구조

```
qr_stamp/
├── backend/                 # Django 백엔드
│   ├── qr_stamp_backend/   # 프로젝트 설정
│   ├── venv/               # 가상환경
│   ├── manage.py           # Django 관리 명령
│   └── .env                # 환경변수 (Git 제외)
├── frontend/               # React 프론트엔드
│   ├── src/                # 소스 코드
│   ├── public/             # 정적 파일
│   └── package.json        # 패키지 설정
├── stamp.md               # 프로젝트 요구사항
├── README.md              # 이 파일
└── .gitignore             # Git 제외 파일
```

## 기술 스택

### 백엔드
- **Django 5.2.5**: 웹 프레임워크
- **Django REST Framework**: API 개발
- **MySQL**: 데이터베이스
- **django-cors-headers**: CORS 처리
- **python-dotenv**: 환경변수 관리

### 프론트엔드
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **React Router**: 라우팅
- **Axios**: HTTP 클라이언트

## 개발 환경 설정

### 1. MySQL 설치 (필수)
1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) 다운로드 및 설치
2. MySQL Workbench 설치 (선택사항)
3. 루트 비밀번호 설정

### 2. MySQL 데이터베이스 생성
```sql
CREATE DATABASE qr_stamp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 백엔드 실행
```bash
cd backend
# 가상환경 활성화 (Windows)
.\venv\Scripts\Activate.ps1

# Django 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 개발 서버 실행
python manage.py runserver
```

### 4. 프론트엔드 실행
```bash
cd frontend
npm start
```

## 환경변수 설정

`backend/.env` 파일에서 다음 값들을 설정해주세요:

```env
# 개발용 환경변수
DEBUG=True
SECRET_KEY=django-insecure-dev-key-for-local-development-only
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL 데이터베이스 설정
DB_NAME=qr_stamp_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# CORS 설정
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 개발 일정 (10일)

### 1일차 ✅
- [x] 개발 환경 설정
- [x] Django 프로젝트 생성
- [x] React 프로젝트 생성
- [x] GitHub 저장소 초기화
- [x] 기본 설정 완료

### 2일차 (예정)
- [ ] 데이터베이스 모델 설계
- [ ] Django 앱 생성
- [ ] 기본 모델 구현

### 3-10일차
상세 일정은 개발 진행에 따라 업데이트 예정

## API 엔드포인트 (예정)

- `POST /api/participants/` - 새 참여자 생성
- `POST /api/stamp/` - 스탬프 기록
- `GET /api/participants/{uuid}/` - 참여자 정보 조회
- `GET /api/admin/stats/` - 관리자 통계

## 배포 환경

- **백엔드**: PythonAnywhere
- **프론트엔드**: Vercel
- **데이터베이스**: MySQL (PythonAnywhere)

## 라이센스

이 프로젝트는 춘천문화원의 소양강문화제를 위한 전용 시스템입니다.
