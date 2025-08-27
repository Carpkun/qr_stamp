import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import { CheckCircle, ArrowBack, ViewModule } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiService from '../services/api';
import ParticipantStorage from '../utils/participantStorage';

const StampPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [visitedCount, setVisitedCount] = useState<number>(0);
  const [totalBooths, setTotalBooths] = useState<number>(0);

  const goHome = () => navigate('/');
  const goStatus = () => navigate('/booths');

  const processScan = useCallback(async (boothCode: string) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // 전체 부스 수 로드
      try {
        const boothsRes = await ApiService.getBooths();
        if (boothsRes.success && boothsRes.data) {
          setTotalBooths(boothsRes.data.length);
        }
      } catch (e) {
        // 부스 수 조회 실패는 치명적이지 않음
      }

      const participantId = ParticipantStorage.getParticipantId();
      const res = await ApiService.scanQR({
        participant_id: participantId || undefined,
        booth_code: boothCode,
      });

      if (res.success && res.data) {
        // 참여자 저장
        ParticipantStorage.setParticipantId(res.data.participant_id);
        ParticipantStorage.setParticipantData({
          id: res.data.participant_id,
          created_at: new Date().toISOString(),
          stamp_count: res.data.stamp_count,
          is_completed: res.data.is_completed,
          completed_at: res.data.completed_at,
        });

        setVisitedCount(res.data.stamp_count);
        setMessage(res.message || '스탬프를 획득했습니다!');
      } else {
        setError('스캔 결과 처리에 실패했습니다.');
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        // 중복 방문 등의 안내
        setVisitedCount(err.response.data?.data?.stamp_count ?? 0);
        setMessage(err.response.data?.message || '이미 이 부스에서 스탬프를 받았습니다.');
      } else if (err.response?.status === 404) {
        setError('존재하지 않거나 비활성화된 부스입니다.');
      } else {
        setError('QR 처리 중 오류가 발생했습니다.');
      }
      console.error('StampPage scan error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const boothParam = searchParams.get('booth');
    if (!boothParam) {
      setError('부스 코드가 포함된 유효한 QR 링크가 아닙니다. (예: /stamp?booth=art1)');
      setLoading(false);
      return;
    }
    processScan(boothParam);
  }, [searchParams, processScan]);

  if (loading) {
    return (
      <Layout title="QR 처리 중">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="QR 스탬프 처리 결과">
      <Box sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={goHome} color="primary">
          홈으로
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
            <ViewModule color="primary" sx={{ mr: 1, fontSize: '1.5rem' }} />
            <Typography variant="h6" color="primary" fontWeight="bold">
              체험부스 참여 현황
            </Typography>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="h2" component="div" fontWeight="bold" color="primary">
              {visitedCount} / {totalBooths || 17}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              개의 체험부스를 방문했습니다
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Box textAlign="center">
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CheckCircle />}
          onClick={goStatus}
          sx={{ minWidth: 240 }}
        >
          체험부스 참여 현황 보기
        </Button>
      </Box>
    </Layout>
  );
};

export default StampPage;
