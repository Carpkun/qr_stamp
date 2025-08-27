import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import HomePage from './pages/HomePage';
import QRScanPage from './pages/QRScanPage';
import StampPage from './pages/StampPage';
import BoothListPage from './pages/BoothListPage';
import CompletePage from './pages/CompletePage';
import AdminPage from './pages/AdminPage';
import BoothManagementPage from './pages/BoothManagementPage';
import AdminStatisticsPage from './pages/AdminStatisticsPage';
import AdminGiftPage from './pages/AdminGiftPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import DjangoAdminLoginPage from './pages/DjangoAdminLoginPage';
import DjangoAdminDashboard from './pages/DjangoAdminDashboard';
import './App.css';

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#f093fb',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<QRScanPage />} />
          <Route path="/booths" element={<BoothListPage />} />
          <Route path="/complete" element={<CompletePage />} />
          {/* QR 링크로 접속 시 자동 처리/요약 페이지 */}
          <Route path="/stamp" element={<StampPage />} />
          {/* Django 스타일 관리자 페이지 */}
          <Route path="/admin/login" element={<DjangoAdminLoginPage />} />
          <Route path="/admin/dashboard" element={<DjangoAdminDashboard />} />
          {/* 기존 관리자 페이지 */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/booths" element={<BoothManagementPage />} />
          <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
          <Route path="/admin/gift" element={<AdminGiftPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
