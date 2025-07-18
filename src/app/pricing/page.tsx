'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Stack, 
  Card,
  CardContent,
  AppBar,
  Toolbar,
  alpha,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Check,
  Star,
  TrendingUp,
  Speed,
  Psychology,
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import Link from 'next/link';

export default function PricingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [isAnnual, setIsAnnual] = useState(false);
  const { createCheckoutSession, loading: checkoutLoading, error: checkoutError } = useStripeCheckout();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading Cultivate HQ...
        </Typography>
      </Box>
    );
  }

  const monthlyPrice = 30;
  const annualPrice = 300;
  const annualSavings = ((monthlyPrice * 12) - annualPrice) / (monthlyPrice * 12) * 100;

  const features = [
    'AI-powered contact intelligence',
    'Smart follow-up automation',
    'Relationship maintenance system',
    'Generosity-first networking tools',
    'Conversation intelligence',
    'Strategic networking roadmap',
    'Relationship analytics & insights',
    'Smart introduction engine',
    'Context preservation system',
    'Voice memo processing',
    'LinkedIn integration',
    'Gmail integration',
    'Google Calendar sync',
    'Unlimited contacts',
    'Priority support'
  ];

  const handleGetStarted = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const priceType = isAnnual ? 'yearly' : 'monthly';
    await createCheckoutSession(priceType);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'transparent',
          borderBottom: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: 600,
                letterSpacing: '-0.02em'
              }}
            >
              Cultivate HQ
            </Typography>
            
            <Stack direction="row" spacing={3} alignItems="center">
              <Typography
                component={Link}
                href="/features"
                variant="body1"
                sx={{
                  textDecoration: 'none',
                  color: 'text.secondary',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                Features
              </Typography>
              
              <Typography
                component={Link}
                href="/pricing"
                variant="body1"
                sx={{
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 500
                }}
              >
                Pricing
              </Typography>
              
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="medium"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderWidth: 1.5,
                  '&:hover': {
                    borderWidth: 1.5,
                  }
                }}
              >
                Sign In
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* Hero Section */}
        <Box 
          sx={{ 
            py: { xs: 8, md: 12 },
            background: `linear-gradient(135deg, ${alpha('#2196F3', 0.02)} 0%, ${alpha('#7C3AED', 0.02)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={6} alignItems="center" textAlign="center">
              {/* Error Alert */}
              {checkoutError && (
                <Alert severity="error" sx={{ borderRadius: 2, maxWidth: '600px' }}>
                  {checkoutError}
                </Alert>
              )}

              <Stack spacing={3} alignItems="center" maxWidth="800px">
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    color: 'text.primary'
                  }}
                >
                  Invest in your{' '}
                  <Typography
                    component="span"
                    variant="inherit"
                    sx={{ color: 'primary.main' }}
                  >
                    relationship capital
                  </Typography>
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.125rem', md: '1.25rem' },
                    fontWeight: 400,
                    color: 'text.secondary',
                    lineHeight: 1.4,
                    maxWidth: '600px'
                  }}
                >
                  Professional-grade relationship intelligence designed for executives who understand that strategic connections drive extraordinary outcomes.
                </Typography>
              </Stack>
              
              {/* Billing Toggle */}
              <Box 
                sx={{
                  p: 1,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isAnnual ? 'text.secondary' : 'text.primary',
                    fontWeight: 500
                  }}
                >
                  Monthly
                </Typography>
                <Switch
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'primary.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'primary.main',
                    },
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isAnnual ? 'text.primary' : 'text.secondary',
                      fontWeight: 500
                    }}
                  >
                    Annual
                  </Typography>
                  <Chip
                    label={`Save ${Math.round(annualSavings)}%`}
                    size="small"
                    sx={{
                      backgroundColor: alpha('#4CAF50', 0.1),
                      color: '#4CAF50',
                      fontWeight: 500
                    }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Container>
        </Box>

        {/* Pricing Card */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Card
                sx={{
                  maxWidth: 600,
                  width: '100%',
                  p: 4,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  position: 'relative',
                  backgroundColor: 'white'
                }}
              >
                {/* Popular Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 3,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Professional
                </Box>

                <CardContent sx={{ p: 0 }}>
                  <Stack spacing={4}>
                    {/* Pricing */}
                    <Box textAlign="center">
                      <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={1}>
                        <Typography
                          variant="h2"
                          sx={{
                            fontSize: { xs: '2.5rem', md: '3rem' },
                            fontWeight: 600,
                            color: 'primary.main'
                          }}
                        >
                          ${isAnnual ? annualPrice : monthlyPrice}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500
                          }}
                        >
                          /{isAnnual ? 'year' : 'month'}
                        </Typography>
                      </Stack>
                      
                      {isAnnual && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            mt: 1
                          }}
                        >
                          ${(annualPrice / 12).toFixed(0)}/month billed annually
                        </Typography>
                      )}
                      
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'text.secondary',
                          mt: 2,
                          fontSize: '1.125rem'
                        }}
                      >
                        Complete relationship intelligence system
                      </Typography>
                    </Box>

                    {/* CTA Button */}
                    <Button
                      onClick={handleGetStarted}
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={checkoutLoading}
                      startIcon={checkoutLoading ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{
                        py: 2,
                        fontSize: '1.125rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        transform: 'scale(1)',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: checkoutLoading ? 'scale(1)' : 'scale(1.02)',
                        }
                      }}
                    >
                      {checkoutLoading ? 'Processing...' : user ? 'Begin strategic analysis' : 'Sign in to get started'}
                    </Button>

                    {/* Features */}
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          textAlign: 'center'
                        }}
                      >
                        Everything you need to master relationships
                      </Typography>
                      
                      <List sx={{ py: 0 }}>
                        {features.map((feature, index) => (
                          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Check 
                                sx={{ 
                                  color: 'primary.main',
                                  fontSize: 20
                                }} 
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary={feature}
                              primaryTypographyProps={{
                                fontSize: '0.875rem',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {/* Value Proposition */}
                    <Paper
                      sx={{
                        p: 3,
                        backgroundColor: alpha('#2196F3', 0.02),
                        border: '1px solid',
                        borderColor: alpha('#2196F3', 0.1),
                        borderRadius: 2
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}
                      >
                        "The ROI of systematic relationship building far exceeds the cost of this investment. One strategic connection can transform your entire trajectory."
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Container>
        </Box>

        {/* Value Proposition */}
        <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Stack spacing={8}>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    mb: 3
                  }}
                >
                  Why executives choose Cultivate HQ
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.125rem',
                    color: 'text.secondary',
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Sophisticated professionals understand that relationship capital is the ultimate competitive advantage. This is your strategic advantage.
                </Typography>
              </Box>
              
              <Stack spacing={6}>
                {[
                  {
                    icon: <TrendingUp />,
                    title: 'Strategic ROI',
                    description: 'One strategic connection can generate opportunities worth thousands of times your investment.',
                    color: 'primary.main'
                  },
                  {
                    icon: <Speed />,
                    title: 'Executive Efficiency',
                    description: 'Systematic relationship building saves hours of cognitive overhead while improving outcomes.',
                    color: theme.palette.sage.main
                  },
                  {
                    icon: <Psychology />,
                    title: 'Professional Intelligence',
                    description: 'AI-powered insights that enhance your natural strategic instincts and executive presence.',
                    color: theme.palette.amber.main
                  },
                  {
                    icon: <AutoAwesome />,
                    title: 'Sustainable Scale',
                    description: 'Build relationship practices that work for 50+ meaningful connections without burnout.',
                    color: theme.palette.plum.main
                  }
                ].map((benefit, index) => (
                  <Card
                    key={index}
                    sx={{
                      p: 4,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 3,
                      backgroundColor: 'white'
                    }}
                  >
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          backgroundColor: alpha(benefit.color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: benefit.color,
                          flexShrink: 0
                        }}
                      >
                        {benefit.icon}
                      </Box>
                      
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, fontSize: '1.25rem', mb: 1 }}
                        >
                          {benefit.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '1rem' }}
                        >
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Final CTA */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box 
              sx={{
                textAlign: 'center',
                p: { xs: 4, md: 6 },
                backgroundColor: alpha('#2196F3', 0.02),
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#2196F3', 0.1)
              }}
            >
              <Stack spacing={4} alignItems="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Ready to transform your relationship building?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.125rem',
                    color: 'text.secondary',
                    maxWidth: '500px'
                  }}
                >
                  Join executives who've made systematic relationship building their competitive advantage.
                </Typography>
                <Button
                  onClick={handleGetStarted}
                  variant="contained"
                  size="large"
                  disabled={checkoutLoading}
                  startIcon={checkoutLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: 200
                  }}
                >
                  {checkoutLoading ? 'Processing...' : user ? 'Get started today' : 'Sign in to get started'}
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  No setup fees • Cancel anytime • Professional support
                </Typography>
              </Stack>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          mt: 'auto',
          py: 6,
          backgroundColor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={{ xs: 3, md: 6 }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', md: 'flex-start' }}
          >
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Cultivate HQ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                Where strategic minds cultivate extraordinary outcomes through systematic relationship intelligence.
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={4}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                  Product
                </Typography>
                <Typography
                  component={Link}
                  href="/features"
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                >
                  Features
                </Typography>
                <Typography
                  component={Link}
                  href="/pricing"
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                >
                  Pricing
                </Typography>
              </Stack>
              
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                  Support
                </Typography>
                <Typography
                  component={Link}
                  href="/login"
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                >
                  Sign In
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              © 2025 Cultivate HQ. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}