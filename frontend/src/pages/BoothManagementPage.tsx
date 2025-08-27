import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack,
  Store as StoreIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiService from '../services/api';
import { BoothManagement, CreateBoothRequest, UpdateBoothRequest } from '../types/api';

const BoothManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [booths, setBooths] = useState<BoothManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 다이얼로그 상태
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<BoothManagement | null>(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true
  });

  const loadBooths = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getBoothsForManagement();
      if (response.success && response.data) {
        setBooths(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '부스 목록을 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Failed to load booths:', {
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooths();
  }, []);

  const handleGoBack = () => {
    navigate('/admin');
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      is_active: true
    });
  };

  const handleCreateBooth = async () => {
    try {
      setError(null);
      
      const request: CreateBoothRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active
      };
      
      const response = await ApiService.createBooth(request);
      if (response.success) {
        setSuccess(response.message || '부스가 성공적으로 생성되었습니다.');
        setCreateDialogOpen(false);
        resetForm();
        loadBooths();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '부스 생성 중 오류가 발생했습니다.';
      setError(errorMsg);
    }
  };

  const handleEditBooth = (booth: BoothManagement) => {
    setSelectedBooth(booth);
    setFormData({
      code: booth.code,
      name: booth.name,
      description: booth.description,
      is_active: booth.is_active
    });
    setEditDialogOpen(true);
  };

  const handleUpdateBooth = async () => {
    if (!selectedBooth) return;
    
    try {
      setError(null);
      
      const request: UpdateBoothRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.is_active
      };
      
      const response = await ApiService.updateBooth(selectedBooth.id, request);
      if (response.success) {
        setSuccess(response.message || '부스 정보가 업데이트되었습니다.');
        setEditDialogOpen(false);
        setSelectedBooth(null);
        resetForm();
        loadBooths();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '부스 업데이트 중 오류가 발생했습니다.';
      setError(errorMsg);
    }
  };

  const handleDeleteBooth = async (booth: BoothManagement) => {
    if (!window.confirm(`부스 "${booth.code} - ${booth.name}"를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      setError(null);
      
      const response = await ApiService.deleteBooth(booth.id);
      if (response.success) {
        setSuccess(response.message || '부스가 삭제되었습니다.');
        loadBooths();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '부스 삭제 중 오류가 발생했습니다.';
      setError(errorMsg);
    }
  };

  if (loading) {
    return (
      <Layout title="부스 관리">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="부스 관리">
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
          color="primary"
        >
          관리자 페이지로 돌아가기
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        🏪 체험부스 관리
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        체험부스를 추가, 수정, 삭제할 수 있습니다
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <StoreIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">전체 부스 현황</Typography>
                <Typography variant="body2">
                  총 {booths.length}개 부스 (활성: {booths.filter(b => b.is_active).length}개, 
                  비활성: {booths.filter(b => !b.is_active).length}개)
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } 
              }}
            >
              새 부스 추가
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 부스 테이블 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>부스 코드</TableCell>
                <TableCell>부스 이름</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>상태</TableCell>
                <TableCell align="center">
                  <PeopleIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  참여자
                </TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {booths.map((booth) => (
                <TableRow key={booth.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {booth.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {booth.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {booth.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={booth.is_active ? '활성' : '비활성'} 
                      color={booth.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {booth.participant_count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(booth.created_at).toLocaleDateString('ko-KR')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="수정">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditBooth(booth)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={booth.participant_count > 0 ? "참여자가 있어 비활성화만 가능" : "삭제"}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteBooth(booth)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {booths.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      등록된 부스가 없습니다. 새 부스를 추가해보세요.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 부스 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>새 부스 추가</DialogTitle>
        <DialogContent>
          <TextField
            label="부스 코드"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            fullWidth
            margin="normal"
            required
            placeholder="예: BOOTH001"
            helperText="부스별로 고유한 코드를 입력하세요"
          />
          <TextField
            label="부스 이름"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            placeholder="예: 전통 한지공예 체험"
          />
          <TextField
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="부스에서 진행되는 체험 활동을 설명해주세요"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="활성화"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleCreateBooth}
            variant="contained"
            disabled={!formData.code.trim() || !formData.name.trim()}
          >
            생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 부스 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>부스 정보 수정</DialogTitle>
        <DialogContent>
          <TextField
            label="부스 코드"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            fullWidth
            margin="normal"
            required
            placeholder="예: BOOTH001"
          />
          <TextField
            label="부스 이름"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            margin="normal"
            required
            placeholder="예: 전통 한지공예 체험"
          />
          <TextField
            label="설명"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            placeholder="부스에서 진행되는 체험 활동을 설명해주세요"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="활성화"
            sx={{ mt: 1 }}
          />
          {selectedBooth && selectedBooth.participant_count > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              이 부스에는 {selectedBooth.participant_count}명의 참여자가 있습니다. 
              비활성화는 가능하지만 완전 삭제는 할 수 없습니다.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleUpdateBooth}
            variant="contained"
            disabled={!formData.code.trim() || !formData.name.trim()}
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default BoothManagementPage;
