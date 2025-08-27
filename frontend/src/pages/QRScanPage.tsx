import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowBack, QrCodeScanner, TextFields } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import QRScanner from '../components/QRScanner';
import ApiService from '../services/api';
import ParticipantStorage from '../utils/participantStorage';

const QRScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  
  // 테스트용 부스 코드 입력
  const [testBoothCode, setTestBoothCode] = useState('');

  const handleGoBack = () => {
    navigate('/');
  };

  // QR 스캔 처리 (실제 QR 스캔은 6일차에 구현)
  const handleScanResult = useCallback(async (boothCode: string) => {
    try {
      setScanning(true);
      setError('');
      setMessage('');

      const participantId = ParticipantStorage.getParticipantId();
      
      const response = await ApiService.scanQR({
        participant_id: participantId || undefined,
        booth_code: boothCode
      });

      if (response.success && response.data) {
        // 참여자 ID 저장
        ParticipantStorage.setParticipantId(response.data.participant_id);
        
        // 참여자 데이터 업데이트
        ParticipantStorage.setParticipantData({
          id: response.data.participant_id,
          created_at: new Date().toISOString(),
          stamp_count: response.data.stamp_count,
          is_completed: response.data.is_completed,
          completed_at: response.data.completed_at,
        });

        setMessage(response.message || '스탬프를 획득했습니다!');
        
        // 완주 시 축하 메시지
        if (response.data.is_completed) {
          setTimeout(() => {
            navigate('/complete');
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data.message || '이미 방문한 부스입니다.');
      } else {
        setError('QR 스캔 중 오류가 발생했습니다.');
      }
      console.error('QR scan error:', err);
    } finally {
      setScanning(false);
    }
  }, [navigate]);

  // URL 파라미터에서 부스 코드 확인 (QR 코드 스캔으로 접근한 경우)
  React.useEffect(() => {
    const boothParam = searchParams.get('booth');
    console.log('🔍 URL 파라미터 확인:', {
      fullURL: window.location.href,
      searchParams: searchParams.toString(),
      boothParam: boothParam
    });
    
    if (boothParam) {
      console.log('✅ 부스 코드 발견, 스캔 처리 시작:', boothParam);
      handleScanResult(boothParam);
    } else {
      console.log('❌ 부스 코드를 찾을 수 없습니다');
    }
  }, [searchParams, handleScanResult]);

  // 테스트용 스캔
  const handleTestScan = () => {
    if (testBoothCode.trim()) {
      handleScanResult(testBoothCode.trim());
    }
  };

  return (
    <Layout title="QR 스캔">
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
          color="primary"
        >
          돌아가기
        </Button>
      </Box>

      <Typography variant="h5" component="h1" gutterBottom align="center">
        📱 QR 코드 스캔
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        체험부스의 QR 코드를 스캔하여 스탬프를 획득하세요
      </Typography>

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

      {/* 스캔 방법 선택 탭 */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
            <Tab icon={<QrCodeScanner />} label="QR 스캐너" />
            <Tab icon={<TextFields />} label="코드 입력" />
          </Tabs>
        </Box>

        <CardContent>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom align="center">
                📷 QR 코드 스캔
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                카메라를 사용하여 QR 코드를 직접 스캔하세요
              </Typography>
              <QRScanner
                onScan={(data) => {
                  console.log('📱 QR 스캔 데이터:', data);
                  if (!data) {
                    console.log('❌ 빈 데이터');
                    return;
                  }
                  
                  let boothCode = '';
                  
                  // 다양한 형식의 QR 데이터 처리
                  try {
                    // 1. 완전한 URL인 경우
                    const url = new URL(data);
                    boothCode = url.searchParams.get('booth') || '';
                    console.log('✅ URL 파싱 성공:', { url: data, boothCode });
                  } catch (urlError) {
                    console.log('🔍 URL 파싱 실패, 다른 방법 시도:', urlError);
                    
                    // 2. booth= 패턴을 직접 찾기
                    const boothMatch = data.match(/[?&]booth=([^&]+)/);
                    if (boothMatch) {
                      boothCode = decodeURIComponent(boothMatch[1]);
                      console.log('✅ 정규식 매칭 성공:', boothCode);
                    } else {
                      // 3. 데이터 자체가 부스 코드인 경우 (art1, folk1 등)
                      const trimmedData = data.trim();
                      if (/^(art|folk|life)\d+$/i.test(trimmedData)) {
                        boothCode = trimmedData;
                        console.log('✅ 부스 코드 직접 인식:', boothCode);
                      } else {
                        console.log('❌ 모든 방법 실패, 데이터:', trimmedData);
                      }
                    }
                  }

                  // 최종 처리
                  if (boothCode && boothCode.trim()) {
                    console.log('🎉 부스 코드 추출 성공:', boothCode.trim());
                    handleScanResult(boothCode.trim());
                  } else {
                    console.log('❌ 부스 코드 추출 실패, 원본 데이터:', data);
                    setError(`유효하지 않은 QR 코드입니다. 데이터: ${data.substring(0, 50)}...`);
                  }
                }}
                onError={(errorMsg) => setError(errorMsg)}
                scanning={scanning}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom align="center">
                ⌨️ 부스 코드 입력
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                테스트를 위해 부스 코드를 직접 입력하세요
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="medium"
                  fullWidth
                  placeholder="부스 코드 (예: BOOTH001)"
                  value={testBoothCode}
                  onChange={(e) => setTestBoothCode(e.target.value)}
                  disabled={scanning}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && testBoothCode.trim()) {
                      handleTestScan();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleTestScan}
                  disabled={scanning || !testBoothCode.trim()}
                  sx={{ minWidth: 120 }}
                >
                  {scanning ? '처리 중...' : '스캔'}
                </Button>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                BOOTH001~BOOTH017 중 하나를 입력하세요
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 사용 안내 */}
      <Card sx={{ backgroundColor: '#f8f9fa' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            📱 사용 방법
          </Typography>
          <Typography variant="body2" component="div">
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li><strong>QR 스캐너:</strong> 카메라로 직접 QR 코드 스캔</li>
              <li><strong>코드 입력:</strong> 부스 코드를 수동으로 입력</li>
              <li>성공적으로 스캔하면 자동으로 스탬프가 기록됩니다</li>
              <li>5개 스탬프를 모두 모으면 미션 완료!</li>
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default QRScanPage;
