import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack,
  CardGiftcard,
  Check,
  Visibility,
  Refresh,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiService from '../services/api';

interface GiftEligibleParticipant {
  participant_id: string;
  completed_at: string;
  stamp_count: number;
  visited_booths: {
    booth_code: string;
    booth_name: string;
    stamped_at: string;
  }[];
  completion_duration: number | null;
  gift_received?: boolean; // 기념품 수령 여부 (향후 확장용)
}

const AdminGiftPage: React.FC = () => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<GiftEligibleParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<GiftEligibleParticipant | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReceived, setShowReceived] = useState(true);

  const loadGiftEligibleParticipants = async () => {
    try {
      setError(null);
      if (loading) setLoading(true);
      if (refreshing) setRefreshing(true);
      
      const response = await ApiService.getGiftEligibleParticipants();
      if (response.success && response.data) {
        setParticipants(response.data.participants);
      }
    } catch (err) {
      setError('기념품 대상자 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load gift eligible participants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGiftEligibleParticipants();
    
    // 60초마다 자동 새로고침
    const interval = setInterval(loadGiftEligibleParticipants, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGiftEligibleParticipants();
  };

  const handleViewDetails = (participant: GiftEligibleParticipant) => {
    setSelectedParticipant(participant);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedParticipant(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '알 수 없음';
    
    if (minutes < 60) {
      return `${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}시간 ${remainingMinutes}분`;
    }
  };

  const exportToCSV = () => {
    const csvHeaders = ['참여자ID', '완주시간', '스탬프수', '소요시간', '방문부스'];
    const csvData = participants.map(p => [
      p.participant_id.slice(-8),
      formatDateTime(p.completed_at),
      p.stamp_count.toString(),
      formatDuration(p.completion_duration),
      p.visited_booths.map(b => b.booth_code).join(';')
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `기념품_대상자_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Layout title="기념품 관리">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="기념품 관리">
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

  const filteredParticipants = showReceived ? participants : participants.filter(p => !p.gift_received);

  return (
    <Layout title="기념품 관리">
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
          관리자 페이지로 돌아가기
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showReceived}
                onChange={(e) => setShowReceived(e.target.checked)}
                color="primary"
              />
            }
            label="수령완료 포함"
          />
          <Button 
            startIcon={<Download />} 
            onClick={exportToCSV}
            variant="outlined"
            size="small"
          >
            CSV 내보내기
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
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        🎁 기념품 관리
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        스탬프 투어를 완주한 참여자들의 기념품 수령 현황을 관리합니다
      </Typography>

      {/* 요약 통계 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
        <Card sx={{ minWidth: 200, textAlign: 'center' }}>
          <CardContent>
            <CardGiftcard sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="div" fontWeight="bold" color="primary.main">
              {filteredParticipants.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showReceived ? '총 대상자' : '미수령 대상자'}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, textAlign: 'center' }}>
          <CardContent>
            <Check sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
              {participants.filter(p => p.gift_received).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              수령 완료
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 참여자 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>참여자 ID</TableCell>
              <TableCell>완주 시간</TableCell>
              <TableCell align="center">스탬프 수</TableCell>
              <TableCell align="center">소요 시간</TableCell>
              <TableCell align="center">수령 상태</TableCell>
              <TableCell align="center">상세보기</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.participant_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {participant.participant_id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(participant.completed_at)}
                  </TableCell>
                  <TableCell align="center">
                    <Badge badgeContent={participant.stamp_count} color="primary">
                      <CardGiftcard color="action" />
                    </Badge>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={formatDuration(participant.completion_duration)}
                      size="small"
                      color={participant.completion_duration && participant.completion_duration < 60 ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={participant.gift_received ? "수령완료" : "미수령"}
                      color={participant.gift_received ? "success" : "warning"}
                      variant={participant.gift_received ? "filled" : "outlined"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="상세 정보 보기">
                      <IconButton 
                        onClick={() => handleViewDetails(participant)}
                        color="primary"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {showReceived ? '기념품 대상자가 없습니다.' : '미수령 대상자가 없습니다.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        {selectedParticipant && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardGiftcard color="primary" />
                <Typography variant="h6">
                  참여자 상세 정보
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">참여자 ID</Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ mb: 2 }}>
                  {selectedParticipant.participant_id}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">완주 시간</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDateTime(selectedParticipant.completed_at)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">소요 시간</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDuration(selectedParticipant.completion_duration)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  방문한 부스 ({selectedParticipant.visited_booths.length}개)
                </Typography>
              </Box>

              <List dense>
                {selectedParticipant.visited_booths.map((booth, index) => (
                  <React.Fragment key={booth.booth_code}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {booth.booth_name}
                            </Typography>
                            <Chip label={booth.booth_code} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={formatDateTime(booth.stamped_at)}
                      />
                    </ListItem>
                    {index < selectedParticipant.visited_booths.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetail}>닫기</Button>
              {!selectedParticipant.gift_received && (
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<Check />}
                  onClick={() => {
                    // 향후 기념품 수령 완료 처리 API 호출
                    console.log('Mark as received:', selectedParticipant.participant_id);
                    handleCloseDetail();
                  }}
                >
                  수령 완료 처리
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 자동 새로고침 안내 */}
      <Paper sx={{ mt: 4, p: 2, backgroundColor: '#e8f5e8' }}>
        <Typography variant="body2" color="success.main" align="center">
          🎁 이 페이지는 60초마다 자동으로 새로고침됩니다. 실시간으로 완주자를 확인하실 수 있습니다.
        </Typography>
      </Paper>
    </Layout>
  );
};

export default AdminGiftPage;
