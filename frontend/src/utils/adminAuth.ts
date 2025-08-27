// 관리자 인증 관리 유틸리티

const ADMIN_AUTH_KEY = 'admin_authenticated';
const ADMIN_LOGIN_TIME_KEY = 'admin_login_time';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2시간 (밀리초)

export class AdminAuth {
  /**
   * 관리자 인증 상태 확인
   */
  static isAuthenticated(): boolean {
    const isAuth = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    const loginTime = localStorage.getItem(ADMIN_LOGIN_TIME_KEY);
    
    if (!isAuth || !loginTime) {
      return false;
    }
    
    // 세션 만료 확인 (2시간)
    const now = new Date().getTime();
    const loginTimeMs = parseInt(loginTime, 10);
    
    if (now - loginTimeMs > SESSION_DURATION) {
      // 세션 만료 시 자동 로그아웃
      this.logout();
      return false;
    }
    
    return true;
  }
  
  /**
   * 로그인 처리
   */
  static login(): void {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    localStorage.setItem(ADMIN_LOGIN_TIME_KEY, new Date().getTime().toString());
  }
  
  /**
   * 로그아웃 처리
   */
  static logout(): void {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_LOGIN_TIME_KEY);
  }
  
  /**
   * 남은 세션 시간 (분 단위)
   */
  static getRemainingSessionTime(): number {
    const loginTime = localStorage.getItem(ADMIN_LOGIN_TIME_KEY);
    if (!loginTime) return 0;
    
    const now = new Date().getTime();
    const loginTimeMs = parseInt(loginTime, 10);
    const elapsed = now - loginTimeMs;
    const remaining = SESSION_DURATION - elapsed;
    
    return Math.max(0, Math.floor(remaining / (1000 * 60))); // 분 단위로 반환
  }
  
  /**
   * 세션 연장 (활동 시 자동 연장)
   */
  static extendSession(): void {
    if (this.isAuthenticated()) {
      localStorage.setItem(ADMIN_LOGIN_TIME_KEY, new Date().getTime().toString());
    }
  }
}

export default AdminAuth;
