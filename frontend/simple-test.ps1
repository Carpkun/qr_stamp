# QR 스탬프 투어 시스템 기본 테스트 스크립트

Write-Host "🎯 QR 스탬프 투어 시스템 테스트 시작" -ForegroundColor Green

# 서버 상태 확인
Write-Host "`n🔍 서버 상태 확인" -ForegroundColor Yellow

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 3
    Write-Host "✅ 백엔드 서버: 실행 중 (응답: $($backendResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 백엔드 서버: 실행되지 않음" -ForegroundColor Red
    Write-Host "   실행 방법: cd backend && python manage.py runserver" -ForegroundColor Cyan
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET -TimeoutSec 3
    Write-Host "✅ 프론트엔드 서버: 실행 중 (응답: $($frontendResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 프론트엔드 서버: 실행되지 않음" -ForegroundColor Red
    Write-Host "   실행 방법: cd frontend && npm start" -ForegroundColor Cyan
}

# API 엔드포인트 테스트
Write-Host "`n📡 API 엔드포인트 테스트" -ForegroundColor Yellow

$apiEndpoints = @(
    "http://localhost:8000/api/booths/",
    "http://localhost:8000/api/participants/",
    "http://localhost:8000/api/stamps/",
    "http://localhost:8000/api/statistics/"
)

foreach ($endpoint in $apiEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 5
        Write-Host "  ✅ $endpoint - 상태: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $endpoint - 실패" -ForegroundColor Red
    }
}

# 프론트엔드 라우트 테스트
Write-Host "`n🌐 프론트엔드 라우트 테스트" -ForegroundColor Yellow

$frontendRoutes = @("/", "/booths", "/stamp", "/complete", "/admin")

foreach ($route in $frontendRoutes) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -Method GET -TimeoutSec 5
        Write-Host "  ✅ $route - 상태: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $route - 실패" -ForegroundColor Red
    }
}

# QR 스캐너 컴포넌트 확인
Write-Host "`n📱 QR 스캐너 컴포넌트 확인" -ForegroundColor Yellow

if (Test-Path "src/components/QRScanner.tsx") {
    Write-Host "  ✅ QRScanner 컴포넌트 파일 존재" -ForegroundColor Green
} else {
    Write-Host "  ❌ QRScanner 컴포넌트 파일이 없음" -ForegroundColor Red
}

if (Test-Path "src/pages/QRScanPage.tsx") {
    Write-Host "  ✅ QRScanPage 페이지 파일 존재" -ForegroundColor Green
} else {
    Write-Host "  ❌ QRScanPage 페이지 파일이 없음" -ForegroundColor Red
}

# 모바일 테스트 안내
Write-Host "`n📱 모바일 카메라 테스트 안내" -ForegroundColor Cyan
Write-Host "1. HTTPS 환경에서 실행: " -NoNewline
Write-Host "HTTPS=true npm start" -ForegroundColor Yellow
Write-Host "2. 또는 Ngrok 터널 사용: " -NoNewline
Write-Host "ngrok http 3000" -ForegroundColor Yellow
Write-Host "3. QR 코드 생성기 열기: " -NoNewline
$qrGeneratorPath = Join-Path (Get-Location) "qr-test-generator.html"
Write-Host "file://$qrGeneratorPath" -ForegroundColor Yellow

Write-Host "`n🎯 테스트 완료!" -ForegroundColor Green
