// localStorage를 사용한 참여자 ID 관리

const PARTICIPANT_ID_KEY = 'qr_stamp_participant_id';
const PARTICIPANT_DATA_KEY = 'qr_stamp_participant_data';

export interface StoredParticipantData {
  id: string;
  created_at: string;
  stamp_count: number;
  is_completed: boolean;
  completed_at?: string;
}

export class ParticipantStorage {
  // 참여자 ID 저장
  static setParticipantId(participantId: string): void {
    localStorage.setItem(PARTICIPANT_ID_KEY, participantId);
  }

  // 참여자 ID 조회
  static getParticipantId(): string | null {
    return localStorage.getItem(PARTICIPANT_ID_KEY);
  }

  // 참여자 ID 삭제
  static removeParticipantId(): void {
    localStorage.removeItem(PARTICIPANT_ID_KEY);
  }

  // 참여자 데이터 저장
  static setParticipantData(data: StoredParticipantData): void {
    localStorage.setItem(PARTICIPANT_DATA_KEY, JSON.stringify(data));
  }

  // 참여자 데이터 조회
  static getParticipantData(): StoredParticipantData | null {
    const data = localStorage.getItem(PARTICIPANT_DATA_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse participant data:', error);
        return null;
      }
    }
    return null;
  }

  // 참여자 데이터 삭제
  static removeParticipantData(): void {
    localStorage.removeItem(PARTICIPANT_DATA_KEY);
  }

  // 모든 참여자 정보 삭제
  static clearAll(): void {
    this.removeParticipantId();
    this.removeParticipantData();
  }

  // 참여자 존재 여부 확인
  static hasParticipant(): boolean {
    return this.getParticipantId() !== null;
  }

  // 완주 여부 확인
  static isCompleted(): boolean {
    const data = this.getParticipantData();
    return data?.is_completed || false;
  }

  // 현재 스탬프 개수
  static getStampCount(): number {
    const data = this.getParticipantData();
    return data?.stamp_count || 0;
  }
}

export default ParticipantStorage;
