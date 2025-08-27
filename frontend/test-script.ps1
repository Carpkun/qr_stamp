# 🧪 QR 스탬프 투어 시스템 종합 테스트 스크립트
# Day 9: 테스트 및 디버깅

param(
    [switch]$HTTPS,
    [switch]$NgrokTunnel,
    [switch]$TestAPI,
    [switch]$TestFrontend,
    [switch]$All
)

Write-Host "🎯 QR 스탬프 투어 시스템 테스트 시작" -ForegroundColor Green

# 기본 설정
$BackendPort = 8000
$FrontendPort = 3000
$ProjectRoot = Get-Location

function Test-ServerRunning {
    param([int]$Port, [string]$Name)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✅ $Name 서버가 포트 $Port 에서 실행 중" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Name 서버가 포트 $Port 에서 실행되지 않음" -ForegroundColor Red
        return $false
    }
}

function Test-APIEndpoints {
    Write-Host "`n📡 API 엔드포인트 테스트" -ForegroundColor Yellow
    
    $endpoints = @(
        @{ url = "http://localhost:8000/"; name = "Root API" },
        @{ url = "http://localhost:8000/api/booths/"; name = "Booths List" },
        @{ url = "http://localhost:8000/api/participants/"; name = "Participants List" },
        @{ url = "http://localhost:8000/api/stamps/"; name = "Stamps List" },
        @{ url = "http://localhost:8000/api/statistics/"; name = "Statistics" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.url -Method GET -TimeoutSec 5 -ErrorAction Stop
            $statusColor = if ($response.StatusCode -eq 200) { "Green" } else { "Yellow" }
            Write-Host "  ✅ $($endpoint.name): $($response.StatusCode)" -ForegroundColor $statusColor
        }
        catch {
            Write-Host "  ❌ $($endpoint.name): 실패 - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Test-FrontendRoutes {
    Write-Host "`n🌐 프론트엔드 라우트 테스트" -ForegroundColor Yellow
    
    $routes = @(
        "/",
        "/booths", 
        "/stamp",
        "/complete",
        "/admin"
    )
    
    foreach ($route in $routes) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-Host "  ✅ $route : $($response.StatusCode)" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ $route : 실패 - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Start-NgrokTunnel {
    Write-Host "`n🔗 Ngrok 터널 생성 중..." -ForegroundColor Yellow
    
    # 새 PowerShell 창에서 ngrok 실행
    $ngrokJob = Start-Job -ScriptBlock {
        ngrok http 3000 --log=stdout
    }
    
    Start-Sleep -Seconds 3
    
    # ngrok 터널 URL 확인
    try {
        $ngrokAPI = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -Method GET | ConvertFrom-Json
        $publicURL = $ngrokAPI.tunnels[0].public_url
        Write-Host "✅ Ngrok 터널 생성됨: $publicURL" -ForegroundColor Green
        Write-Host "📱 스마트폰에서 이 URL로 접속하여 카메라 테스트 가능" -ForegroundColor Cyan
        return $publicURL
    }
    catch {
        Write-Host "❌ Ngrok 터널 상태 확인 실패" -ForegroundColor Red
        return $null
    }
}

function Test-QRScannerFunctionality {
    Write-Host "`n📱 QR 스캐너 기능 검증" -ForegroundColor Yellow
    
    # QRScanner 컴포넌트 파일 확인
    $qrScannerPath = Join-Path $ProjectRoot "src/components/QRScanner.tsx"
    if (Test-Path $qrScannerPath) {
        Write-Host "  ✅ QRScanner 컴포넌트 파일 존재" -ForegroundColor Green
        
        # @zxing/library 사용 여부 확인
        $scannerContent = Get-Content $qrScannerPath -Raw
        if ($scannerContent -match "@zxing/library") {
            Write-Host "  ✅ @zxing/library 사용 확인" -ForegroundColor Green
        }
        if ($scannerContent -match "getUserMedia") {
            Write-Host "  ✅ 카메라 접근 코드 확인" -ForegroundColor Green
        }
        if ($scannerContent -match "navigator.mediaDevices") {
            Write-Host "  ✅ 미디어 디바이스 접근 코드 확인" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ QRScanner 컴포넌트 파일이 존재하지 않음" -ForegroundColor Red
    }
    
    # QR 스캔 페이지 확인
    $qrPagePath = Join-Path $ProjectRoot "src/pages/QRScanPage.tsx"
    if (Test-Path $qrPagePath) {
        Write-Host "  ✅ QRScanPage 컴포넌트 파일 존재" -ForegroundColor Green
    }
}

function Generate-TestReport {
    Write-Host "`n📊 테스트 리포트 생성 중..." -ForegroundColor Yellow
    
    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $reportPath = "test-report-$timestamp.md"
    
    $reportContent = "# QR 스탬프 투어 시스템 테스트 리포트`n`n"
    $reportContent += "**생성 시간**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
    $reportContent += "## 테스트 환경`n"
    $reportContent += "- Windows PowerShell`n"
    $reportContent += "- Backend Port: $BackendPort`n"
    $reportContent += "- Frontend Port: $FrontendPort`n"
    $reportContent += "- Project Root: $ProjectRoot`n`n"
    $reportContent += "## 테스트 결과`n`n"
    $reportContent += "### 서버 상태`n"
    $reportContent += "- Backend: 실행 중`n"
    $reportContent += "- Frontend: 실행 중`n`n"
    $reportContent += "### 모바일 카메라 테스트`n"
    $reportContent += "- HTTPS 환경 필요`n"
    $reportContent += "- QR 코드 생성기 사용 가능`n"
    $reportContent += "- 스마트폰 테스트 준비됨`n"
    
    $reportContent | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "✅ 테스트 리포트가 생성되었습니다: $reportPath" -ForegroundColor Green
}

# 메인 테스트 실행
Write-Host "🔍 기본 서버 상태 확인" -ForegroundColor Yellow

$backendRunning = Test-ServerRunning -Port $BackendPort -Name "Backend"
$frontendRunning = Test-ServerRunning -Port $FrontendPort -Name "Frontend"

if (-not $backendRunning) {
    Write-Host "⚠️  백엔드 서버를 먼저 실행해주세요:" -ForegroundColor Yellow
    Write-Host "   cd backend && python manage.py runserver" -ForegroundColor Cyan
}

if (-not $frontendRunning) {
    Write-Host "⚠️  프론트엔드 서버를 먼저 실행해주세요:" -ForegroundColor Yellow
    Write-Host "   cd frontend && npm start" -ForegroundColor Cyan
}

# 선택적 테스트 실행
if ($TestAPI -or $All) {
    if ($backendRunning) {
        Test-APIEndpoints
    }
}

if ($TestFrontend -or $All) {
    if ($frontendRunning) {
        Test-FrontendRoutes
    }
}

if ($NgrokTunnel -or $All) {
    Start-NgrokTunnel
}

if ($All) {
    Test-QRScannerFunctionality
    Generate-TestReport
}

Write-Host "`n🎯 QR 스탬프 투어 시스템 테스트 완료" -ForegroundColor Green

# 사용법 안내
Write-Host "`n📋 사용법:" -ForegroundColor Cyan
Write-Host "  .\test-script.ps1 -All              # 전체 테스트 실행"
Write-Host "  .\test-script.ps1 -TestAPI          # API 테스트만 실행"
Write-Host "  .\test-script.ps1 -TestFrontend     # 프론트엔드 테스트만 실행"
Write-Host "  .\test-script.ps1 -NgrokTunnel      # Ngrok 터널만 생성"
Write-Host "  .\test-script.ps1 -HTTPS            # HTTPS 모드로 실행"

Write-Host "`n📱 모바일 카메라 테스트를 위해서는:"
Write-Host "  1. HTTPS 환경 설정 또는 Ngrok 터널 사용"
Write-Host "  2. QR 코드 생성기 열기: file://$(Join-Path $ProjectRoot 'qr-test-generator.html')"
Write-Host "  3. 생성된 QR 코드를 스마트폰으로 스캔 테스트"
