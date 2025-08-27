# QR 스탬프 투어 - 통합 배포 스크립트 (Windows PowerShell)

param(
    [switch]$Production,
    [switch]$Build,
    [switch]$Test,
    [switch]$Help
)

# 색상 출력 함수
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

# 도움말 표시
if ($Help) {
    Write-ColorText "=== QR 스탬프 투어 배포 스크립트 ===" "Cyan"
    Write-Host ""
    Write-ColorText "사용법:" "Yellow"
    Write-Host "  .\deploy.ps1 -Build       # 프론트엔드 빌드만 실행"
    Write-Host "  .\deploy.ps1 -Test        # 로컬 프로덕션 모드 테스트"
    Write-Host "  .\deploy.ps1 -Production  # 프로덕션 배포 (권한 필요)"
    Write-Host "  .\deploy.ps1 -Help        # 이 도움말 표시"
    Write-Host ""
    Write-ColorText "예제:" "Green"
    Write-Host "  .\deploy.ps1 -Build -Test   # 빌드 후 테스트"
    exit 0
}

# 스크립트 시작
Write-ColorText "🏮 QR 스탬프 투어 - 배포 스크립트 시작" "Cyan"
Write-Host ""

# 프로젝트 루트 디렉토리 확인
if (-not (Test-Path "frontend" -PathType Container) -or -not (Test-Path "backend" -PathType Container)) {
    Write-ColorText "❌ 오류: 프로젝트 루트 디렉토리에서 실행해주세요." "Red"
    Write-ColorText "   frontend/ 와 backend/ 디렉토리가 있는 곳에서 실행하세요." "Red"
    exit 1
}

# 1. 프론트엔드 빌드
if ($Build -or $Production -or $Test) {
    Write-ColorText "📦 1단계: 프론트엔드 빌드 시작..." "Green"
    
    # 프론트엔드 디렉토리로 이동
    Push-Location frontend
    
    try {
        # Node.js 및 npm 설치 확인
        if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
            Write-ColorText "❌ 오류: npm이 설치되어 있지 않습니다." "Red"
            Write-ColorText "   Node.js를 설치하고 다시 시도해주세요." "Red"
            exit 1
        }
        
        # 의존성 설치
        Write-ColorText "  📥 패키지 설치 중..." "Yellow"
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install 실패"
        }
        
        # 프로덕션 빌드
        Write-ColorText "  🔨 프로덕션 빌드 생성 중..." "Yellow"
        if ($Production) {
            # 프로덕션 환경변수 사용
            npm run build
        } else {
            # 개발/테스트용 빌드
            npm run build
        }
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build 실패"
        }
        
        Write-ColorText "  ✅ 프론트엔드 빌드 완료!" "Green"
        
    } catch {
        Write-ColorText "❌ 프론트엔드 빌드 실패: $($_.Exception.Message)" "Red"
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
}

