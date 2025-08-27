import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Link,
  Breadcrumbs
} from '@mui/material';
import {
  Home as HomeIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  BarChart as StatsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminAuth from '../utils/adminAuth';
import ApiService from '../services/api';

interface DashboardData {
  total_participants: number;
  active_booths: number;
  total_stamps: number;
  completion_rate: number;
  recent_participants: Array<{
    id: string;
    created_at: string;
    stamp_count: number;
    is_completed: boolean;
  }>;
  booth_stats: Array<{
    code: string;
    name: string;
    participant_count: number;
    is_active: boolean;
  }>;
}

const DjangoAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AdminAuth.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      // 각 API를 개별적으로 호출하여 에러 핸들링 개선
      let healthData: any = null;
      let statsData: any = null;
      let boothsData: any[] = [];
      
      try {
        const healthRes = await ApiService.getSystemHealth();
        if (healthRes.success && healthRes.data) {
          healthData = healthRes.data;
        }
      } catch (err) {
        console.warn('System health API failed:', err);
      }
      
      try {
        const statsRes = await ApiService.getAdminStatistics();
        if (statsRes.success && statsRes.data) {
          statsData = statsRes.data;
        }
      } catch (err) {
        console.warn('Admin statistics API failed:', err);
      }
      
      try {
        const boothsRes = await ApiService.getBoothsForManagement();
        if (boothsRes.success && boothsRes.data) {
          boothsData = boothsRes.data;
        }
      } catch (err) {
        console.warn('Booths management API failed:', err);
      }
      
      // 사용 가능한 데이터로 대시보드 구성
      const totalParticipants = statsData?.summary?.total_participants || 0;
      const completedParticipants = statsData?.summary?.completed_participants || 0;
      const completionRate = totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0;
      
      setDashboardData({
        total_participants: totalParticipants,
        active_booths: boothsData.filter(booth => booth.is_active).length,
        total_stamps: statsData?.summary?.total_stamps || 0,
        completion_rate: completionRate,
        recent_participants: [], // 최근 참여자는 별도 API가 필요하므로 일단 빈 배열
        booth_stats: boothsData.slice(0, 5) // 상위 5개 부스만 표시
      });
      
    } catch (err) {
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AdminAuth.logout();
    navigate('/');
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Django 관리자 헤더 */}
      <Paper 
        elevation={0} 
        sx={{ 
          backgroundColor: '#417690',
          color: 'white',
          py: 2,
          borderRadius: 0
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                Django 관리
              </Typography>
              <Typography variant="body1" sx={{ ml: 2, opacity: 0.9 }}>
                QR 스탬프 투어
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                관리자님 환영합니다
              </Typography>
              <Button
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ 
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                로그아웃
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* 네비게이션 */}
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link 
            component="button"
            variant="body2"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', color: '#417690' }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
            홈
          </Link>
          <Typography variant="body2" color="text.primary">
            관리자
          </Typography>
        </Breadcrumbs>
      </Container>

      <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 대시보드 개요 */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, color: '#417690', fontWeight: 'bold' }}>
          사이트 관리 대시보드
        </Typography>

        {dashboardData && (
          <>
            {/* 통계 카드 */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4
              }}
            >
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 48, color: '#417690', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#417690' }}>
                    {dashboardData.total_participants}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 참여자
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <StoreIcon sx={{ fontSize: 48, color: '#28a745', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                    {dashboardData.active_booths}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    활성 부스
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <StatsIcon sx={{ fontSize: 48, color: '#ffc107', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#ffc107' }}>
                    {dashboardData.total_stamps}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 스탬프
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <SettingsIcon sx={{ fontSize: 48, color: '#dc3545', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#dc3545' }}>
                    {dashboardData.completion_rate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    완주율
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* 관리 섹션들 */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 4
              }}
            >
              {/* 부스 관리 */}
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#417690', fontWeight: 'bold' }}>
                    부스 (Booths)
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/admin/booths')}
                      sx={{ mr: 1 }}
                    >
                      추가
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => navigate('/admin/booths')}
                      variant="outlined"
                    >
                      변경
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell><strong>부스명</strong></TableCell>
                        <TableCell><strong>코드</strong></TableCell>
                        <TableCell><strong>참여자</strong></TableCell>
                        <TableCell><strong>상태</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData.booth_stats.map((booth) => (
                        <TableRow key={booth.code} hover>
                          <TableCell>{booth.name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {booth.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{booth.participant_count}</TableCell>
                          <TableCell>
                            <Chip
                              label={booth.is_active ? '활성' : '비활성'}
                              color={booth.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* 빠른 작업 */}
              <Paper sx={{ p: 3, height: 'fit-content' }}>
                <Typography variant="h6" sx={{ color: '#417690', fontWeight: 'bold', mb: 2 }}>
                  최근 작업
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<StoreIcon />}
                    onClick={() => navigate('/admin/booths')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    부스 관리
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<StatsIcon />}
                    onClick={() => navigate('/admin/statistics')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    통계 및 현황
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/admin/gift')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    기념품 관리
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/admin/settings')}
                    sx={{ justifyContent: 'flex-start', py: 1.5 }}
                  >
                    시스템 설정
                  </Button>
                </Box>
              </Paper>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default DjangoAdminDashboard;
