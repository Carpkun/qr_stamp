import axios from 'axios';
import type {
  Booth,
  Participant,
  ParticipantStats,
  ParticipantDetail,
  QRScanResponse,
  AdminStatistics,
  ApiResponse,
  BoothManagement,
  CreateBoothRequest,
  UpdateBoothRequest,
  DeleteBoothResponse
} from '../types/api';

// API 기본 설정 - 동적 URL 감지 (개선된 버전)
const getApiBaseUrl = () => {
  // 1. 환경변수가 설정된 경우 최우선
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 환경변수 API URL 사용:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. 현재 호스트가 localtunnel 도메인인 경우
  if (window.location.hostname.includes('.loca.lt')) {
    // 현재 URL과 동일한 도메인을 백엔드로 사용 (같은 기기에서 동시 실행 가정)
    const currentUrl = window.location.origin;
    const backendUrl = `${currentUrl}/api`;
    console.log('🌐 Localtunnel 환경 감지, 백엔드 URL:', backendUrl);
    return backendUrl;
  }
  
  // 3. 기본값 (로컬 개발 환경)
  const defaultUrl = 'http://localhost:8000/api';
  console.log('💻 로컬 개발 환경 API URL:', defaultUrl);
  return defaultUrl;
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// API 요청 인터셉터 (디버깅용)
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📍 Base URL: ${config.baseURL}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// API 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API 응답 성공: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`📊 응답 데이터:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API 오류: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('오류 상세:', error.response?.data || error.message);
    console.error('상태 코드:', error.response?.status);
    return Promise.reject(error);
  }
);

export class ApiService {
  // 부스 관련 API
  static async getBooths(): Promise<ApiResponse<Booth[]>> {
    const response = await apiClient.get<ApiResponse<Booth[]>>('/booths/');
    return response.data;
  }

  static async getBoothByCode(boothCode: string): Promise<ApiResponse<Booth>> {
    const response = await apiClient.get<ApiResponse<Booth>>(`/booths/${boothCode}/`);
    return response.data;
  }

  // 참여자 관련 API
  static async createParticipant(): Promise<ApiResponse<Participant>> {
    const response = await apiClient.post<ApiResponse<Participant>>('/participants/');
    return response.data;
  }

  static async getParticipant(participantId: string): Promise<ApiResponse<Participant>> {
    const response = await apiClient.get<ApiResponse<Participant>>(`/participants/${participantId}/`);
    return response.data;
  }

  static async getParticipantStats(participantId: string): Promise<ApiResponse<ParticipantStats>> {
    const response = await apiClient.get<ApiResponse<ParticipantStats>>(`/participants/${participantId}/stats/`);
    return response.data;
  }

  static async getParticipantDetail(participantId: string): Promise<ApiResponse<ParticipantDetail>> {
    const response = await apiClient.get<ApiResponse<ParticipantDetail>>(`/participants/${participantId}/detail/`);
    return response.data;
  }

  // QR 스캔 관련 API (핵심 기능)
  static async scanQR(data: { participant_id?: string; booth_code: string }): Promise<ApiResponse<QRScanResponse>> {
    const response = await apiClient.post<ApiResponse<QRScanResponse>>('/scan/', data);
    return response.data;
  }

  // 스탬프 관련 API
  static async createStamp(data: { participant_id: string; booth_code: string }): Promise<ApiResponse<QRScanResponse>> {
    const response = await apiClient.post<ApiResponse<QRScanResponse>>('/stamps/', data);
    return response.data;
  }

  // 관리자 API
  static async getAdminStatistics(): Promise<ApiResponse<AdminStatistics>> {
    const response = await apiClient.get<ApiResponse<AdminStatistics>>('/admin/statistics/');
    return response.data;
  }

  static async getGiftEligibleParticipants(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/gift-eligible/');
    return response.data;
  }

  static async getSystemHealth(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/health-check/');
    return response.data;
  }

  // 부스 관리 API
  static async getBoothsForManagement(): Promise<ApiResponse<BoothManagement[]>> {
    const response = await apiClient.get<ApiResponse<BoothManagement[]>>('/admin/booths/');
    return response.data;
  }

  static async createBooth(data: CreateBoothRequest): Promise<ApiResponse<BoothManagement>> {
    const response = await apiClient.post<ApiResponse<BoothManagement>>('/admin/booths/create/', data);
    return response.data;
  }

  static async updateBooth(boothId: number, data: UpdateBoothRequest): Promise<ApiResponse<BoothManagement>> {
    const response = await apiClient.put<ApiResponse<BoothManagement>>(`/admin/booths/${boothId}/update/`, data);
    return response.data;
  }

  static async deleteBooth(boothId: number): Promise<ApiResponse<DeleteBoothResponse>> {
    const response = await apiClient.delete<ApiResponse<DeleteBoothResponse>>(`/admin/booths/${boothId}/delete/`);
    return response.data;
  }
}

export default ApiService;
