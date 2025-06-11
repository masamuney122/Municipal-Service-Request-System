import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  const [kvkkDialogOpen, setKvkkDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    kvkkConsent: false,
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    kvkkConsent: '',
  });

  const validateForm = () => {
    let isValid = true;
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      kvkkConsent: '',
    };

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.trim())) {
      errors.phone = 'Invalid phone number format (minimum 10 digits)';
      isValid = false;
    }

    if (!formData.kvkkConsent) {
      errors.kvkkConsent = 'You must accept the KVKK terms to register';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (validateForm()) {
      try {
        const fullName = `${formData.firstName} ${formData.lastName}`;
        await register(
          fullName,
          formData.email,
          formData.password,
          formData.phone.trim(),
          formData.kvkkConsent
        );
        navigate('/');
      } catch (err) {
        // Error is handled by the AuthContext
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'kvkkConsent' ? checked : value
    }));
  };

  const kvkkText = `
    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kimliğinizi belirli veya belirlenebilir kılan her türlü bilginiz, özel nitelikli kişisel verileriniz de dahil olmak üzere, kişisel veri olarak değerlendirilmektedir.

    Bu kapsamda, belediye hizmetlerinden yararlanabilmeniz için gerekli olan kişisel verileriniz:
    - İsim, soyisim, e-posta, telefon numarası gibi kimlik ve iletişim bilgileriniz
    - Hizmet taleplerinizdeki adres ve konum bilgileriniz
    - Hizmet süreçlerindeki iletişim kayıtlarınız

    Yukarıdaki kişisel verileriniz:
    1. Belediye hizmetlerinin sunulması ve yönetilmesi
    2. Talep ve şikayetlerinizin değerlendirilmesi
    3. Yasal yükümlülüklerimizin yerine getirilmesi
    4. Hizmet kalitesinin iyileştirilmesi
    amaçlarıyla işlenecektir.

    Kişisel verileriniz, yukarıdaki amaçlar doğrultusunda, yalnızca yetkili belediye personeli ve yasal zorunluluk halinde yetkili kamu kurumlarıyla paylaşılacaktır.

    KVKK kapsamında:
    - Kişisel verilerinizin işlenip işlenmediğini öğrenme
    - İşlenen kişisel verileriniz hakkında bilgi talep etme
    - Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
    - Kişisel verilerinizin düzeltilmesini veya silinmesini talep etme
    haklarına sahipsiniz.

    Bu hakları kullanmak için belediyemize yazılı başvuruda bulunabilirsiniz.
  `;

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 1,
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Register
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  inputProps={{
                    style: { textTransform: 'none' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="kvkkConsent"
                      checked={formData.kvkkConsent}
                      onChange={handleChange}
                      color="primary"
                    />
                  }
                  label={
                    <Box component="span">
                      <Typography component="span">
                        I accept the{' '}
                        <Link
                          component="button"
                          type="button"
                          onClick={() => setKvkkDialogOpen(true)}
                        >
                          KVKK Terms
                        </Link>
                      </Typography>
                    </Box>
                  }
                />
                {formErrors.kvkkConsent && (
                  <Typography color="error" variant="caption" display="block">
                    {formErrors.kvkkConsent}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Register
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
            >
              Already have an account? Sign in
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={kvkkDialogOpen}
        onClose={() => setKvkkDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>KVKK Terms and Conditions</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            style={{ whiteSpace: 'pre-line' }}
          >
            {kvkkText}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKvkkDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
