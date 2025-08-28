import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

const ProgressCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  marginBottom: theme.spacing(2),
}));

const StampIcon = styled(Box)<{ completed: boolean }>(({ theme, completed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: completed ? '#4caf50' : theme.palette.grey[300],
  color: completed ? 'white' : theme.palette.grey[600],
  margin: theme.spacing(1),
}));

interface StampProgressProps {
  stampCount: number;
  isCompleted: boolean;
  progressPercentage: number;
  remainingStamps: number;
  totalStamps?: number;
}

const StampProgress: React.FC<StampProgressProps> = ({
  stampCount,
  isCompleted,
  progressPercentage,
  remainingStamps,
  totalStamps = 5,
}) => {
  const stamps = Array.from({ length: totalStamps }, (_, i) => i < stampCount);

  return (
    <Box>
      {/* 진행률 카드 */}
      <ProgressCard>
        <CardContent>
          <Typography variant="h4" component="div" align="center" gutterBottom>
            {isCompleted ? '🎉 미션 완료!' : `${stampCount}/${totalStamps}`}
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 2 }}>
            {isCompleted 
              ? '축하합니다! 본부석에서 기념품을 받으세요!'
              : `${remainingStamps}개의 스탬프가 더 필요합니다`
            }
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
                borderRadius: 4,
              },
            }}
          />
          
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            진행률: {progressPercentage.toFixed(1)}%
          </Typography>
        </CardContent>
      </ProgressCard>

      {/* 스탬프 상태 표시 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            스탬프 수집 현황
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            {stamps.map((completed, index) => (
              <StampIcon key={index} completed={completed}>
                {completed ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <RadioButtonUnchecked fontSize="small" />
                )}
              </StampIcon>
            ))}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Chip
              label={`완료: ${stampCount}`}
              color="success"
              size="small"
            />
            <Chip
              label={`남은 개수: ${remainingStamps}`}
              color="default"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StampProgress;
