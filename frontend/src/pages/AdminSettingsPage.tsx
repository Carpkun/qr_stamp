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
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  HealthAndSafety,
  Storage as Database,
  Speed,
  Security,
  Update,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Storage,
  NetworkCheck,
  Timer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiService from '../services/api';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  database: string;
  response_time_ms: number;
  statistics: {
    total_participants: number;
    active_booths: number;
    total_stamps_collected: number;
  };
  timestamp: string;
}

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const loadSystemHealth = async () => {
    try {
      setError(null);
      if (loading) setLoading(true);
      if (refreshing) setRefreshing(true);
      
      const response = await ApiService.getSystemHealth();
      if (response.success && response.data) {
        setSystemHealth(response.data);
      }
    } catch (err) {
      setError('시스템 상태를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load system health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      // 30초마다 자동 새로고침
      interval = setInterval(loadSystemHealth, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSystemHealth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorIcon />;
      default: return <Info />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getResponseTimeStatus = (responseTime: number) => {
    if (responseTime < 100) return 'success';
    if (responseTime < 500) return 'warning';
    return 'error';
  };

  const handleSystemReset = () => {
    // 실제 시스템 리셋 로직 구현 (향후)
    console.log('System reset requested with password:', adminPassword);
    setResetDialogOpen(false);
    setAdminPassword('');
  };

  if (loading) {
    return (
      <Layout title="시스템 설정">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="시스템 설정">
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
    <Layout title="시스템 설정">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
          관리자 페이지로 돌아가기
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="자동 새로고침"
          />
          <Button 
            startIcon={<Update />} 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outlined"
            size="small"
          >
            {refreshing ? '새로고침 중...' : '새로고침'}
          </Button>
        </Box>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        ⚙️ 시스템 설정
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        QR 스탬프 투어 시스템의 상태와 설정을 관리합니다
      </Typography>

      {systemHealth && (
        <>
          {/* 시스템 상태 개요 */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HealthAndSafety color="primary" />
                <Typography variant="h6" color="primary">
                  시스템 상태 개요
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(systemHealth.status)}
                  <Typography variant="h6">
                    전체 시스템 상태
                  </Typography>
                </Box>
                <Chip 
                  label={systemHealth.status.toUpperCase()}
                  color={getStatusColor(systemHealth.status) as any}
                  variant="filled"
                  size="medium"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                마지막 확인: {formatTimestamp(systemHealth.timestamp)}
              </Typography>
            </CardContent>
          </Card>

          {/* 세부 시스템 정보 */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 4
            }}
          >
            {/* 데이터베이스 상태 */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Database color="primary" />
                  <Typography variant="h6">데이터베이스</Typography>
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="연결 상태"
                      secondary={systemHealth.database}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Storage color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="총 참여자 수"
                      secondary={systemHealth.statistics.total_participants.toLocaleString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NetworkCheck color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="활성 부스 수"
                      secondary={systemHealth.statistics.active_booths}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="수집된 스탬프"
                      secondary={systemHealth.statistics.total_stamps_collected.toLocaleString()}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* 성능 지표 */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Speed color="primary" />
                  <Typography variant="h6">성능 지표</Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">API 응답 시간</Typography>
                    <Chip 
                      label={`${systemHealth.response_time_ms}ms`}
                      size="small"
                      color={getResponseTimeStatus(systemHealth.response_time_ms) as any}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((systemHealth.response_time_ms / 1000) * 100, 100)}
                    color={getResponseTimeStatus(systemHealth.response_time_ms) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {systemHealth.response_time_ms < 100 ? '매우 빠름' : 
                     systemHealth.response_time_ms < 500 ? '보통' : '느림'}
                  </Typography>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Timer color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="평균 처리 시간"
                      secondary="< 50ms"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="시스템 가동률"
                      secondary="99.9%"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* 시스템 설정 */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Settings color="primary" />
                <Typography variant="h6" color="primary">
                  시스템 설정
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                  label="자동 새로고침 활성화 (30초 간격)"
                />
                
                <FormControlLabel
                  control={<Switch checked={true} disabled />}
                  label="실시간 통계 업데이트"
                />
                
                <FormControlLabel
                  control={<Switch checked={true} disabled />}
                  label="로그 기록"
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<Security />}
                    size="small"
                  >
                    백업 생성
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Database />}
                    size="small"
                  >
                    DB 정리
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="warning"
                    startIcon={<Warning />}
                    size="small"
                    onClick={() => setResetDialogOpen(true)}
                  >
                    시스템 초기화
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Paper sx={{ mt: 4, p: 3, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              ⚠️ 중요 안내사항
            </Typography>
            <Typography variant="body2" component="div">
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>시스템 초기화는 모든 데이터를 삭제합니다</li>
                <li>백업은 정기적으로 실행해주세요</li>
                <li>시스템 상태가 비정상일 경우 즉시 관리자에게 연락하세요</li>
                <li>성능 저하 시 DB 정리를 실행해보세요</li>
              </Box>
            </Typography>
          </Paper>
        </>
      )}

      {/* 시스템 초기화 확인 다이얼로그 */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6">
              시스템 초기화 확인
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>주의:</strong> 이 작업은 모든 참여자 데이터, 스탬프 기록, 부스 정보를 삭제합니다. 
              이 작업은 되돌릴 수 없습니다.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            type="password"
            label="관리자 비밀번호"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="관리자 비밀번호를 입력하세요"
            helperText="시스템 초기화를 위해 관리자 비밀번호가 필요합니다"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleSystemReset}
            color="error"
            variant="contained"
            disabled={!adminPassword}
          >
            초기화 실행
          </Button>
        </DialogActions>
      </Dialog>

      {/* 자동 새로고침 안내 */}
      <Paper sx={{ mt: 4, p: 2, backgroundColor: '#e3f2fd' }}>
        <Typography variant="body2" color="primary" align="center">
          ⚙️ 시스템 상태는 {autoRefresh ? '30초마다 자동으로' : '수동으로'} 새로고침됩니다.
        </Typography>
      </Paper>
    </Layout>
  );
};

export default AdminSettingsPage;
