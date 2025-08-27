# 📱 스마트폰 LTE 환경 카메라 테스트 절차

## 🎯 **목표**
데스크톱(유선랜)과 스마트폰(LTE) 환경에서 QR 스탬프 투어 시스템의 카메라 기능을 테스트

---

## 🔧 **사전 준비사항**

### **개발 환경**
- Windows 10/11 PC (유선랜 연결)
- Django 백엔드 서버 실행 중 (`localhost:8000`)
- React 프론트엔드 HTTPS 서버 실행 중 (`localhost:3000`)
- 스마트폰 (LTE/5G 연결)

### **필요 도구**
- PowerShell (Windows)
- Node.js & npm
- LocalTunnel (npx로 설치)

---

## 📋 **단계별 절차**

### **1단계: HTTPS 프론트엔드 서버 실행**

1. **환경변수 설정**:
   ```powershell
   $env:HTTPS = "true"
   ```

2. **백그라운드에서 HTTPS 서버 시작**:
   ```powershell
   Start-Job -ScriptBlock { 
       Set-Location "C:\Users\rcour\Documents\Workspace\qr_stamp\frontend"
       $env:HTTPS = "true"
       npm start 
   } -Name "HTTPSServer"
   ```

3. **서버 상태 확인**:
   ```powershell
   netstat -an | findstr ":3000"
   # 결과: TCP 0.0.0.0:3000 0.0.0.0:0 LISTENING
   ```

### **2단계: LocalTunnel 설정**

1. **LocalTunnel 실행**:
   ```powershell
   Start-Job -ScriptBlock { 
       Set-Location "C:\Users\rcour\Documents\Workspace\qr_stamp\frontend"
       npx localtunnel --port 3000 
   } -Name "LocalTunnel2"
   ```

2. **터널 URL 확인**:
   ```powershell
   Start-Sleep -Seconds 8
   Receive-Job -Name "LocalTunnel2" -Keep
   # 결과: your url is: https://olive-swans-greet.loca.lt
   ```

### **3단계: 공인 IP 주소 확인**

1. **PC의 공인 IP 확인**:
   ```powershell
   $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
   Write-Host "공인 IP 주소: $publicIP"
   # 결과: 106.251.74.198
   ```

### **4단계: QR 코드 테스트 생성기 실행**

1. **QR 코드 생성기 브라우저에서 열기**:
   ```powershell
   Start-Process "https://localhost:3000/qr-test-generator.html"
   ```

2. **17개 부스별 QR 코드 자동 생성 확인**

### **5단계: 스마트폰에서 LTE 접속**

1. **스마트폰 네트워크 설정**:
   - WiFi 끄기
   - LTE/5G 연결 확인

2. **브라우저에서 터널 URL 접속**:
   ```
   https://olive-swans-greet.loca.lt
   ```

3. **LocalTunnel 보안 페이지 처리**:
   - "You are about to visit..." 페이지 표시
   - "Tunnel Password" 입력란에 공인 IP 입력: `106.251.74.198`
   - "Submit" 버튼 클릭

4. **React 앱 로드 확인**:
   - "You need to enable JavaScript to run this app." 메시지 확인
   - JavaScript가 활성화되면 메인 페이지 로드

### **6단계: 카메라 기능 테스트**

1. **메인 페이지 확인**:
   - "제46회 소양강문화제" 타이틀 표시
   - "체험부스 스탬프 투어" 부제목 표시
   - 스탬프 진행률 (0/17) 표시

2. **QR 스캔 페이지 접속**:
   - "QR 스캔하기" 버튼 클릭
   - `/stamp` 경로로 이동 확인

3. **카메라 권한 처리**:
   - 카메라 접근 권한 요청 팝업 표시
   - "허용" 버튼 클릭
   - 실시간 카메라 화면 표시 확인

4. **QR 코드 스캔 테스트**:
   - PC 화면의 QR 코드를 스마트폰 카메라로 스캔
   - QR 코드 자동 인식 및 부스 코드 파싱
   - 백엔드 API 호출 및 스탬프 기록
   - 성공 메시지 및 진행률 업데이트 확인

---

## ✅ **테스트 시나리오**

### **기본 기능 테스트**
- [ ] HTTPS 환경에서 카메라 접근 권한 요청
- [ ] 실시간 카메라 스트림 정상 표시
- [ ] QR 코드 자동 인식 및 디코딩
- [ ] 부스 코드 파싱 (BOOTH001~BOOTH017)
- [ ] 백엔드 API 통신 및 스탬프 기록
- [ ] UI 피드백 (성공 메시지, 진행률 업데이트)

### **에러 시나리오 테스트**
- [ ] 중복 부스 방문 시 경고 메시지
- [ ] 잘못된 QR 코드 스캔 시 에러 처리
- [ ] 네트워크 연결 실패 시 재시도 옵션
- [ ] 카메라 권한 거부 시 안내 메시지

### **완료 시나리오 테스트**
- [ ] 5개 부스 방문 완료 시 축하 페이지 이동
- [ ] 폭죽 애니메이션 및 완료 메시지 표시
- [ ] 기념품 수령 안내 메시지

---

## 🚨 **문제 해결 가이드**

