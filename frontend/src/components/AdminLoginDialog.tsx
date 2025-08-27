import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  AdminPanelSettings,
  Visibility,
  VisibilityOff,
  Lock,
  Person
} from '@mui/icons-material';

interface AdminLoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  open,
  onClose,
  onLogin
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 관리자 인증 정보
  const ADMIN_USERNAME = 'cccc';
  const ADMIN_PASSWORD = 'ansghk2025$!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 간단한 지연으로 로딩 효과 추가
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 로그인 성공
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_login_time', new Date().getTime().toString());
      onLogin();
      handleClose();
    } else {
      // 로그인 실패
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    setShowPassword(false);
    setLoading(false);
    onClose();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 2 }}>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, color: 'inherit' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <AdminPanelSettings sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">
              관리자 로그인
            </Typography>
          </Box>
        </DialogTitle>
      </Box>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            관리자 권한이 필요한 페이지입니다. 인증 정보를 입력해주세요.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            autoComplete="username"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button 
            onClick={handleClose} 
            color="inherit"
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !username || !password}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 3
            }}
          >
            {loading ? '인증 중...' : '로그인'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AdminLoginDialog;
