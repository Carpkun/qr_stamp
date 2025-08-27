import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Badge
} from '@mui/material';
import { 
  ArrowBack, 
  CheckCircle, 
  RadioButtonUnchecked,
  AccessTime,
  EmojiEvents 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StampProgress from '../components/StampProgress';
import ApiService from '../services/api';
import ParticipantStorage from '../utils/participantStorage';
import { ParticipantDetail } from '../types/api';

const BoothListPage: React.FC = () => {
  const navigate = useNavigate();
  const [participantDetail, setParticipantDetail] = useState<ParticipantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParticipantDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const participantId = ParticipantStorage.getParticipantId();
      
      if (participantId) {
        const response = await ApiService.getParticipantDetail(participantId);
        if (response.success && response.data) {
          setParticipantDetail(response.data);
        }
      } else {
        // 참여자가 없으면 빈 상태로 부스 목록만 표시
        const boothsResponse = await ApiService.getBooths();
        if (boothsResponse.success && boothsResponse.data) {
          setParticipantDetail({
            id: '',
            stamp_count: 0,
            is_completed: false,
            progress_percentage: 0,
            remaining_stamps: 5,
            visited_booths: [],
            all_booths: boothsResponse.data.map((booth: any) => ({ ...booth, visited: false }))
          });
        }
      }
    } catch (err) {
      setError('참여 현황을 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load participant detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipantDetail();
  }, []);

  const handleGoBack = () => {
    navigate('/');
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

  if (loading) {
    return (
      <Layout title="체험부스 참여 현황">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  if (!participantDetail) {
    return (
      <Layout title="체험부스 참여 현황">
        <Box sx={{ mb: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
            돌아가기
          </Button>
        </Box>
        <Alert severity="info">
          아직 참여하지 않았습니다. QR 코드를 스캔하여 스탬프 투어를 시작해보세요!
        </Alert>
      </Layout>
    );
  }

  const visitedCount = participantDetail.all_booths.filter(booth => booth.visited).length;
  const totalCount = participantDetail.all_booths.length;

  return (
    <Layout title="체험부스 참여 현황">
      <Box sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={handleGoBack} color="primary">
          돌아가기
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        📊 나의 참여 현황
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        제46회 소양강문화제 체험부스 스탬프 투어
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 진행 상황 표시 */}
      {participantDetail.id && (
        <StampProgress
          stampCount={participantDetail.stamp_count}
          isCompleted={participantDetail.is_completed}
          progressPercentage={participantDetail.progress_percentage}
          remainingStamps={participantDetail.remaining_stamps}
        />
      )}

      {/* 참여 통계 카드 */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" gutterBottom>
                {visitedCount} / {totalCount}
              </Typography>
              <Typography variant="body1">
                체험부스 참여 현황
              </Typography>
            </Box>
            <Box textAlign="center">
              {participantDetail.is_completed ? (
                <EmojiEvents sx={{ fontSize: 48 }} />
              ) : (
                <Badge badgeContent={participantDetail.remaining_stamps} color="error">
                  <CheckCircle sx={{ fontSize: 48 }} />
                </Badge>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 부스별 참여 현황 */}
      <Typography variant="h6" gutterBottom color="primary">
        🏮 체험부스별 참여 현황
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {participantDetail.all_booths.map((booth) => (
          <Card 
            key={booth.id}
            sx={{
              border: booth.visited ? '2px solid #4caf50' : '1px solid #e0e0e0',
              backgroundColor: booth.visited ? '#f8fdf8' : '#fff',
              '&:hover': { 
                boxShadow: 3,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="start" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" flex={1}>
                  {booth.visited ? (
                    <CheckCircle color="success" sx={{ mr: 1.5, fontSize: 28 }} />
                  ) : (
                    <RadioButtonUnchecked color="disabled" sx={{ mr: 1.5, fontSize: 28 }} />
                  )}
                  
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        color={booth.visited ? "success.main" : "text.primary"}
                        sx={{ fontWeight: booth.visited ? 'bold' : 'normal' }}
                      >
                        {booth.name}
                      </Typography>
                      <Chip 
                        label={booth.code} 
                        size="small" 
                        variant="outlined"
                        color={booth.visited ? "success" : "default"}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                      {booth.description}
                    </Typography>
                    
                    {booth.visited && booth.stamped_at && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <AccessTime fontSize="small" color="success" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                          방문 완료: {formatDateTime(booth.stamped_at)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                <Box textAlign="right">
                  <Chip
                    label={booth.visited ? "완료" : "미완료"}
                    color={booth.visited ? "success" : "default"}
                    size="small"
                    variant={booth.visited ? "filled" : "outlined"}
                  />
                  {booth.is_active && (
                    <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                      운영 중
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {participantDetail.all_booths.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            현재 운영 중인 체험부스가 없습니다.
          </Typography>
        </Box>
      )}

      {/* 하단 안내 */}
      <Card sx={{ mt: 3, backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📌 참여 안내
          </Typography>
          <Typography variant="body2" component="div">
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>각 체험부스에서 QR 코드를 스캔하여 스탬프를 획득하세요</li>
              <li>총 17개 부스 중 5곳을 방문하면 미션 완료!</li>
              <li>완주 후 운영 본부에서 기념품을 수령하세요</li>
              <li>이미 방문한 부스는 재방문할 수 없습니다</li>
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default BoothListPage;
