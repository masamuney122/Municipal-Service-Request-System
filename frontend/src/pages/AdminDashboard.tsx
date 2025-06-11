import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useServiceRequest } from '../contexts/ServiceRequestContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ServiceRequest } from '../types';
import { adminAPI, serviceRequestAPI } from '../services/api';

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

const departments = [
  { value: 'Water Works Association', label: 'Water Works Association' },
  { value: 'Electric Association', label: 'Electric Association' },
  { value: 'Gas Association', label: 'Gas Association' },
  { value: 'Parks and Recreation', label: 'Parks and Recreation' },
  { value: 'Municipality', label: 'Municipality' },
  { value: 'Governorship', label: 'Governorship' },
  { value: 'Ministry of Environment Urbanization and Climate Change', label: 'Ministry of Environment Urbanization and Climate Change' },
  { value: 'Ministry of Transport and Infrastructure', label: 'Ministry of Transport and Infrastructure' },
  { value: 'Ministry of the Interior', label: 'Ministry of the Interior' },
  { value: 'Ministry of Health', label: 'Ministry of Health' },
  { value: 'Other', label: 'Other' }
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading, error, getAdminRequests } = useServiceRequest();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ServiceRequest['status']>('pending');
  const [statusComment, setStatusComment] = useState('');
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        await getAdminRequests();
        setErrorState(null);
      } catch (error: any) {
        console.error('Error fetching requests:', error.response?.data || error.message);
        setErrorState('Failed to fetch requests. Please try again.');
      }
    };
    fetchRequests();
  }, [getAdminRequests]);

  const handleAssignRequest = async () => {
    if (selectedRequest && selectedDepartment) {
      try {
        setErrorState(null);
        console.log('Assigning department:', {
          requestId: selectedRequest._id,
          department: selectedDepartment
        });

        // First update the department
        const response = await serviceRequestAPI.updateRequest(selectedRequest._id, {
          assignedTo: selectedDepartment
        });
        
        console.log('Assignment response:', response);
        
        if (response && response._id) {
          // Then update the status if needed
          if (response.status !== 'in-progress') {
            await serviceRequestAPI.updateStatus(selectedRequest._id, 'in-progress', `Assigned to ${selectedDepartment} department`);
          }
          
          handleCloseAssignDialog();
          await getAdminRequests();
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        console.error('Error assigning request:', {
          error: error.response?.data || error.message,
          requestId: selectedRequest._id,
          department: selectedDepartment
        });
        setErrorState(error.response?.data?.message || error.message || 'Failed to assign department');
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedRequest && selectedStatus) {
      try {
        setErrorState(null);
        console.log('Updating status:', {
          requestId: selectedRequest._id,
          status: selectedStatus,
          comment: statusComment
        });

        // Use the correct status update endpoint
        const response = await serviceRequestAPI.updateStatus(
          selectedRequest._id,
          selectedStatus,
          statusComment || 'Status updated'
        );
        
        console.log('Status update response:', response);
        
        if (response && response._id) {
          handleCloseStatusDialog();
          await getAdminRequests();
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        console.error('Error updating status:', {
          error: error.response?.data || error.message,
          requestId: selectedRequest._id,
          status: selectedStatus
        });
        setErrorState(error.response?.data?.message || error.message || 'Failed to update status');
      }
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedRequest(null);
    setSelectedDepartment('');
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedRequest(null);
    setSelectedStatus('pending');
    setStatusComment('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorState) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorState}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Service Requests
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Department</TableCell>
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
                <TableCell>{request.assignedTo || 'Not Assigned'}</TableCell>
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
                  <Tooltip title="Assign Department">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedDepartment(request.assignedTo || '');
                        setAssignDialogOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <AssignmentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Update Status">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedRequest(request);
                        setSelectedStatus(request.status);
                        setStatusDialogOpen(true);
                      }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Department Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog}>
        <DialogTitle>Assign Department</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartment}
              label="Department"
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.value} value={dept.value}>
                  {dept.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button onClick={handleAssignRequest} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value as ServiceRequest['status'])}
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
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 