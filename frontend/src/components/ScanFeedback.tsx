import React from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Slide
} from '@mui/material';
import { CheckCircle, Error, EmojiEvents } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { styled, keyframes } from '@mui/material/styles';

// 애니메이션 정의
const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const AnimatedIcon = styled(Box)<{ success: boolean }>(({ theme, success }) => ({
  animation: `${bounceIn} 0.6s ease-out`,
  color: success ? theme.palette.success.main : theme.palette.error.main,
  '& .MuiSvgIcon-root': {
    fontSize: '4rem',
    animation: success ? `${pulse} 1.5s infinite` : 'none',
  },
}));

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ScanFeedbackProps {
  open: boolean;
  success: boolean;
  message: string;
  isCompleted?: boolean;
  boothName?: string;
  stampCount?: number;
  onClose: () => void;
}

const ScanFeedback: React.FC<ScanFeedbackProps> = ({
  open,
  success,
  message,
  isCompleted = false,
  boothName,
  stampCount,
  onClose
}) => {
  const getIcon = () => {
    if (isCompleted) {
      return <EmojiEvents />;
    }
    return success ? <CheckCircle /> : <Error />;
  };

  const getTitle = () => {
    if (isCompleted) {
      return '🎉 미션 완료!';
    }
    return success ? '✅ 스탬프 획득!' : '❌ 스캔 실패';
  };

  const getBackgroundColor = () => {
    if (isCompleted) {
      return 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    }
    return success 
      ? 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)'
      : 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: getBackgroundColor(),
          color: 'white',
          textAlign: 'center',
        }
      }}
    >
      <DialogContent sx={{ py: 4, px: 3 }}>
        {/* 애니메이션 아이콘 */}
        <AnimatedIcon success={success} sx={{ mb: 2 }}>
          {getIcon()}
        </AnimatedIcon>

        {/* 제목 */}
        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
          {getTitle()}
        </Typography>

        {/* 메시지 */}
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          {message}
        </Typography>

        {/* 부스 정보 (성공 시) */}
        {success && boothName && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>방문 부스:</strong> {boothName}
            </Typography>
            {stampCount !== undefined && (
              <Typography variant="body1">
                <strong>현재 스탬프:</strong> {stampCount}/5개
              </Typography>
            )}
          </Box>
        )}

        {/* 완주 메시지 */}
        {isCompleted && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="body1" gutterBottom>
              🏆 전통문화 체험 스탬프 투어 완주!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              본부석에서 기념품을 받아가세요!
            </Typography>
          </Box>
        )}

        {/* 확인 버튼 */}
        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          sx={{
            mt: 2,
            px: 4,
            py: 1.5,
            backgroundColor: 'rgba(255,255,255,0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
            borderRadius: 3,
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        >
          {isCompleted ? '축하 페이지로 이동' : '확인'}
        </Button>

        {/* 자동 닫힘 안내 */}
        <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.7 }}>
          {isCompleted ? '2초 후 자동으로 이동합니다' : '1.5초 후 자동으로 홈으로 이동합니다'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ScanFeedback;
