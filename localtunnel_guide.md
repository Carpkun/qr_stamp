# Localtunnel 사용 가이드
## React 앱을 외부에서 접속하는 방법

### 개요
이 가이드는 QR Stamp 프로젝트의 React 프론트엔드를 외부(LTE, 다른 네트워크)에서 접속할 수 있도록 localtunnel을 설정하는 방법을 설명합니다.

### 전제 조건
- Node.js 설치됨
- React 앱이 포트 3000에서 실행 중이어야 함
- localtunnel 패키지 설치됨 (`npx localtunnel` 사용 가능)

---

## 단계별 실행 과정

### 1단계: React 앱 백그라운드 실행

```powershell
# 현재 디렉토리 확인
cd C:\Users\rcour\Documents\Workspace\qr_stamp\frontend

# React 앱을 백그라운드에서 실행
Start-Process powershell -ArgumentList "-WindowStyle", "Minimized", "-Command", "npm start"
```

### 2단계: React 앱 실행 확인

```powershell
# 10초 대기 후 포트 3000 확인
Start-Sleep -Seconds 10
netstat -ano | findstr :3000
```

**예상 출력:**
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12396
TCP    127.0.0.1:3000         127.0.0.1:3186         ESTABLISHED     12396
...
```

### 3단계: Localtunnel 실행

```powershell
# 방법 1: 기본 실행 (랜덤 URL 생성)
npx localtunnel --port 3000

# 방법 2: 요청 로그와 함께 실행
npx localtunnel --port 3000 --print-requests

# 방법 3: 별도 터미널에서 실행 (권장)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx localtunnel --port 3000 --print-requests"
```

**예상 출력:**
```
your url is: https://wise-showers-add.loca.lt
```

### 4단계: 공용 IP 주소 확인

```powershell
# 공용 IP 주소 확인 (localtunnel 패스워드용)
Invoke-WebRequest -Uri "https://ipinfo.io/ip" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**예상 출력:**
```
106.251.74.198
```

---

## 스마트폰에서 접속 방법

### 1. URL 접속
생성된 localtunnel URL로 접속합니다.
- 예: `https://wise-showers-add.loca.lt`

### 2. 패스워드 입력
**패스워드**: 4단계에서 확인한 공용 IP 주소
- 예: `106.251.74.198`

### 3. 접속 완료
패스워드 입력 후 React 앱이 정상적으로 로드됩니다.

---

## 문제 해결

### 503 - Tunnel Unavailable 오류
1. React 앱이 실행 중인지 확인
2. Localtunnel을 다시 시작
3. 새로운 URL로 다시 접속

### "endpoint IP is not correct" 오류
- **사설 IP** (`192.168.x.x`) 대신 **공용 IP**를 패스워드로 사용해야 함
- 공용 IP 확인 명령어 재실행

### 연결이 느리거나 불안정한 경우
- 새로운 터널 생성: `npx localtunnel --port 3000`
- 다른 터널 서비스 사용 (ngrok 등)

---

## IP 주소 변경에 대한 이해

### 사설 IP (192.168.0.13)
- **의미**: 집 안 네트워크 내에서만 사용되는 주소
- **변경 이유**: 
  - DHCP 임대 만료 (현재 2시간마다)
  - 컴퓨터 재부팅
  - 네트워크 재연결
  - 공유기 재시작

### 공용 IP (106.251.74.198)
- **의미**: 인터넷에서 식별되는 실제 주소
- **변경 이유**:
  - ISP(인터넷 서비스 제공업체)의 정책
  - 모뎀/공유기 재시작
  - 일정 시간 간격 (통신사마다 다름)

---

## 자동화 스크립트

### 공용 IP 확인 스크립트
```powershell
# get_public_ip.ps1
function Get-PublicIP {
    try {
        $ip = Invoke-WebRequest -Uri "https://ipinfo.io/ip" -UseBasicParsing | Select-Object -ExpandProperty Content
        $ip = $ip.Trim()
        Write-Host "현재 공용 IP: $ip" -ForegroundColor Green
        $ip | Set-Clipboard
        Write-Host "✓ IP 주소가 클립보드에 복사되었습니다." -ForegroundColor Yellow
        return $ip
    }
    catch {
        Write-Host "공용 IP 확인에 실패했습니다." -ForegroundColor Red
    }
}

Get-PublicIP
```

### 전체 실행 스크립트
```powershell
# start_tunnel.ps1
Write-Host "=== QR Stamp Localtunnel 시작 ===" -ForegroundColor Cyan

# 1. React 앱 실행 확인
Write-Host "1. React 앱 상태 확인..." -ForegroundColor Yellow
$reactProcess = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.Path -like "*react-scripts*"}

if (-not $reactProcess) {
    Write-Host "React 앱을 시작합니다..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-WindowStyle", "Minimized", "-Command", "cd C:\Users\rcour\Documents\Workspace\qr_stamp\frontend; npm start"
    Start-Sleep -Seconds 15
}

# 2. Localtunnel 실행
Write-Host "2. Localtunnel 실행..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\rcour\Documents\Workspace\qr_stamp\frontend; npx localtunnel --port 3000 --print-requests"

# 3. 공용 IP 확인
Write-Host "3. 공용 IP 확인..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$publicIP = Invoke-WebRequest -Uri "https://ipinfo.io/ip" -UseBasicParsing | Select-Object -ExpandProperty Content
$publicIP = $publicIP.Trim()

Write-Host ""
Write-Host "=== 설정 완료 ===" -ForegroundColor Green
Write-Host "스마트폰에서 localtunnel URL에 접속한 후" -ForegroundColor White
Write-Host "패스워드로 다음 IP를 입력하세요:" -ForegroundColor White
Write-Host "$publicIP" -ForegroundColor Cyan
Write-Host ""
```

---

## 주의사항

1. **보안**: Localtunnel로 생성된 URL은 공개적으로 접근 가능하므로 개발/테스트 용도로만 사용
2. **안정성**: 무료 서비스이므로 연결이 불안정할 수 있음
3. **속도**: 터널을 통한 연결이므로 직접 연결보다 느릴 수 있음
4. **IP 변경**: 공용 IP가 변경되면 새로운 패스워드로 접속해야 함

---

## 대안 방법

### 1. 직접 IP 접속 (같은 WiFi)
```
http://192.168.0.13:3000
```

### 2. ngrok 사용
```powershell
ngrok http 3000
```

### 3. 고정 IP 설정
네트워크 어댑터 설정에서 고정 IP 설정으로 내부 IP 변경 방지

---

**마지막 업데이트**: 2025-08-08  
**프로젝트**: QR Stamp Frontend  
**작성자**: 개발 가이드
