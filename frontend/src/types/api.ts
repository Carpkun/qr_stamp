// API 응답 및 데이터 모델 타입 정의

export interface Booth {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  participant_count: number;
}

export interface Participant {
  id: string;
  created_at: string;
  is_completed: boolean;
  completed_at?: string;
  stamp_count: number;
  stamp_records: StampRecord[];
}

export interface StampRecord {
  id: number;
  booth: Booth;
  booth_code: string;
  stamped_at: string;
  ip_address?: string;
}

export interface ParticipantStats {
  id: string;
  stamp_count: number;
  is_completed: boolean;
  progress_percentage: number;
  remaining_stamps: number;
  next_booths: Booth[];
  visited_booths?: {
    booth: Booth;
    stamped_at: string;
  }[];
}

// 참여자 상세 정보 (방문한 부스 목록 포함)
export interface ParticipantDetail {
  id: string;
  stamp_count: number;
  is_completed: boolean;
  progress_percentage: number;
  remaining_stamps: number;
  visited_booths: {
    booth: Booth;
    stamped_at: string;
  }[];
  all_booths: (Booth & { visited: boolean; stamped_at?: string })[];
}

// API 응답 래퍼
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

// QR 스캔 응답
export interface QRScanResponse {
  participant_id: string;
  booth_name: string;
  stamp_count: number;
  is_completed: boolean;
  completed_at?: string;
  is_new_participant: boolean;
}

// 관리자 통계
export interface AdminStatistics {
  summary: {
    total_participants: number;
    completed_participants: number;
    completion_rate: number;
    gift_eligible_count: number;
  };
  booth_statistics: BoothStatistic[];
  hourly_statistics: HourlyStatistic[];
}

export interface BoothStatistic {
  booth_code: string;
  booth_name: string;
  participant_count: number;
  popularity_rank: number;
}

export interface HourlyStatistic {
  hour: string;
  new_participants: number;
  stamps_collected: number;
}

// 부스 관리용 타입
export interface BoothManagement extends Booth {
  created_at: string;
}

export interface CreateBoothRequest {
  code: string;
  name: string;
  description: string;
  is_active?: boolean;
}

export interface UpdateBoothRequest {
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface DeleteBoothResponse {
  action: 'deleted' | 'deactivated';
  booth_code: string;
  participant_count?: number;
}
