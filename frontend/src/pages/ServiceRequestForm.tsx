import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  Fade,
  Zoom,
  Slide,
  Card,
  CardContent,
  useTheme,
  Autocomplete,
} from '@mui/material';
import {
  Title as TitleIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { motion } from 'framer-motion';
import { LatLngLiteral } from 'leaflet'; // Leaflet tipi
import LocationPicker from '../components/LocationPicker'; // Leaflet bileşeni
import { useServiceRequest } from '../contexts/ServiceRequestContext';
import axios from 'axios';
import debounce from 'lodash/debounce';

const MotionPaper = motion(Paper);
const steps = ['Basic Information', 'Location Details', 'Review & Submit'];

const ServiceRequestForm: React.FC = () => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const theme = useTheme();
  const navigate = useNavigate();
  const { createRequest } = useServiceRequest();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: {
      coordinates: [0, 0],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [selectedLocation, setSelectedLocation] = useState<LatLngLiteral | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        handleSubmit(new Event('submit') as any);
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields before submission
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);

      const location = formData.location.address.street
        ? {
            coordinates: selectedLocation
              ? [selectedLocation.lng, selectedLocation.lat]
              : [0, 0],
            address: {
              street: formData.location.address.street.trim(),
              city: formData.location.address.city.trim(),
              state: formData.location.address.state.trim(),
              zipCode: formData.location.address.zipCode.trim(),
            },
          }
        : null;

      if (location) {
        formDataToSend.append('location', JSON.stringify({
            type: 'Point',
            coordinates: location.coordinates,
            address: location.address,
          })
        );
        formDataToSend.append('location[address][street]', location.address.street);
        formDataToSend.append('location[address][city]', location.address.city);
        formDataToSend.append('location[address][state]', location.address.state);
        formDataToSend.append('location[address][zipCode]', location.address.zipCode);
      }

      attachments.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      await createRequest(formDataToSend);
      setSubmitStatus({
        type: 'success',
        message: 'Your request has been successfully submitted!'
      });
      
      // Wait for 2 seconds to show the success message before redirecting
      setTimeout(() => {
        navigate('/requests');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating request:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create service request. Please try again.'
      });
      setErrors({
        submit: error.response?.data?.message || 'Failed to create service request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    switch (activeStep) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 1:
        // Location is optional, no validation needed
        break;
      case 2:
        // Review step, validate all required fields again
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Debounced function to fetch address suggestions
  const debouncedFetchAddress = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 3) {
        setAddressSuggestions([]);
        return;
      }

      setIsLoadingAddress(true);
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=tr&bounded=1&viewbox=25.0,42.0,45.0,37.0`,
          {
            headers: {
              'Accept-Language': 'tr',
              'User-Agent': 'MunicipalityApp/1.0'
            }
          }
        );
        
        setAddressSuggestions(response.data.map((item: any) => ({
          display: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: {
            street: item.address.road || item.address.pedestrian || item.address.path || '',
            city: item.address.city || item.address.town || item.address.village || item.address.county || '',
            state: item.address.state || item.address.province || '',
            zipCode: item.address.postcode || '',
          }
        })));
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressSuggestions([]);
      } finally {
        setIsLoadingAddress(false);
      }
    }, 500),
    []
  );

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedFetchAddress.cancel();
    };
  }, [debouncedFetchAddress]);

  // Handle location selection from map
  const handleLocationSelect = (location: LatLngLiteral, address?: any) => {
    setSelectedLocation(location);
    if (address) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: [location.lng, location.lat],
          address: {
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || '',
          }
        }
      }));
    }
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (option: any) => {
    if (option) {
      setSelectedLocation({ lat: option.lat, lng: option.lon });
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: [option.lon, option.lat],
          address: {
            ...option.address,
            state: option.address.state || ''
          }
        }
      }));
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}15)`,
                  borderRadius: 1,
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Request Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please provide the basic information about your service request. This will help us understand and process your request efficiently.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={!!errors.title}
                  helperText={errors.title}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={!!errors.description}
                  helperText={errors.description}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                    startAdornment={
                      <InputAdornment position="start">
                        <CategoryIcon color="primary" />
                      </InputAdornment>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        },
                      },
                    }}
                  >
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                    <MenuItem value="repair">Repair</MenuItem>
                    <MenuItem value="installation">Installation</MenuItem>
                    <MenuItem value="inspection">Inspection</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {errors.category && (
                    <Typography color="error" variant="caption">
                      {errors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label">
                  Upload Attachments
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments(Array.from(e.target.files));
                      }
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {attachments.length} file(s) selected
                </Typography>
              </Grid>
            </Grid>
          </Fade>
        );
      case 1:
        return (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}15)`,
                  borderRadius: 1 ,
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Location Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a location on the map or enter an address. You can also search for an address to get suggestions.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={addressSuggestions}
                  getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.display
                  }
                  loading={isLoadingAddress}
                  onInputChange={(_, value) => {
                    debouncedFetchAddress(value);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string') {
                      handleAddressSelect(value);
                    }
                  }}
                  filterOptions={(x) => x}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.address.street}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.address.city}, {option.address.state} {option.address.zipCode}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Address"
                      fullWidth
                      placeholder="Enter street name, neighborhood, or district"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <LocationPicker 
                  onLocationSelect={handleLocationSelect} 
                  center={selectedLocation || undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Street"
                  value={formData.location.address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: { ...prev.location.address, street: e.target.value }
                    }
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.location.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: { ...prev.location.address, city: e.target.value }
                    }
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={formData.location.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: { ...prev.location.address, state: e.target.value }
                    }
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  value={formData.location.address.zipCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: { ...prev.location.address, zipCode: e.target.value }
                    }
                  }))}
                />
              </Grid>
            </Grid>
          </Fade>
        );
      case 2:
        return (
          <Zoom in timeout={500}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={0} sx={{ 
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}15)`,
                  borderRadius: 1,
                  mb: 3
                }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Review Your Request
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please review all the information before submitting your service request.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TitleIcon sx={{ mr: 1 }} />
                        Basic Information
                      </Typography>
                      <Card elevation={0} sx={{ 
                        background: theme.palette.background.default,
                        p: 2,
                        borderRadius: 1,
                        mb: 2
                      }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Title:</strong> {formData.title}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          <strong>Category:</strong> {formData.category}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Description:</strong> {formData.description}
                        </Typography>
                      </Card>
                    </Grid>
                    {formData.location.address.street && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <LocationIcon sx={{ mr: 1 }} />
                          Location Details
                        </Typography>
                        <Card elevation={0} sx={{ 
                          background: theme.palette.background.default,
                          p: 2,
                          borderRadius: 1
                        }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Address:</strong> {formData.location.address.street}
                          </Typography>
                          <Typography variant="body1">
                            {formData.location.address.city}, {formData.location.address.state}{' '}
                            {formData.location.address.zipCode}
                          </Typography>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Zoom>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        {/* Notification Alert */}
        {submitStatus.type && (
          <Fade in={Boolean(submitStatus.type)}>
            <Alert 
              severity={submitStatus.type}
              sx={{ 
                mb: 2,
                boxShadow: 1,
                '& .MuiAlert-message': {
                  flex: 1
                }
              }}
              action={
                submitStatus.type === 'error' && (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Retrying...' : 'Retry'}
                  </Button>
                )
              }
            >
              {submitStatus.message}
            </Alert>
          </Fade>
        )}

        <MotionPaper
          elevation={0}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 4 }}>
            Submit New Service Request
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box component="form" onSubmit={handleSubmit}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
              {activeStep !== 0 && (
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                endIcon={activeStep === steps.length - 1 ? <SendIcon /> : <ArrowForwardIcon />}
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : activeStep === steps.length - 1 
                    ? 'Submit Request' 
                    : 'Next'}
              </Button>
            </Box>
          </Box>
        </MotionPaper>
      </Box>
    </Container>
  );
};

export default ServiceRequestForm; 