import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Fab,
} from '@mui/material';
import { Home, Share, Celebration } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ParticipantStorage from '../utils/participantStorage';

// 폭죽 효과를 위한 인터페이스
interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
}

const CompletePage: React.FC = () => {
  const navigate = useNavigate();
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [showFireworks, setShowFireworks] = useState(true);
  const [participantData, setParticipantData] = useState<any>(null);

  // 참여자 데이터 로드
  useEffect(() => {
    const data = ParticipantStorage.getParticipantData();
    setParticipantData(data);
  }, []);

  // 폭죽 생성
  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newFireworks: Firework[] = [];
    
    // 12개의 폭죽 생성
    for (let i = 0; i < 12; i++) {
      newFireworks.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 60 + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 3000,
      });
    }
    
    setFireworks(newFireworks);
    
    // 10초 후 폭죽 효과 종료
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '소양강문화제 2025 - QR 스탬프 투어',
        text: '전통문화 체험 스탬프 투어를 완주했습니다! 🎉',
        url: window.location.origin,
      });
    } else {
      // 웹 공유가 지원되지 않는 경우 클립보드에 복사
      const shareText = `소양강문화제 2025 QR 스탬프 투어를 완주했습니다! 🎉\n${window.location.origin}`;
      navigator.clipboard.writeText(shareText);
      alert('공유 링크가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <Layout title="미션 완료!">
      {/* 폭죽 애니메이션 */}
      {showFireworks && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {fireworks.map((firework) => (
            <Box
              key={firework.id}
              sx={{
                position: 'absolute',
                left: `${firework.x}%`,
                top: `${firework.y}%`,
                fontSize: '2rem',
                animation: `firework-explosion 2s ease-out infinite`,
                animationDelay: `${firework.delay}ms`,
                color: firework.color,
                '&::before': {
                  content: '"✨"',
                  position: 'absolute',
                  animation: 'sparkle 1s ease-out infinite',
                  animationDelay: `${firework.delay + 500}ms`,
                },
                '&::after': {
                  content: '"💫"',
                  position: 'absolute',
                  animation: 'sparkle 1.5s ease-out infinite',
                  animationDelay: `${firework.delay + 800}ms`,
                },
              }}
            >
              🎆
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ textAlign: 'center', py: 4, position: 'relative' }}>
        {/* 메인 축하 애니메이션 */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h1" 
            component="div" 
            sx={{ 
              fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
              mb: 2,
              animation: 'celebration-bounce 1.5s ease-in-out infinite',
              textShadow: '0 0 20px rgba(255,215,0,0.8)',
            }}
          >
            🏆
          </Typography>
          
          <Typography 
            variant="h1" 
            component="div" 
            sx={{ 
              fontSize: { xs: '2rem', sm: '3rem' },
              mb: 2,
              animation: 'party-wave 2s ease-in-out infinite',
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <span style={{ animationDelay: '0ms' }}>🎉</span>
            <span style={{ animationDelay: '200ms' }}>🎊</span>
            <span style={{ animationDelay: '400ms' }}>🎈</span>
            <span style={{ animationDelay: '600ms' }}>🎊</span>
            <span style={{ animationDelay: '800ms' }}>🎉</span>
          </Typography>
        </Box>
        
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold',
            animation: 'gradient-text 3s ease-in-out infinite',
            fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
          }}
        >
          🏮 축하합니다! 🏮
        </Typography>
        
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            color: 'text.primary',
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
          }}
        >
          제46회 소양강문화제 스탬프 투어 완주!
        </Typography>

        {/* 완주 메시지 카드 */}
        <Card 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            color: 'white',
            transform: 'scale(1)',
            animation: 'success-pulse 2s ease-in-out infinite',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <CardContent sx={{ py: 4, px: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Celebration sx={{ fontSize: '1.5rem' }} />
              {participantData?.stamp_count || 5}개 부스 완주 성공!
              <Celebration sx={{ fontSize: '1.5rem' }} />
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
              🏮 제46회 소양강문화제 🏮<br />
              체험부스 스탬프 투어를<br />
              성공적으로 완료하셨습니다!
            </Typography>
            <Typography variant="h6" color="inherit" sx={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
              🎁 운영 본부에서 기념품을 수령하세요!
            </Typography>
            {participantData?.completed_at && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                완료 시간: {new Date(participantData.completed_at).toLocaleString('ko-KR')}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          <Fab
            variant="extended"
            size="large"
            onClick={handleGoHome}
            sx={{
              py: 2,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Home sx={{ mr: 1 }} />
            홈으로 돌아가기
          </Fab>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Share />}
            onClick={handleShare}
            sx={{ 
              py: 1.5,
              fontSize: '1rem',
              borderWidth: 2,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#5a6fd8',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            완주 소식 공유하기
          </Button>
        </Box>

        {/* 안내 메시지 */}
        <Card sx={{ mt: 4, backgroundColor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📍 기념품 수령 안내
            </Typography>
            <Typography variant="body2" component="div">
              <Box component="ul" sx={{ pl: 2, mb: 0, textAlign: 'left' }}>
                <li>운영 본부 (메인 무대 옆)로 이동하세요</li>
                <li>이 화면을 운영진에게 보여주세요</li>
                <li>기념품을 받고 축제를 계속 즐기세요!</li>
                <li>소양강문화제에 참여해 주셔서 감사합니다</li>
              </Box>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* CSS 애니메이션 추가 */}
      <style>
        {`
          @keyframes celebration-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(0deg); }
            10% { transform: translateY(-20px) rotate(-5deg); }
            40% { transform: translateY(-15px) rotate(5deg); }
            60% { transform: translateY(-10px) rotate(-3deg); }
          }

          @keyframes party-wave {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
            25% { transform: translateY(-10px) rotate(-10deg) scale(1.1); }
            50% { transform: translateY(-5px) rotate(10deg) scale(1.05); }
            75% { transform: translateY(-8px) rotate(-5deg) scale(1.08); }
          }

          @keyframes firework-explosion {
            0% { 
              transform: scale(0) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: scale(1.5) rotate(180deg);
              opacity: 1;
            }
            100% {
              transform: scale(2) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes sparkle {
            0% { 
              transform: translate(0, 0) scale(0);
              opacity: 1;
            }
            50% {
              transform: translate(-20px, -20px) scale(1);
              opacity: 0.8;
            }
            100% {
              transform: translate(-40px, -40px) scale(0);
              opacity: 0;
            }
          }

          @keyframes gradient-text {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes success-pulse {
            0% { transform: scale(1); box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3); }
            50% { transform: scale(1.02); box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4); }
            100% { transform: scale(1); box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3); }
          }

          /* 반응형 애니메이션 */
          @media (max-width: 600px) {
            @keyframes firework-explosion {
              0% { 
                transform: scale(0) rotate(0deg);
                opacity: 1;
              }
              50% {
                transform: scale(1) rotate(180deg);
                opacity: 1;
              }
              100% {
                transform: scale(1.5) rotate(360deg);
                opacity: 0;
              }
            }
          }
        `}
      </style>
    </Layout>
  );
};

export default CompletePage;
