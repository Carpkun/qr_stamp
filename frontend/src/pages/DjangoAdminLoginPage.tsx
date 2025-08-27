import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  Paper
} from '@mui/material';
import { Login as LoginIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminAuth from '../utils/adminAuth';

const DjangoAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 간단한 하드코딩된 인증 (실제로는 API를 통해 Django의 관리자 인증을 사용)
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        AdminAuth.login();
        navigate('/admin/dashboard');
      } else {
        setError('사용자 이름이나 비밀번호가 올바르지 않습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          {/* 헤더 */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                color: '#417690',
                fontWeight: 'bold',
                fontSize: '2rem',
                mb: 1
              }}
            >
              Django 사이트 관리
            </Typography>
            <Box sx={{ width: 60, height: 3, bgcolor: '#417690', mx: 'auto', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              QR 스탬프 투어 관리 시스템
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 로그인 폼 */}
          <Card variant="outlined" sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 3 }}>
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="사용자 이름"
                  name="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  margin="normal"
                  required
                  autoComplete="username"
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#417690',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#417690',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#417690',
                    },
                  }}
                />
                
                <TextField
                  fullWidth
                  label="비밀번호"
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#417690',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#417690',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#417690',
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !credentials.username || !credentials.password}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    backgroundColor: '#417690',
                    '&:hover': {
                      backgroundColor: '#2e5468',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                    },
                  }}
                  startIcon={<LoginIcon />}
                >
                  {loading ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 네비게이션 링크 */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link 
              component="button" 
              variant="body2" 
              onClick={handleGoHome}
              sx={{ 
                color: '#417690',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              <HomeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              메인 페이지로 돌아가기
            </Link>
          </Box>

          {/* 도움말 */}
          <Box sx={{ mt: 4, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>테스트 계정:</strong><br />
              사용자명: admin, 비밀번호: admin
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DjangoAdminLoginPage;
