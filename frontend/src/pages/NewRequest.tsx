import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useServiceRequest } from '../contexts/ServiceRequestContext';

const categories = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Street Light' },
  { value: 'garbage', label: 'Garbage Collection' },
  { value: 'water', label: 'Water Supply' },
  { value: 'sewage', label: 'Sewage' },
  { value: 'other', label: 'Other' }
];

interface FormData {
  title: string;
  description: string;
  category: string;
  location: {
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
}

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { createRequest, loading, error } = useServiceRequest();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    location: {
      coordinates: [0, 0],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        if (parent === 'location') {
          if (child === 'coordinates') {
            return {
              ...prev,
              location: {
                ...prev.location,
                coordinates: JSON.parse(value)
              }
            };
          }
          return {
            ...prev,
            location: {
              ...prev.location,
              address: {
                ...prev.location.address,
                [child]: value
              }
            }
          };
        }
        return {
          ...prev,
          [parent]: value
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a plain object instead of FormData
    const requestData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: {
        coordinates: formData.location.coordinates,
        address: formData.location.address
      }
    };

    try {
      await createRequest(requestData as any);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating request:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        New Service Request
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={4}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            margin="normal"
          >
            {categories.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Location
          </Typography>

          <TextField
            fullWidth
            label="Street Address"
            name="location.address.street"
            value={formData.location.address.street}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="City"
            name="location.address.city"
            value={formData.location.address.city}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="State"
            name="location.address.state"
            value={formData.location.address.state}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="ZIP Code"
            name="location.address.zipCode"
            value={formData.location.address.zipCode}
            onChange={handleChange}
            required
            margin="normal"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              Submit Request
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default NewRequest; 