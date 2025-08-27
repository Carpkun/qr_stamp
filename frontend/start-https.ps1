# HTTPS React 개발 서버 시작 스크립트

Write-Host "🔐 HTTPS React 개발 서버 시작" -ForegroundColor Green

# 환경변수 설정
$env:HTTPS = "true"
$env:SSL_CRT_FILE = ""
$env:SSL_KEY_FILE = ""

Write-Host "📋 HTTPS 환경변수 설정 완료" -ForegroundColor Yellow
Write-Host "⚠️  브라우저에서 자체 서명 인증서 경고가 나타나면 '고급' -> '안전하지 않음' 클릭하여 진행하세요" -ForegroundColor Cyan

# React 개발 서버 시작
Write-Host "🚀 React 개발 서버를 HTTPS로 시작합니다..." -ForegroundColor Green
Write-Host "📱 스마트폰에서 https://localhost:3000 으로 접속하여 카메라 테스트 가능" -ForegroundColor Cyan

npm start
