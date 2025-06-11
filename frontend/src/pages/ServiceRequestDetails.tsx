import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ImageList,
  ImageListItem,
  IconButton,
  Dialog,
  DialogContent,
  useTheme,
  useMediaQuery,
  Card,
  CardMedia,
  CardContent,
  Grid
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as FileIcon,
  AttachFile as AttachmentIcon,
  Schedule as ScheduleIcon
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

// Add this function before the ServiceRequestDetails component
const formatDuration = (startDateStr: string, endDateStr: string) => {
  try {
    console.log('Start Date String:', startDateStr);
    console.log('End Date String:', endDateStr);

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    console.log('Start Date Object:', startDate);
    console.log('End Date Object:', endDate);
    console.log('Start Date Valid:', !isNaN(startDate.getTime()));
    console.log('End Date Valid:', !isNaN(endDate.getTime()));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid date';
    }

    const diff = endDate.getTime() - startDate.getTime();
    
    // Convert to hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Build the duration string
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    }

    return parts.join(' ');
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 'Error calculating duration';
  }
};

const ServiceRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentRequest, loading, error, getRequest, addComment } = useServiceRequest();
  const [comment, setComment] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (id) {
      getRequest(id);
    }
  }, [id, getRequest]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && comment.trim()) {
      await addComment(id, comment.trim());
      setComment('');
    }
  };

  // Function to determine if file is an image
  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Function to get file icon
  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) {
      return <ImageIcon />;
    }
    return <FileIcon />;
  };

  // Function to format file size
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Function to handle file download
  const handleDownload = (url: string, filename: string) => {
    const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${url}`;
    fetch(fullUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        console.error('Download error:', error);
        alert('Failed to download file. Please try again.');
      });
  };

  // Function to format remaining time
  const formatRemainingTime = (estimatedDate: string) => {
    const now = new Date();
    const estimated = new Date(estimatedDate);
    const diff = estimated.getTime() - now.getTime();
    
    if (diff < 0) {
      return 'Estimated time has passed';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
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

  if (!currentRequest) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Request not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Service Request Details
        </Typography>
        <Button variant="outlined" onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/requests')}>
          {user?.role === 'admin' ? 'Back to Dashboard' : 'Back to My Requests'}
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {currentRequest.title}
          </Typography>
          <Chip
            icon={statusIcons[currentRequest.status]}
            label={currentRequest.status.replace('-', ' ')}
            color={statusColors[currentRequest.status]}
          />
        </Box>

        <Typography color="text.secondary" paragraph>
          {currentRequest.description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`Category: ${currentRequest.category}`} />
            {currentRequest.status === 'pending' && (
              <Chip
                icon={<ScheduleIcon />}
                label={formatRemainingTime(currentRequest.estimatedResponseTime)}
                color="info"
              />
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            Location: {`${currentRequest.location.address.street}, ${currentRequest.location.address.city}, ${currentRequest.location.address.state} ${currentRequest.location.address.zipCode}`}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
            <Typography variant="body2">
              Created: {new Date(currentRequest.createdAt).toLocaleString()}
            </Typography>
            {currentRequest.status === 'pending' && (
              <Typography variant="body2">
                Estimated Response: {new Date(currentRequest.estimatedResponseTime).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Attachments Section */}
        {currentRequest.attachments && currentRequest.attachments.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachmentIcon />
              Attachments ({currentRequest.attachments.length})
            </Typography>
            <Grid container spacing={2}>
              {currentRequest.attachments.map((attachment, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    {isImageFile(attachment.originalname || '') ? (
                      <CardMedia
                        component="div"
                        sx={{
                          pt: '56.25%', // 16:9 aspect ratio
                          cursor: 'pointer',
                          position: 'relative',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        image={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${attachment.url}`}
                        onClick={() => setSelectedAttachment(attachment.url)}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 140,
                          bgcolor: 'grey.100'
                        }}
                      >
                        <FileIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" noWrap title={attachment.originalname}>
                        {attachment.originalname || 'Unnamed file'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatFileSize(attachment.size)}
                      </Typography>
                      <Button
                        startIcon={<DownloadIcon />}
                        size="small"
                        onClick={() => handleDownload(attachment.url, attachment.originalname || 'download')}
                        sx={{ mt: 1 }}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Image Preview Dialog */}
      <Dialog
        fullScreen={fullScreen}
        open={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'black' }}>
          <IconButton
            onClick={() => setSelectedAttachment(null)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedAttachment && (
            <img
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedAttachment}`}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status History Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon />
          Status History
        </Typography>
        <List>
          {currentRequest.statusHistory.map((history, index) => {
            console.log('Processing status history entry:', history);
            console.log('Current request:', currentRequest);
            
            // Calculate duration from previous status
            const startDate = index > 0 
              ? currentRequest.statusHistory[index - 1].timestamp
              : currentRequest.createdAt;
            
            console.log('Calculated start date:', startDate);
            console.log('History changed at:', history.timestamp);
            
            return (
              <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 1 }}>
                  <Chip
                    size="small"
                    icon={statusIcons[history.status]}
                    label={history.status.replace('-', ' ')}
                    color={statusColors[history.status]}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(history.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    Duration: {formatDuration(startDate, history.timestamp)}
                  </Typography>
                </Box>
                {history.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                    Comment: {history.comment}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                  Changed by: {history.changedBy.name}
                </Typography>
                {index < currentRequest.statusHistory.length - 1 && <Divider sx={{ width: '100%', my: 1 }} />}
              </ListItem>
            );
          })}
          {currentRequest.statusHistory.length === 0 && (
            <ListItem>
              <Typography variant="body2" color="text.secondary">
                No status changes yet
              </Typography>
            </ListItem>
          )}
        </List>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Comments
        </Typography>
        <List>
          {currentRequest.comments.map((comment, index) => {
            console.log('Comment user data:', comment.user);
            return (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    {comment.user?.name?.[0] || 'C'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${comment.user?.name || 'Citizen'} ${comment.user?.role === 'admin' ? '(Admin)' : ''}`}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {comment.text}
                      </Typography>
                      <br />
                      {new Date(comment.createdAt).toLocaleString()}
                    </>
                  }
                />
              </ListItem>
              {index < currentRequest.comments.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          )})}
        </List>

        <Box component="form" onSubmit={handleAddComment} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={!comment.trim()}
          >
            Add Comment
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ServiceRequestDetails; 