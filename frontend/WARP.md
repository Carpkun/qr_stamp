# WARP.md

이 파일은 WARP (warp.dev)가 이 저장소에서 코드 작업 시 참고할 가이드를 제공합니다.

## 프로젝트 개요

제46회 소양강문화제 QR 스탬프 투어 시스템의 React 프론트엔드입니다. 17개 체험부스 중 5곳을 방문하여 스탬프를 수집하는 모바일 웹 애플리케이션입니다.

### 기술 스택
- **프레임워크**: React 19.1.1 + TypeScript 4.9.5
- **UI 라이브러리**: Material-UI (MUI) 7.3.1
- **라우팅**: React Router DOM 7.7.1
- **HTTP 클라이언트**: Axios 1.11.0
- **QR 코드 스캔**: @zxing/library + react-webcam
- **빌드 도구**: Create React App (react-scripts 5.0.1)

## 개발 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
npm start

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test

# 테스트 (감시 모드 종료)
npm test -- --watchAll=false

# 단일 테스트 파일 실행
npm test -- --testNamePattern="TestName"

# 의존성 설치
npm install

# HTTPS 개발 서버 실행 (모바일 테스트용)
# start-https.ps1 스크립트 사용 권장
```

## 아키텍처 개요

### 디렉토리 구조
```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── Layout.tsx      # 앱 전체 레이아웃
│   ├── StampProgress.tsx # 스탬프 수집 진행률 표시
│   ├── QRScanner.tsx   # QR 코드 스캔 컴포넌트
│   ├── ScanFeedback.tsx # 스캔 결과 피드백
│   └── AdminLoginDialog.tsx # 관리자 로그인 다이얼로그
├── pages/               # 페이지 컴포넌트
│   ├── HomePage.tsx     # 메인 페이지 (스탬프 현황)
│   ├── QRScanPage.tsx   # QR 코드 스캔 페이지
│   ├── BoothListPage.tsx # 체험부스 목록
│   ├── CompletePage.tsx # 완주 축하 페이지
│   ├── StampPage.tsx    # QR 링크 자동 처리
│   └── Admin*.tsx       # 관리자 페이지들
├── services/
│   └── api.ts          # API 호출 서비스
├── types/
│   └── api.ts          # TypeScript 타입 정의
└── utils/
    ├── adminAuth.ts    # 관리자 인증 관리
    └── participantStorage.ts # 로컬스토리지 관리
```

### 핵심 플로우
1. **참여자 생성**: 첫 방문 시 자동으로 고유 ID 생성
2. **QR 스캔**: 카메라로 부스 QR 코드 스캔
3. **스탬프 수집**: 부스별 중복 방문 방지, 5개 수집 시 완주
4. **관리자 시스템**: 실시간 통계, 부스 관리, 기념품 대상자 확인

### 상태 관리
- **로컬스토리지**: 참여자 ID와 기본 정보 저장 (기기별 관리)
- **React State**: 페이지별 UI 상태 관리
- **API 상태**: 실시간 서버 데이터 동기화

### API 통신
- **Base URL**: 환경변수(`REACT_APP_API_URL`) 또는 동적 감지
- **인터셉터**: 요청/응답 로깅, 에러 처리
- **주요 엔드포인트**:
  - `/api/booths/` - 부스 목록
  - `/api/scan/` - QR 스캔 처리
  - `/api/participants/` - 참여자 관리
  - `/api/admin/*` - 관리자 기능

## 환경 설정

### 필수 환경변수 (.env)
```bash
# 백엔드 API 서버 URL
REACT_APP_API_URL=https://your-backend.domain.com/api

# 앱 메타데이터
REACT_APP_NAME=QR Stamp Tour
REACT_APP_VERSION=1.0.0

# 개발 모드 설정
REACT_APP_ENABLE_DEV_TOOLS=true
```

### 백엔드 연동
- Django REST API와 통신 (일반적으로 포트 8000)
- CORS 설정 필요 (프론트엔드 도메인 허용)
- 로컬 개발: `http://localhost:8000/api`
- 프로덕션: localtunnel 또는 실제 도메인 사용

## 주요 기능별 파일

### QR 코드 스캔
- `QRScanner.tsx`: 카메라 권한 요청 및 QR 코드 감지
- `QRScanPage.tsx`: 스캔 페이지 UI와 상태 관리
- `ScanFeedback.tsx`: 스캔 성공/실패 피드백

### 스탬프 관리
- `ParticipantStorage.ts`: 로컬스토리지 기반 참여자 데이터 관리
- `StampProgress.tsx`: 진행률 시각화 (5/5 목표)
- `HomePage.tsx`: 메인 대시보드 (현재 상태 표시)

### 관리자 시스템
- `AdminAuth.ts`: 2시간 세션 기반 인증
- `Admin*.tsx` 페이지들: 통계, 부스 관리, 기념품 관리
- 비밀번호 기반 간단 인증 (세션 관리)

## 개발 시 주의사항

### API 연동 이슈
- 현재 Frontend-Backend 연동에 일부 문제가 있음 (PROJECT_STATUS.md 참고)
- 브라우저 개발자 도구에서 네트워크 탭 확인 필요
- CORS 설정과 API URL 설정 검증 중요

### 모바일 최적화
- Material-UI 반응형 디자인 적용
- 터치 인터페이스 최적화
- 카메라 권한 요청 처리

### 테스트 환경
- HTTPS 필수 (카메라 API 사용)
- `start-https.ps1` 스크립트로 HTTPS 개발 서버 실행
- 모바일 기기에서 localtunnel 또는 ngrok 사용 권장

### 성능 고려사항
- QR 스캔 시 불필요한 리렌더링 방지
- 관리자 페이지 30초 자동 새로고침
- 이미지 및 리소스 최적화

## 디버깅 가이드

### 일반적인 문제
1. **API 연결 실패**: 환경변수 설정과 백엔드 서버 상태 확인
2. **카메라 권한**: HTTPS 환경에서만 작동, 브라우저 설정 확인
3. **스탬프 중복**: 로컬스토리지 데이터와 서버 데이터 동기화 확인

### 로그 확인
- API 요청/응답은 콘솔에 자동 로깅
- 에러 발생 시 상세한 스택 트레이스 표시
- `PROJECT_STATUS.md` 파일에서 현재 알려진 문제점 확인

## 배포 관련

### 빌드 최적화
- `npm run build`로 프로덕션 빌드 생성
- `build/` 폴더를 백엔드 static 디렉토리로 복사 예정
- 환경변수는 빌드 타임에 적용됨

### 보안 고려사항
- 관리자 인증은 간단한 비밀번호 방식 (소규모 이벤트용)
- 참여자 정보는 로컬스토리지 저장 (개인정보 최소화)
- API 키나 민감한 정보는 환경변수로 관리

## 알려진 제약사항

- 참여자 정보는 기기별로 관리 (로컬스토리지)
- 관리자 세션은 2시간 후 자동 만료
- 실시간 업데이트는 30초 간격 폴링 방식
- SQLite 데이터베이스 사용 (소규모 운영용)

---

**마지막 업데이트**: 2025-08-08  
**프로젝트 진행률**: 85% (Frontend-Backend 연동 이슈 해결 중)
