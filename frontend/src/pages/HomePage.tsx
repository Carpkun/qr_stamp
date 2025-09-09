import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { Refresh, TrendingUp, EmojiEvents, CheckCircle, RadioButtonUnchecked, ViewModule } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StampProgress from '../components/StampProgress';
import AdminLoginDialog from '../components/AdminLoginDialog';
import ApiService from '../services/api';
import ParticipantStorage from '../utils/participantStorage';
import AdminAuth from '../utils/adminAuth';
import { ParticipantStats } from '../types/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [participantStats, setParticipantStats] = useState<ParticipantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allBooths, setAllBooths] = useState<any[]>([]);
  const [visitedBoothIds, setVisitedBoothIds] = useState<Set<number>>(new Set());
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);

  // 모든 부스 목록 로드
  const loadAllBooths = async () => {
    try {
      const response = await ApiService.getBooths();
      if (response.success && response.data) {
        setAllBooths(response.data);
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to load booths:', err);
      return [];
    }
  };

  // 참여자 통계 로드
  const loadParticipantStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 모든 부스 목록 먼저 로드
      const booths = await loadAllBooths();
      
      const participantId = ParticipantStorage.getParticipantId();
      
      if (participantId) {
        try {
          const response = await ApiService.getParticipantStats(participantId);
          if (response.success && response.data) {
            setParticipantStats(response.data);
            
            // 방문한 부스 ID 목록 생성
            const visitedIds = new Set<number>();
            // visited_booths가 있다면 사용하고, 없다면 next_booths를 제외한 부스들을 방문한 것으로 간주
            if (response.data.visited_booths && response.data.visited_booths.length > 0) {
              response.data.visited_booths.forEach((booth: any) => visitedIds.add(booth.id));
            } else if (response.data.next_booths && booths.length > 0) {
              // 전체 부스에서 next_booths를 제외한 부스들이 방문한 부스
              const nextBoothIds = new Set(response.data.next_booths.map((booth: any) => booth.id));
              booths.forEach(booth => {
                if (!nextBoothIds.has(booth.id)) {
                  visitedIds.add(booth.id);
                }
              });
            }
            setVisitedBoothIds(visitedIds);
            
            // localStorage에 최신 데이터 업데이트
            ParticipantStorage.setParticipantData({
              id: response.data.id,
              created_at: new Date().toISOString(),
              stamp_count: response.data.stamp_count,
              is_completed: response.data.is_completed,
            });
          }
        } catch (participantErr: any) {
          // 참여자 정보 로드 실패 시 - 참여자 ID를 제거하고 새 시작 모드로 전환
          console.warn('참여자 정보 로드 실패, 초기 상태로 설정:', participantErr);
          ParticipantStorage.clearAll();
          setParticipantStats(null);
          setVisitedBoothIds(new Set());
        }
      } else {
        // 참여자 ID가 없는 경우 - 신규 사용자
        console.log('참여자 ID가 없음 - 신규 사용자 모드');
        setParticipantStats(null);
        setVisitedBoothIds(new Set());
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Failed to load participant stats:', {
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipantStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 부스 목록 페이지로 이동
  const handleViewBooths = () => {
    navigate('/booths');
  };

  // 새로 시작하기
  const handleStartNew = () => {
    ParticipantStorage.clearAll();
    navigate('/scan');
  };

  // 관리자 페이지 접근 - 기존 React 관리자 페이지로 이동
  const handleAdminAccess = () => {
    if (AdminAuth.isAuthenticated()) {
      // 이미 인증된 경우 바로 이동
      navigate('/admin');
    } else {
      // 인증되지 않은 경우 로그인 다이얼로그 표시
      setAdminLoginOpen(true);
    }
  };

  // 관리자 로그인 성공
  const handleAdminLogin = () => {
    navigate('/admin');
  };

  // 관리자 로그인 다이얼로그 닫기
  const handleAdminLoginClose = () => {
    setAdminLoginOpen(false);
  };

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="QR 스탬프 투어">
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
          🏮 제46회 소양강문화제
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          체험부스 스탬프 투어
        </Typography>
        <Typography variant="body1" color="text.secondary">
          17개 체험부스 중 5곳을 방문하여 스탬프를 모으고 기념품을 받아가세요!
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 참여자 진행 상황 */}
      {participantStats && (
        <StampProgress
          stampCount={participantStats.stamp_count}
          isCompleted={participantStats.is_completed}
          progressPercentage={participantStats.progress_percentage}
          remainingStamps={participantStats.remaining_stamps}
        />
      )}

      {/* 체험부스 진행 현황 - 간단한 요약 (숨김 처리) */}
      {false && allBooths.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
              <ViewModule color="primary" sx={{ mr: 1, fontSize: '1.5rem' }} />
              <Typography variant="h6" color="primary" fontWeight="bold">
                체험부스 참여 현황
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" component="div" fontWeight="bold" color="primary">
                {visitedBoothIds.size} / {allBooths.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                개의 체험부스를 방문했습니다
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#4caf50', fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="h6" color="success.main" fontWeight="bold">
                    {visitedBoothIds.size}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    방문 완료
                  </Typography>
                </Box>
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RadioButtonUnchecked sx={{ color: '#bdbdbd', fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="h6" color="text.secondary" fontWeight="bold">
                    {allBooths.length - visitedBoothIds.size}개
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    미방문
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {!participantStats?.is_completed && visitedBoothIds.size >= 5 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                🎉 5개 부스를 방문하셨습니다! 미션 완료 조건을 충족했어요!
              </Alert>
            )}
            
            {visitedBoothIds.size > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                자세한 방문 목록은 "체험부스 참여 현황" 버튼을 눌러 확인하세요
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* 추천 부스 (미완주 시에만 표시) */}
      {participantStats && !participantStats.is_completed && participantStats.next_booths.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary">
                추천 체험부스
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              아직 방문하지 않은 부스들 중 추천 부스를 확인해보세요!
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {participantStats.next_booths.slice(0, 3).map((booth) => (
                <Chip
                  key={booth.id}
                  label={`${booth.code} - ${booth.name}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 완주 축하 메시지 */}
      {participantStats && participantStats.is_completed && (
        <Card sx={{ mt: 3, background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <EmojiEvents sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              🎉 미션 완료!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              축하합니다! 체험부스 스탬프 투어를 완주하셨습니다!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/complete')}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              완주 축하 페이지 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼들 */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleViewBooths}
          sx={{
            mb: 2,
            py: 2,
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          체험부스 참여 현황
        </Button>

        <Button
          variant="text"
          size="small"
          startIcon={<Refresh />}
          onClick={handleStartNew}
          color="secondary"
        >
          새로 시작하기
        </Button>
        
        <Button 
          variant="text"
          size="small"
          onClick={handleAdminAccess}
          color="info"
          sx={{ ml: 2 }}
        >
          관리자 페이지
        </Button>
      </Box>

      {/* 안내 사항 */}
      <Card sx={{ mt: 3, backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📌 이용 안내
          </Typography>
          <Typography variant="body2" component="div">
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>각 체험부스에서 QR 코드를 스캔하세요</li>
              <li>총 17개 부스 중 5곳을 방문하면 미션 완료!</li>
              <li>완주 후 달콤 구름 솜사탕·포토부스에서 솜사탕을 받으시거나 인생네컷 사진을 찍어보세요.</li>
            </Box>
          </Typography>
        </CardContent>
      </Card>

      {/* 관리자 로그인 다이얼로그 */}
      <AdminLoginDialog
        open={adminLoginOpen}
        onClose={handleAdminLoginClose}
        onLogin={handleAdminLogin}
      />
    </Layout>
  );
};

export default HomePage;