### **LocalTunnel 503 오류**
**증상**: "503 - Tunnel Unavailable" 에러
**해결방법**:
1. 기존 터널 프로세스 종료:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*localtunnel*"} | Stop-Process -Force
   ```

2. 새 터널 시작:
   ```powershell
   Start-Job -ScriptBlock { npx localtunnel --port 3000 } -Name "NewTunnel"
   ```

3. 새로운 URL 및 패스워드로 재접속

### **터널 패스워드 오류**
**증상**: "endpoint IP is not correct" 에러
**해결방법**:
1. 실제 공인 IP 재확인:
   ```powershell
   (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
   ```

2. 올바른 IP 주소로 다시 시도

### **카메라 권한 거부**
**증상**: 카메라 화면이 표시되지 않음
**해결방법**:
1. **Chrome (Android)**: 설정 → 사이트 설정 → 카메라 권한 확인
2. **Safari (iOS)**: 설정 → Safari → 카메라 권한 확인
3. 브라우저 새로고침 후 재시도

### **JavaScript 비활성화**
**증상**: "You need to enable JavaScript to run this app." 지속 표시
**해결방법**:
1. 브라우저 설정에서 JavaScript 활성화 확인
2. 페이지 새로고침
3. 다른 브라우저로 시도 (Chrome 권장)

---

## 📊 **성능 기준**

### **응답 시간**
- 페이지 로드: < 3초 (LTE 환경)
- API 호출: < 2초
- QR 스캔 인식: < 1초

### **네트워크 사용량**
- 초기 페이지 로드: < 1MB
- QR 스캔 당 데이터: < 50KB
- 총 세션 데이터: < 5MB

### **배터리 사용량**
- 카메라 사용으로 인한 과도한 배터리 소모 없음
- 5분간 연속 사용 시 발열 최소화

---

## 🔧 **기술적 세부사항**

### **사용된 기술 스택**
- **프론트엔드**: React 19.1.1, @zxing/library, react-webcam
- **백엔드**: Django, MySQL
- **터널링**: LocalTunnel (무료)
- **HTTPS**: React 자체 서명 인증서

### **네트워크 구성**
```
인터넷
    ↓
LocalTunnel 서버 (olive-swans-greet.loca.lt)
    ↓
PC 공인 IP (106.251.74.198)
    ↓
로컬 네트워크 (192.168.0.13)
    ↓
React HTTPS 서버 (localhost:3000)
    ↓
Django API 서버 (localhost:8000)
    ↓
MySQL 데이터베이스
```

### **보안 고려사항**
- LocalTunnel 터널 패스워드로 무단 접근 방지
- HTTPS 연결로 데이터 암호화
- 카메라 권한은 사용자 승인 후에만 활성화
- API 호출 시 CORS 정책 적용

---

## 📝 **테스트 완료 체크리스트**

### **환경 설정**
- [ ] Django 백엔드 서버 실행 (`localhost:8000`)
- [ ] React HTTPS 프론트엔드 실행 (`localhost:3000`)
- [ ] LocalTunnel 터널 생성 및 URL 확인
- [ ] 공인 IP 주소 확인
- [ ] QR 코드 생성기 실행

### **스마트폰 접속**
- [ ] LTE/5G 네트워크 연결
- [ ] LocalTunnel URL 접속
- [ ] 터널 패스워드 입력 및 통과
- [ ] React 앱 정상 로드

### **카메라 기능**
- [ ] 카메라 권한 요청 및 허용
- [ ] 실시간 카메라 화면 표시
- [ ] QR 코드 스캔 및 인식
- [ ] 부스 코드 파싱 정상 작동
- [ ] API 통신 및 데이터베이스 기록

### **사용자 경험**
- [ ] 직관적인 UI 및 버튼 배치
- [ ] 명확한 성공/실패 메시지
- [ ] 실시간 진행률 업데이트
- [ ] 에러 상황에 대한 적절한 안내

### **완료 시나리오**
- [ ] 5개 부스 완성 시 축하 페이지 이동
- [ ] 폭죽 애니메이션 정상 작동
- [ ] 완료 메시지 및 기념품 안내

---

## 🎉 **결과 기록**

### **성공 정보**
- **테스트 일시**: 2025년 8월 7일 오후 5시 17분
- **터널 URL**: `https://olive-swans-greet.loca.lt`
- **터널 패스워드**: `106.251.74.198`
- **테스트 환경**: 스마트폰 LTE, Windows PC 유선랜
- **브라우저**: [테스트한 브라우저 기록]
- **테스트 결과**: [성공/실패 및 세부 사항 기록]

### **발견된 이슈**
- [테스트 중 발견된 문제점들]
- [해결 방법들]
- [개선 제안사항들]

### **성능 측정 결과**
- 페이지 로드 시간: [측정값]초
- QR 스캔 응답 시간: [측정값]초
- API 호출 시간: [측정값]초
- 총 데이터 사용량: [측정값]MB

---

*이 문서는 QR 스탬프 투어 시스템의 9일차 테스트 및 디버깅 단계에서 LTE 환경 스마트폰 카메라 테스트를 위한 완전한 절차를 기록한 것입니다.*
