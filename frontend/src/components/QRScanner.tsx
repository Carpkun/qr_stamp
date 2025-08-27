import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { CameraAlt, StopCircle } from '@mui/icons-material';
import { BrowserMultiFormatReader } from '@zxing/library';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  scanning: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, scanning }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const checkCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop()); // 권한 확인 후 스트림 중단
    } catch (err) {
      setHasPermission(false);
      setError('카메라 접근 권한이 필요합니다.');
      if (onError) {
        onError('카메라 접근 권한이 필요합니다.');
      }
    }
  }, [onError]);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 카메라 권한 확인
    checkCameraPermission();
    
    return () => {
      // 정리: 스캐닝 중단
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [checkCameraPermission]);

  const startScanning = async () => {
    if (!videoRef.current || scanning) return;
    
    try {
      setIsScanning(true);
      setError('');
      
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      // QR 코드 스캔 시작
      const result = await codeReader.current.decodeOnceFromVideoDevice(
        undefined, // 기본 카메라 사용
        videoRef.current
      );
      
      if (result && result.getText()) {
        onScan(result.getText());
      }
    } catch (err: any) {
      console.error('QR 스캔 오류:', err);
      setError('QR 코드를 찾을 수 없습니다. 다시 시도해주세요.');
      if (onError) {
        onError('QR 코드 스캔에 실패했습니다.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  if (hasPermission === null) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1">카메라 권한을 확인하는 중...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            카메라 접근 권한이 필요합니다.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            브라우저 설정에서 카메라 권한을 허용하고 새로고침해주세요.
          </Typography>
          <Button
            variant="outlined"
            onClick={checkCameraPermission}
            sx={{ mt: 2 }}
          >
            권한 다시 확인
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardContent>
          {/* 비디오 스트림 */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 300,
              backgroundColor: '#000',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline
              muted
            />
            
            {/* 스캐닝 오버레이 */}
            {isScanning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)'
                }}
              >
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <CircularProgress color="inherit" size={40} sx={{ mb: 1 }} />
                  <Typography variant="body2">QR 코드를 스캔하는 중...</Typography>
                </Box>
              </Box>
            )}

            {/* 스캔 가이드 프레임 */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 200,
                height: 200,
                transform: 'translate(-50%, -50%)',
                border: '2px solid #fff',
                borderRadius: 2,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: 30,
                  height: 30,
                },
                '&::before': {
                  top: -2,
                  left: -2,
                  borderTop: '4px solid #667eea',
                  borderLeft: '4px solid #667eea',
                },
                '&::after': {
                  bottom: -2,
                  right: -2,
                  borderBottom: '4px solid #667eea',
                  borderRight: '4px solid #667eea',
                }
              }}
            />
          </Box>

          {/* 컨트롤 버튼 */}
          <Box sx={{ textAlign: 'center' }}>
            {!isScanning ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<CameraAlt />}
                onClick={startScanning}
                disabled={scanning}
                sx={{ minWidth: 200 }}
              >
                QR 코드 스캔 시작
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="large"
                startIcon={<StopCircle />}
                onClick={stopScanning}
                color="secondary"
                sx={{ minWidth: 200 }}
              >
                스캔 중단
              </Button>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            QR 코드를 화면 중앙의 프레임에 맞춰주세요
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QRScanner;