# 2. 백엔드 설정 및 정적 파일 수집
if ($Production -or $Test) {
    Write-ColorText "⚙️  2단계: 백엔드 설정..." "Green"
    
    Push-Location backend
    
    try {
        # Python 가상환경 활성화 확인
        if (-not (Test-Path "venv\Scripts\python.exe")) {
            Write-ColorText "❌ 오류: Python 가상환경이 없습니다." "Red"
            Write-ColorText "   backend/ 디렉토리에서 'python -m venv venv' 실행 후 다시 시도하세요." "Red"
            exit 1
        }
        
        # 가상환경 활성화
        Write-ColorText "  🐍 Python 가상환경 활성화..." "Yellow"
        & ".\venv\Scripts\Activate.ps1"
        
        # 환경변수 설정
        if ($Production) {
            Write-ColorText "  🔐 프로덕션 환경변수 적용..." "Yellow"
            if (Test-Path ".env.production") {
                Copy-Item ".env.production" ".env" -Force
            } else {
                Write-ColorText "⚠️  경고: .env.production 파일이 없습니다." "Yellow"
                Write-ColorText "   기본 .env 파일을 사용합니다." "Yellow"
            }
        }
        
        # Django 정적 파일 수집
        Write-ColorText "  📁 Django 정적 파일 수집..." "Yellow"
        python manage.py collectstatic --noinput
        if ($LASTEXITCODE -ne 0) {
            throw "collectstatic 실패"
        }
        
        # 데이터베이스 마이그레이션 (프로덕션에서는 주의)
        if (-not $Production) {
            Write-ColorText "  🗃️  데이터베이스 마이그레이션..." "Yellow"
            python manage.py migrate
            if ($LASTEXITCODE -ne 0) {
                Write-ColorText "⚠️  경고: 데이터베이스 마이그레이션 실패" "Yellow"
            }
        } else {
            Write-ColorText "  ⚠️  프로덕션 모드: 마이그레이션을 수동으로 실행하세요." "Yellow"
            Write-ColorText "     python manage.py migrate" "Gray"
        }
        
        Write-ColorText "  ✅ 백엔드 설정 완료!" "Green"
        
    } catch {
        Write-ColorText "❌ 백엔드 설정 실패: $($_.Exception.Message)" "Red"
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
}

# 3. 테스트 실행
if ($Test) {
    Write-ColorText "🧪 3단계: 로컬 프로덕션 모드 테스트..." "Green"
    
    Push-Location backend
    
    try {
        Write-ColorText "  🚀 Django 개발 서버 시작 (프로덕션 모드)..." "Yellow"
        Write-ColorText "     서버가 시작되면 브라우저에서 http://localhost:8000 을 확인하세요." "Gray"
        Write-ColorText "     Ctrl+C로 서버를 종료할 수 있습니다." "Gray"
        Write-Host ""
        
        # 프로덕션 모드로 서버 실행
        & ".\venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
        
    } catch {
        Write-ColorText "❌ 테스트 서버 실행 실패: $($_.Exception.Message)" "Red"
    } finally {
        Pop-Location
    }
}

# 4. 프로덕션 배포
if ($Production) {
    Write-ColorText "🚀 4단계: 프로덕션 배포..." "Green"
    
    Write-ColorText "  📋 프로덕션 배포 체크리스트:" "Yellow"
    Write-Host "     ✅ 프론트엔드 빌드 완료"
    Write-Host "     ✅ 백엔드 정적 파일 수집 완료"
    Write-Host "     ⚠️  프로덕션 환경변수 확인 필요"
    Write-Host "     ⚠️  데이터베이스 마이그레이션 필요"
    Write-Host "     ⚠️  보안 설정 확인 필요"
    Write-Host ""
    Write-ColorText "  📂 배포 파일 위치:" "Cyan"
    Write-Host "     - 프론트엔드 빌드: frontend/build/"
    Write-Host "     - 백엔드 정적 파일: backend/staticfiles/"
    Write-Host "     - Django 프로젝트: backend/"
    Write-Host ""
    Write-ColorText "  🔧 추가 작업 필요:" "Yellow"
    Write-Host "     1. 프로덕션 서버에 파일 업로드"
    Write-Host "     2. 웹 서버 (Nginx/Apache) 설정"
    Write-Host "     3. WSGI 서버 (Gunicorn) 설정"
    Write-Host "     4. SSL 인증서 설정"
    Write-Host "     5. 데이터베이스 백업"
}

Write-Host ""
Write-ColorText "🎉 배포 스크립트 완료!" "Green"

# 요약 정보 출력
Write-Host ""
Write-ColorText "📊 배포 요약:" "Cyan"
Write-Host "  - 프로젝트: QR 스탬프 투어 시스템"
Write-Host "  - 프론트엔드: React 19.1.1 + TypeScript"
Write-Host "  - 백엔드: Django 5.2.5 + MySQL"
if ($Production) {
    Write-Host "  - 모드: 프로덕션"
} else {
    Write-Host "  - 모드: 개발/테스트"
}
Write-Host "  - 날짜: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
