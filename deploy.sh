#!/bin/bash

# QR 스탬프 투어 - 통합 배포 스크립트 (Linux/Mac)

set -e  # 오류 발생 시 스크립트 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 옵션 파싱
PRODUCTION=false
BUILD=false
TEST=false
HELP=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --production)
      PRODUCTION=true
      shift
      ;;
    --build)
      BUILD=true
      shift
      ;;
    --test)
      TEST=true
      shift
      ;;
    --help)
      HELP=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# 도움말 표시
if [ "$HELP" = true ]; then
    echo -e "${CYAN}=== QR 스탬프 투어 배포 스크립트 ===${NC}"
    echo ""
    echo -e "${YELLOW}사용법:${NC}"
    echo "  ./deploy.sh --build        # 프론트엔드 빌드만 실행"
    echo "  ./deploy.sh --test         # 로컬 프로덕션 모드 테스트"
    echo "  ./deploy.sh --production   # 프로덕션 배포"
    echo "  ./deploy.sh --help         # 이 도움말 표시"
    echo ""
    echo -e "${GREEN}예제:${NC}"
    echo "  ./deploy.sh --build --test   # 빌드 후 테스트"
    exit 0
fi

# 스크립트 시작
echo -e "${CYAN}🏮 QR 스탬프 투어 - 배포 스크립트 시작${NC}"
echo ""

# 프로젝트 루트 디렉토리 확인
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ 오류: 프로젝트 루트 디렉토리에서 실행해주세요.${NC}"
    echo -e "${RED}   frontend/ 와 backend/ 디렉토리가 있는 곳에서 실행하세요.${NC}"
    exit 1
fi

# 1. 프론트엔드 빌드
if [ "$BUILD" = true ] || [ "$PRODUCTION" = true ] || [ "$TEST" = true ]; then
    echo -e "${GREEN}📦 1단계: 프론트엔드 빌드 시작...${NC}"
    
    cd frontend
    
    # Node.js 및 npm 설치 확인
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 오류: npm이 설치되어 있지 않습니다.${NC}"
        echo -e "${RED}   Node.js를 설치하고 다시 시도해주세요.${NC}"
        exit 1
    fi
    
    # 의존성 설치
    echo -e "${YELLOW}  📥 패키지 설치 중...${NC}"
    npm install
    
    # 프로덕션 빌드
    echo -e "${YELLOW}  🔨 프로덕션 빌드 생성 중...${NC}"
    npm run build
    
    echo -e "${GREEN}  ✅ 프론트엔드 빌드 완료!${NC}"
    cd ..
fi

# 2. 백엔드 설정 및 정적 파일 수집
if [ "$PRODUCTION" = true ] || [ "$TEST" = true ]; then
    echo -e "${GREEN}⚙️  2단계: 백엔드 설정...${NC}"
    
    cd backend
    
    # Python 가상환경 확인
    if [ ! -f "venv/bin/python" ]; then
        echo -e "${RED}❌ 오류: Python 가상환경이 없습니다.${NC}"
        echo -e "${RED}   backend/ 디렉토리에서 'python -m venv venv' 실행 후 다시 시도하세요.${NC}"
        exit 1
    fi
    
    # 가상환경 활성화
    echo -e "${YELLOW}  🐍 Python 가상환경 활성화...${NC}"
    source venv/bin/activate
    
    # 환경변수 설정
    if [ "$PRODUCTION" = true ]; then
        echo -e "${YELLOW}  🔐 프로덕션 환경변수 적용...${NC}"
        if [ -f ".env.production" ]; then
            cp .env.production .env
        else
            echo -e "${YELLOW}⚠️  경고: .env.production 파일이 없습니다.${NC}"
            echo -e "${YELLOW}   기본 .env 파일을 사용합니다.${NC}"
        fi
    fi
    
    # Django 정적 파일 수집
    echo -e "${YELLOW}  📁 Django 정적 파일 수집...${NC}"
    python manage.py collectstatic --noinput
    
    # 데이터베이스 마이그레이션 (프로덕션에서는 주의)
    if [ "$PRODUCTION" = false ]; then
        echo -e "${YELLOW}  🗃️  데이터베이스 마이그레이션...${NC}"
        python manage.py migrate || echo -e "${YELLOW}⚠️  경고: 데이터베이스 마이그레이션 실패${NC}"
    else
        echo -e "${YELLOW}  ⚠️  프로덕션 모드: 마이그레이션을 수동으로 실행하세요.${NC}"
        echo -e "     python manage.py migrate"
    fi
    
    echo -e "${GREEN}  ✅ 백엔드 설정 완료!${NC}"
    cd ..
fi

# 3. 테스트 실행
if [ "$TEST" = true ]; then
    echo -e "${GREEN}🧪 3단계: 로컬 프로덕션 모드 테스트...${NC}"
    
    cd backend
    source venv/bin/activate
    
    echo -e "${YELLOW}  🚀 Django 개발 서버 시작 (프로덕션 모드)...${NC}"
    echo -e "     서버가 시작되면 브라우저에서 http://localhost:8000 을 확인하세요."
    echo -e "     Ctrl+C로 서버를 종료할 수 있습니다."
    echo ""
    
    # 프로덕션 모드로 서버 실행
    python manage.py runserver 0.0.0.0:8000
    
    cd ..
fi

# 4. 프로덕션 배포
if [ "$PRODUCTION" = true ]; then
    echo -e "${GREEN}🚀 4단계: 프로덕션 배포...${NC}"
    
    echo -e "${YELLOW}  📋 프로덕션 배포 체크리스트:${NC}"
    echo "     ✅ 프론트엔드 빌드 완료"
    echo "     ✅ 백엔드 정적 파일 수집 완료"
    echo "     ⚠️  프로덕션 환경변수 확인 필요"
    echo "     ⚠️  데이터베이스 마이그레이션 필요"
    echo "     ⚠️  보안 설정 확인 필요"
    echo ""
    echo -e "${CYAN}  📂 배포 파일 위치:${NC}"
    echo "     - 프론트엔드 빌드: frontend/build/"
    echo "     - 백엔드 정적 파일: backend/staticfiles/"
    echo "     - Django 프로젝트: backend/"
    echo ""
    echo -e "${YELLOW}  🔧 추가 작업 필요:${NC}"
    echo "     1. 프로덕션 서버에 파일 업로드"
    echo "     2. 웹 서버 (Nginx/Apache) 설정"
    echo "     3. WSGI 서버 (Gunicorn) 설정"
    echo "     4. SSL 인증서 설정"
    echo "     5. 데이터베이스 백업"
fi

echo ""
echo -e "${GREEN}🎉 배포 스크립트 완료!${NC}"

# 요약 정보 출력
echo ""
echo -e "${CYAN}📊 배포 요약:${NC}"
echo "  - 프로젝트: QR 스탬프 투어 시스템"
echo "  - 프론트엔드: React 19.1.1 + TypeScript"
echo "  - 백엔드: Django 5.2.5 + MySQL"
if [ "$PRODUCTION" = true ]; then
    echo "  - 모드: 프로덕션"
else
    echo "  - 모드: 개발/테스트"
fi
echo "  - 날짜: $(date '+%Y-%m-%d %H:%M:%S')"
