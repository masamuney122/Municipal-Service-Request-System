import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useServiceRequest } from '../contexts/ServiceRequestContext';
import { useAuth } from '../contexts/AuthContext';
import { ServiceRequest } from '../types';

const statusColors = {
  pending: 'warning',
  'in-progress': 'info',
  resolved: 'success',
  rejected: 'error'
} as const;

const statusIcons = {
  pending: <PendingIcon />,
  'in-progress': <AssignmentIcon />,
  resolved: <CheckCircleIcon />,
  rejected: <ErrorIcon />
} as const;

const ServiceRequestList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading, error, getMyRequests, updateStatus } = useServiceRequest();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceRequest['status']>('pending');
  const [statusComment, setStatusComment] = useState('');

  useEffect(() => {
    getMyRequests();
  }, [getMyRequests]);

  const handleUpdateStatus = async () => {
    if (selectedRequest && selectedStatus) {
      try {
        await updateStatus(selectedRequest._id, selectedStatus, statusComment);
        setStatusDialogOpen(false);
        getMyRequests();
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<ServiceRequest['status']>) => {
    setSelectedStatus(event.target.value as ServiceRequest['status']);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {user?.role === 'admin' ? 'All Service Requests' : 'My Service Requests'}
        </Typography>
        {user?.role !== 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/requests/new')}
          >
            New Request
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>{request.title}</TableCell>
                <TableCell>{request.category}</TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[request.status]}
                    label={request.status.replace('-', ' ')}
                    color={statusColors[request.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/requests/${request._id}`)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {user?.role === 'admin' && (
                    <Tooltip title="Update Status">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedRequest(request);
                          setSelectedStatus(request.status);
                          setStatusDialogOpen(true);
                        }}
                      >
                        <AssignmentIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Request Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceRequestList;