import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  Store as StoreIcon,
  BarChart as StatisticsIcon,
  Settings as SettingsIcon,
  CardGiftcard as GiftIcon,
  Logout,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminAuth from '../utils/adminAuth';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  // 인증 상태 확인
  useEffect(() => {
    if (!AdminAuth.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleLogout = () => {
    AdminAuth.logout();
    navigate('/');
  };

  const adminMenuItems = [
    {
      title: '부스 관리',
      description: '체험부스를 추가, 수정, 삭제할 수 있습니다',
      icon: <StoreIcon sx={{ fontSize: 60, color: '#667eea' }} />,
      path: '/admin/booths',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: '통계 및 현황',
      description: '참여자 현황과 부스별 통계를 확인할 수 있습니다',
      icon: <StatisticsIcon sx={{ fontSize: 60, color: '#4caf50' }} />,
      path: '/admin/statistics',
      color: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
    },
    {
      title: '기념품 관리',
      description: '완주자 기념품 수령 현황을 관리할 수 있습니다',
      icon: <GiftIcon sx={{ fontSize: 60, color: '#e91e63' }} />,
      path: '/admin/gift',
      color: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)'
    },
    {
      title: '시스템 설정',
      description: '시스템 상태 및 설정을 관리할 수 있습니다',
      icon: <SettingsIcon sx={{ fontSize: 60, color: '#ff9800' }} />,
      path: '/admin/settings',
      color: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
    }
  ];

  return (
    <Layout title="관리자 페이지">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
          color="primary"
        >
          메인 페이지로 돌아가기
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<Schedule />}
            label={`남은 세션: ${AdminAuth.getRemainingSessionTime()}분`}
            size="small"
            color="info"
            variant="outlined"
          />
          <Button
            startIcon={<Logout />}
            onClick={handleLogout}
            color="error"
            variant="outlined"
            size="small"
          >
            로그아웃
          </Button>
        </Box>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        🔧 관리자 페이지
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        QR 스탬프 투어 시스템을 관리할 수 있는 관리자 전용 페이지입니다
      </Typography>

      {/* 관리 메뉴 */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 3
        }}
      >
        {adminMenuItems.map((item, index) => (
            <Card 
              key={index}
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {item.description}
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ 
                    background: item.color,
                    '&:hover': {
                      background: item.color,
                      filter: 'brightness(0.9)'
                    }
                  }}
                >
                  바로가기
                </Button>
              </CardContent>
            </Card>
        ))}
      </Box>

      {/* 빠른 액세스 */}
      <Paper sx={{ mt: 4, p: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom color="primary">
          📋 빠른 액세스
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          자주 사용하는 관리 기능에 빠르게 접근할 수 있습니다
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/admin/booths')}
          >
            새 부스 추가
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/admin/statistics')}
          >
            실시간 통계 보기
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/admin/gift')}
          >
            기념품 관리
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/booths')}
          >
            부스 목록 보기
          </Button>
        </Box>
      </Paper>

      {/* 주의사항 */}
      <Paper sx={{ mt: 3, p: 3, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
        <Typography variant="h6" gutterBottom color="warning.main">
          ⚠️ 주의사항
        </Typography>
        <Typography variant="body2" component="div">
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            <li>부스 삭제 시 참여자 데이터가 있으면 비활성화만 됩니다</li>
            <li>관리자 기능은 신중하게 사용해주세요</li>
            <li>시스템 변경사항은 즉시 반영됩니다</li>
            <li>문제 발생 시 즉시 시스템 관리자에게 연락하세요</li>
          </Box>
        </Typography>
      </Paper>
    </Layout>
  );
};

export default AdminPage;
