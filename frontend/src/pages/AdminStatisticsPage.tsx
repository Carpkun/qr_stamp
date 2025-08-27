import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  People,
  EmojiEvents,
  Schedule,
  Store,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiService from '../services/api';
import AdminAuth from '../utils/adminAuth';
import { AdminStatistics } from '../types/api';

const AdminStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatistics = async () => {
    try {
      setError(null);
      if (loading) setLoading(true);
      if (refreshing) setRefreshing(true);
      
      const response = await ApiService.getAdminStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (err) {
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 인증 상태 확인
    if (!AdminAuth.isAuthenticated()) {
      navigate('/');
      return;
    }
    
    loadStatistics();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      if (AdminAuth.isAuthenticated()) {
        loadStatistics();
      } else {
        navigate('/');
      }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  if (loading) {
    return (
      <Layout title="실시간 통계 대시보드">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  if (error || !statistics) {
    return (
      <Layout title="실시간 통계 대시보드">
        <Box sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
            관리자 페이지로 돌아가기
          </Button>
        </Box>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="실시간 통계 대시보드">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
          관리자 페이지로 돌아가기
        </Button>
        <Button 
          startIcon={<Refresh />} 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
          size="small"
        >
          {refreshing ? '새로고침 중...' : '새로고침'}
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        📊 실시간 통계 대시보드
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        🏮 제46회 소양강문화제 QR 스탬프 투어 실시간 현황
      </Typography>

      {/* 주요 통계 카드 */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" component="div" fontWeight="bold">
                {statistics.summary.total_participants}
              </Typography>
              <Typography variant="body2">
                총 참여자 수
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" component="div" fontWeight="bold">
                {statistics.summary.completed_participants}
              </Typography>
              <Typography variant="body2">
                완주자 수
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" component="div" fontWeight="bold">
                {statistics.summary.completion_rate}%
              </Typography>
              <Typography variant="body2">
                완주율
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Store sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h3" component="div" fontWeight="bold">
                {statistics.booth_statistics.length}
              </Typography>
              <Typography variant="body2">
                활성 부스 수
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3
        }}
      >
        {/* 부스별 인기도 순위 */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                부스별 인기도 순위
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                부스별 참여자 수를 기준으로 한 인기도 순위입니다
              </Typography>
              
              <List>
                {statistics.booth_statistics.slice(0, 10).map((booth, index) => (
                  <React.Fragment key={booth.booth_code}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: index < 3 ? '#ffd700' : 'primary.main',
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem'
                        }}>
                          {booth.popularity_rank}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" fontWeight={index < 3 ? 'bold' : 'normal'}>
                              {booth.booth_name}
                            </Typography>
                            <Chip 
                              label={`${booth.participant_count}명`}
                              size="small"
                              color={index < 3 ? "primary" : "default"}
                              variant={index < 3 ? "filled" : "outlined"}
                            />
                          </Box>
                        }
                        secondary={booth.booth_code}
                      />
                    </ListItem>
                    {index < statistics.booth_statistics.slice(0, 10).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* 시간대별 참여 현황 */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                시간대별 참여 현황
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                최근 24시간 동안의 참여자 및 스탬프 수집 현황입니다
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {statistics.hourly_statistics.slice(-12).reverse().map((hourData, index) => {
                  const maxParticipants = Math.max(...statistics.hourly_statistics.map(h => h.new_participants));
                  const maxStamps = Math.max(...statistics.hourly_statistics.map(h => h.stamps_collected));
                  
                  return (
                    <Paper key={hourData.hour} sx={{ p: 2, mb: 1, backgroundColor: '#f8f9fa' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {hourData.hour}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip label={`참여자: ${hourData.new_participants}`} size="small" color="primary" />
                          <Chip label={`스탬프: ${hourData.stamps_collected}`} size="small" color="secondary" />
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          참여자 활동
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={maxParticipants > 0 ? (hourData.new_participants / maxParticipants) * 100 : 0}
                          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          스탬프 수집
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={maxStamps > 0 ? (hourData.stamps_collected / maxStamps) * 100 : 0}
                          color="secondary"
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 자동 새로고침 안내 */}
      <Paper sx={{ mt: 4, p: 2, backgroundColor: '#e3f2fd' }}>
        <Typography variant="body2" color="primary" align="center">
          📡 이 페이지는 30초마다 자동으로 새로고침됩니다. 실시간 데이터를 확인하실 수 있습니다.
        </Typography>
      </Paper>
    </Layout>
  );
};

export default AdminStatisticsPage;
