import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  minHeight: 'calc(100vh - 64px)',
  display: 'flex',
  flexDirection: 'column',
}));

const Footer = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2, 0),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'QR 스탬프 투어' }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 헤더 */}
      <StyledAppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🎯 {title}
          </Typography>
        </Toolbar>
      </StyledAppBar>

      {/* 메인 콘텐츠 */}
      <StyledContainer maxWidth="sm">
        {children}
      </StyledContainer>

      {/* 푸터 */}
      <Footer>
        <Typography variant="body2" color="text.secondary">
          소양강문화제 2025 - QR 스탬프 투어 시스템
        </Typography>
      </Footer>
    </Box>
  );
};

export default Layout;
