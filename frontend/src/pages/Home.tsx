import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  useTheme,
  alpha,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationsIcon,
  Newspaper as NewspaperIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useServiceRequest } from '../contexts/ServiceRequestContext';
import { ServiceRequest } from '../types';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

const statusColors = {
  pending: 'warning',
  'in-progress': 'info',
  resolved: 'success',
  rejected: 'error',
} as const;

const statusIcons = {
  pending: <PendingIcon />,
  'in-progress': <AssignmentIcon />,
  resolved: <CheckCircleIcon />,
  rejected: <ErrorIcon />,
} as const;

interface NewsItem {
  id: number;
  title: string;
  date: string;
  category: string;
  description: string;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  category: string;
  description: string;
}

// Update the mock data with categories
const newsItems: NewsItem[] = [
  {
    id: 1,
    title: 'New Government Services Portal Launch',
    date: '2025-05-24',
    category: 'Public',
    description: 'The government has launched a new digital services portal to streamline citizen services.',
  },
  {
    id: 2,
    title: 'Public Holiday Schedule 2024',
    date: '2025-03-08',
    category: 'Public',
    description: 'View the complete list of public holidays for the year 2025.',
  },
  {
    id: 3,
    title: 'Tax Filing Deadline Extension',
    date: '2025-06-01',
    category: 'Internal',
    description: 'The deadline for tax filing has been extended to September 30, 2025.',
  },
];

const announcements: Announcement[] = [
  {
    id: 1,
    title: 'System Maintenance',
    date: '2025-06-05',
    category: 'Internal',
    description: 'Scheduled maintenance on August 20, 2025, from 2 AM to 4 AM.',
  },
  {
    id: 2,
    title: 'New Features Available',
    date: '2025-04-29',
    category: 'Public',
    description: 'Check out the new features in our service portal.',
  },
];

const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading, error, getMyRequests } = useServiceRequest();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });

  useEffect(() => {
    getMyRequests();
  }, [getMyRequests]);

  useEffect(() => {
    if (requests) {
      const newStats = {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        inProgress: requests.filter((r) => r.status === 'in-progress').length,
        resolved: requests.filter((r) => r.status === 'resolved').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
      };
      setStats(newStats);
    }
  }, [requests]);

  const capitalizeWords = (str: string | undefined): string => {
    if (!str) return '';
    return str.split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} thickness={4} />
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
      {/* Welcome Message */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: 'primary.main',
            fontWeight: 500,
            mb: 1
          }}
        >
          Welcome, {capitalizeWords(user?.name)}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary"
          sx={{ maxWidth: 800 }}
        >
          {user?.role === 'admin' ? (
            "Welcome to the Admin Dashboard. Here you can manage all service requests, track their status, and oversee the system's operations."
          ) : (
            "Welcome to the Municipal Service Request Management System (SRMS). Here you can submit new service requests, track their progress, and stay updated on municipal announcements."
          )}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* News Section */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NewspaperIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" component="h2">
                {user?.role === 'admin' ? 'System Updates & Notices' : 'News & Updates'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {user?.role === 'admin' ? (
                // Admin specific news items
                newsItems.map((news) => (
                  <Card key={news.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {news.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        {news.date}
                      </Typography>
                      <Typography variant="body2">{news.description}</Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Regular user news items - only show public items
                newsItems.filter(news => news.category === 'Public').map((news) => (
                  <Card key={news.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {news.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        {news.date}
                      </Typography>
                      <Typography variant="body2">{news.description}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Announcements Section */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" component="h2">
                {user?.role === 'admin' ? 'System Alerts' : 'Announcements'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {user?.role === 'admin' ? (
                // Admin specific announcements
                announcements.map((announcement) => (
                  <Card key={announcement.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {announcement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        {announcement.date}
                      </Typography>
                      <Typography variant="body2">{announcement.description}</Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Regular user announcements - only show public items
                announcements.filter(a => a.category === 'Public').map((announcement) => (
                  <Card key={announcement.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {announcement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        {announcement.date}
                      </Typography>
                      <Typography variant="body2">{announcement.description}</Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Service Request Stats Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 8,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h6">
                {user?.role === 'admin' ? 'All Service Requests' : 'Your Service Requests'}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <MotionCard
                  whileHover={{ scale: 1.02 }}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MotionCard
                  whileHover={{ scale: 1.02 }}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MotionCard
                  whileHover={{ scale: 1.02 }}
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      {stats.inProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MotionCard
                  whileHover={{ scale: 1.02 }}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      {stats.resolved}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Resolved
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <MotionCard
                  whileHover={{ scale: 1.02 }}
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: 1,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home; 