import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ServiceRequestProvider } from './contexts/ServiceRequestContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ServiceRequestForm from './pages/ServiceRequestForm';
import ServiceRequestList from './pages/ServiceRequestList';
import ServiceRequestDetails from './pages/ServiceRequestDetails';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <ServiceRequestProvider>
            <Router>
              <Box
                sx={{
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}15)`,
                }}
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={
                      <PrivateRoute>
                        <Home />
                      </PrivateRoute>
                    } />
                    <Route
                      path="admin/dashboard"
                      element={
                        <PrivateRoute requireAdmin>
                          <AdminDashboard />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="requests"
                      element={
                        <PrivateRoute>
                          <ServiceRequestList />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="requests/new"
                      element={
                        <PrivateRoute>
                          <ServiceRequestForm />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="requests/:id"
                      element={
                        <PrivateRoute>
                          <ServiceRequestDetails />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="profile"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                  </Route>
                </Routes>
              </Box>
            </Router>
          </ServiceRequestProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
