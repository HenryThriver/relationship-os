'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Stack, 
  Grid, 
  Paper,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  alpha,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  Psychology, 
  AutoAwesome, 
  Speed,
  ConnectWithoutContact,
  Insights,
  SmartToy,
  Campaign
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage(): React.JSX.Element {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

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
                  color: 'text.secondary',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main'
                  }
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
              
              <Button
                component={Link}
                href="/pricing"
                variant="contained"
                size="medium"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3
                }}
              >
                Get Started
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
              <Stack spacing={3} alignItems="center" maxWidth="800px">
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    color: 'text.primary'
                  }}
                >
                  Where strategic minds cultivate{' '}
                  <Typography
                    component="span"
                    variant="inherit"
                    sx={{ 
                      color: 'primary.main',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-4px',
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${alpha('#2196F3', 0.3)} 0%, ${alpha('#7C3AED', 0.3)} 100%)`,
                        borderRadius: '2px'
                      }
                    }}
                  >
                    extraordinary outcomes
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
                  Transform relationship building from overwhelming to systematic with the only relationship intelligence system designed for high-achievers.
                </Typography>
              </Stack>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                alignItems="center"
              >
                <Button
                  component={Link}
                  href="/pricing"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: 200,
                    transform: 'scale(1)',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    }
                  }}
                >
                  Begin strategic analysis
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderWidth: 1.5,
                    '&:hover': {
                      borderWidth: 1.5,
                    }
                  }}
                >
                  Watch demo
                </Button>
              </Stack>
              
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  mt: 2
                }}
              >
                Professional • $30/month • No setup fees
              </Typography>
            </Stack>
          </Container>
        </Box>

        {/* Four Core Pillars */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
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
                  Four pillars of relationship excellence
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
                  Transform the overwhelming complexity of relationship building into systematic capabilities that scale with your ambition.
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                {[
                  {
                    icon: <TrendingUp />,
                    title: 'Strategic Connection Architecture',
                    description: 'Identify and connect with the right people aligned to your goals. Move beyond random networking to purposeful relationship building.',
                    color: theme.palette.primary.main
                  },
                  {
                    icon: <Psychology />,
                    title: 'Proactive Relationship Nurturing',
                    description: 'Transform passive networking into active relationship tending. Never lose context or miss opportunities to add value.',
                    color: theme.palette.sage.main
                  },
                  {
                    icon: <AutoAwesome />,
                    title: 'Strategic Ask Management',
                    description: 'Be clear about what to ask, of whom, and when. Optimize requests for maximum success while maintaining relationship capital.',
                    color: theme.palette.amber.main
                  },
                  {
                    icon: <Speed />,
                    title: 'Sustainable Systems Design',
                    description: 'Build relationship practices that scale without burnout. Create virtuous cycles that make relationship building intrinsically rewarding.',
                    color: theme.palette.plum.main
                  }
                ].map((pillar, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        p: 3,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 3,
                        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: pillar.color,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${alpha(pillar.color, 0.1)}`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              backgroundColor: alpha(pillar.color, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: pillar.color
                            }}
                          >
                            {pillar.icon}
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, fontSize: '1.25rem' }}
                          >
                            {pillar.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', lineHeight: 1.6 }}
                          >
                            {pillar.description}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Box>

        {/* Key Features Preview */}
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
                  Intelligence that transforms relationships
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
                  Sophisticated capabilities designed for executives who understand that relationships are the ultimate competitive advantage.
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {[
                  {
                    icon: <ConnectWithoutContact />,
                    title: 'AI-Powered Contact Intelligence',
                    description: 'Never forget names, faces, or important details again'
                  },
                  {
                    icon: <Insights />,
                    title: 'Smart Follow-up Automation',
                    description: 'Personalized follow-up suggestions within 24 hours'
                  },
                  {
                    icon: <SmartToy />,
                    title: 'Generosity-First Networking',
                    description: 'Lead with value, not requests'
                  },
                  {
                    icon: <Campaign />,
                    title: 'Smart Introduction Engine',
                    description: 'Facilitate valuable connections automatically'
                  }
                ].map((feature, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2,
                        backgroundColor: 'white'
                      }}
                    >
                      <Box
                        sx={{
                          color: 'primary.main',
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
                      >
                        {feature.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Box>

        {/* CTA Section */}
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
                  Join high-achieving professionals who've made relationship building their competitive advantage.
                </Typography>
                <Button
                  component={Link}
                  href="/pricing"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: 200
                  }}
                >
                  Get started today
                </Button>
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
