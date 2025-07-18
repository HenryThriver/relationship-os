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
            py: { xs: 10, md: 16 },
            background: `
              linear-gradient(135deg, 
                ${alpha('#2196F3', 0.06)} 0%, 
                ${alpha('#7C3AED', 0.04)} 35%, 
                ${alpha('#059669', 0.03)} 65%, 
                ${alpha('#F59E0B', 0.02)} 100%
              ),
              radial-gradient(circle at 20% 50%, ${alpha('#2196F3', 0.08)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha('#7C3AED', 0.06)} 0%, transparent 50%)
            `,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.8) 100%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={8} alignItems="center" textAlign="center">
              <Stack spacing={4} alignItems="center" maxWidth="900px">
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '3rem', md: '4rem', lg: '4.5rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                    color: 'text.primary',
                    textShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  Where strategic minds cultivate{' '}
                  <Typography
                    component="span"
                    variant="inherit"
                    sx={{ 
                      background: `linear-gradient(135deg, #2196F3 0%, #7C3AED 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '-8px',
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, #2196F3 0%, #7C3AED 100%)`,
                        borderRadius: '2px',
                        opacity: 0.3
                      }
                    }}
                  >
                    extraordinary outcomes
                  </Typography>
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: '1.25rem', md: '1.375rem' },
                    fontWeight: 400,
                    color: 'text.secondary',
                    lineHeight: 1.5,
                    maxWidth: '700px',
                    fontStyle: 'italic',
                    opacity: 0.9
                  }}
                >
                  Most relationship building feels like speed dating in business casual. Transform overwhelming chaos into systematic advantage with intelligence designed for executives who understand that relationships are the ultimate competitive edge.
                </Typography>
              </Stack>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={3} 
                alignItems="center"
                sx={{ mt: 2 }}
              >
                <Button
                  component={Link}
                  href="/pricing"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 240,
                    height: 56,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, #2196F3 0%, #1976D2 100%)`,
                    boxShadow: `0 4px 20px ${alpha('#2196F3', 0.3)}`,
                    transform: 'scale(1)',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.02) translateY(-1px)',
                      boxShadow: `0 8px 32px ${alpha('#2196F3', 0.4)}`,
                      background: `linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)`,
                    }
                  }}
                >
                  Begin strategic analysis
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: 180,
                    height: 56,
                    borderRadius: 2,
                    borderWidth: 2,
                    borderColor: alpha('#2196F3', 0.3),
                    color: 'text.primary',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: '#2196F3',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 20px ${alpha('#2196F3', 0.15)}`
                    }
                  }}
                >
                  Watch demo
                </Button>
              </Stack>
              
              <Box 
                sx={{
                  mt: 4,
                  p: 2,
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#2196F3', 0.1)}`,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    letterSpacing: '0.5px'
                  }}
                >
                  Professional • $30/month • No setup fees
                </Typography>
              </Box>
            </Stack>
          </Container>
        </Box>

        {/* Four Core Pillars */}
        <Box sx={{ py: { xs: 10, md: 16 }, position: 'relative' }}>
          <Container maxWidth="lg">
            <Stack spacing={10}>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2.25rem', md: '3rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    mb: 4,
                    background: 'linear-gradient(135deg, #212121 0%, #616161 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Four pillars of relationship excellence
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.25rem',
                    color: 'text.secondary',
                    maxWidth: '700px',
                    mx: 'auto',
                    fontStyle: 'italic',
                    opacity: 0.9
                  }}
                >
                  Most networking feels transactional because it <em>is</em> transactional. Transform relationship complexity into systematic capabilities that scale with your ambition—because authentic connection is the ultimate competitive advantage.
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                {[
                  {
                    icon: <TrendingUp sx={{ fontSize: 32 }} />,
                    title: 'Strategic Connection Architecture',
                    description: 'Identify and connect with the right people aligned to your goals. Move beyond random networking to purposeful relationship building.',
                    color: '#2196F3',
                    category: 'Strategy'
                  },
                  {
                    icon: <Psychology sx={{ fontSize: 32 }} />,
                    title: 'Proactive Relationship Nurturing',
                    description: 'Transform passive networking into active relationship tending. Never lose context or miss opportunities to add value.',
                    color: '#059669',
                    category: 'Intelligence'
                  },
                  {
                    icon: <AutoAwesome sx={{ fontSize: 32 }} />,
                    title: 'Strategic Ask Management',
                    description: 'Be clear about what to ask, of whom, and when. Optimize requests for maximum success while maintaining relationship capital.',
                    color: '#F59E0B',
                    category: 'Execution'
                  },
                  {
                    icon: <Speed sx={{ fontSize: 32 }} />,
                    title: 'Sustainable Systems Design',
                    description: 'Build relationship practices that scale without burnout. Create virtuous cycles that make relationship building intrinsically rewarding.',
                    color: '#7C3AED',
                    category: 'Systems'
                  }
                ].map((pillar, index) => (
                  <Grid size={{ xs: 12, md: 6 }} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        p: 4,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: 'white',
                        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: `linear-gradient(90deg, ${pillar.color} 0%, ${alpha(pillar.color, 0.6)} 100%)`,
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '&:hover': {
                          borderColor: pillar.color,
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 32px ${alpha(pillar.color, 0.15)}`,
                          '&::before': {
                            transform: 'scaleX(1)'
                          }
                        }
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Stack spacing={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2.5,
                                background: `linear-gradient(135deg, ${alpha(pillar.color, 0.1)} 0%, ${alpha(pillar.color, 0.05)} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: pillar.color,
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                border: `2px solid ${alpha(pillar.color, 0.2)}`
                              }}
                            >
                              {pillar.icon}
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ 
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: pillar.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                              }}
                            >
                              {pillar.category}
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '1.375rem',
                              lineHeight: 1.3,
                              letterSpacing: '-0.01em'
                            }}
                          >
                            {pillar.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ 
                              color: 'text.secondary', 
                              lineHeight: 1.65,
                              fontSize: '1rem'
                            }}
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
        <Box 
          sx={{ 
            py: { xs: 10, md: 16 }, 
            background: `
              linear-gradient(135deg, 
                ${alpha('#F5F5F5', 0.8)} 0%, 
                ${alpha('#FAFAFA', 0.9)} 100%
              ),
              radial-gradient(circle at 70% 30%, ${alpha('#2196F3', 0.03)} 0%, transparent 50%)
            `,
            position: 'relative'
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={10}>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2.25rem', md: '3rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    mb: 4,
                    background: 'linear-gradient(135deg, #212121 0%, #616161 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Intelligence that transforms relationships
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.25rem',
                    color: 'text.secondary',
                    maxWidth: '700px',
                    mx: 'auto',
                    fontStyle: 'italic',
                    opacity: 0.9
                  }}
                >
                  Sophisticated capabilities designed for executives who understand that relationships are the ultimate competitive advantage.
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                {[
                  {
                    icon: <ConnectWithoutContact sx={{ fontSize: 40 }} />,
                    title: 'AI-Powered Contact Intelligence',
                    description: 'Never forget names, faces, or important details again',
                    color: '#2196F3'
                  },
                  {
                    icon: <Insights sx={{ fontSize: 40 }} />,
                    title: 'Smart Follow-up Automation',
                    description: 'Personalized follow-up suggestions within 24 hours',
                    color: '#059669'
                  },
                  {
                    icon: <SmartToy sx={{ fontSize: 40 }} />,
                    title: 'Generosity-First Networking',
                    description: 'Lead with value, not requests',
                    color: '#7C3AED'
                  },
                  {
                    icon: <Campaign sx={{ fontSize: 40 }} />,
                    title: 'Smart Introduction Engine',
                    description: 'Facilitate valuable connections automatically',
                    color: '#F59E0B'
                  }
                ].map((feature, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 3,
                        backgroundColor: 'white',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: `linear-gradient(90deg, ${feature.color} 0%, ${alpha(feature.color, 0.6)} 100%)`,
                          transform: 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          boxShadow: `0 12px 32px ${alpha(feature.color, 0.15)}`,
                          borderColor: alpha(feature.color, 0.3),
                          '&::before': {
                            transform: 'scaleX(1)'
                          }
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 3,
                          background: `linear-gradient(135deg, ${alpha(feature.color, 0.1)} 0%, ${alpha(feature.color, 0.05)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: feature.color,
                          mb: 3,
                          mx: 'auto',
                          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                          border: `2px solid ${alpha(feature.color, 0.2)}`
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ 
                          fontWeight: 600, 
                          mb: 2, 
                          fontSize: '1.125rem',
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'text.secondary', 
                          fontSize: '0.95rem',
                          lineHeight: 1.6,
                          flexGrow: 1
                        }}
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
        <Box sx={{ py: { xs: 10, md: 16 } }}>
          <Container maxWidth="lg">
            <Box 
              sx={{
                textAlign: 'center',
                p: { xs: 6, md: 10 },
                background: `
                  linear-gradient(135deg, 
                    ${alpha('#2196F3', 0.06)} 0%, 
                    ${alpha('#7C3AED', 0.04)} 100%
                  ),
                  radial-gradient(circle at 50% 50%, ${alpha('#2196F3', 0.08)} 0%, transparent 70%)
                `,
                borderRadius: 4,
                border: '1px solid',
                borderColor: alpha('#2196F3', 0.15),
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.7) 100%)',
                  pointerEvents: 'none'
                }
              }}
            >
              <Stack spacing={6} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '2rem', md: '2.75rem' },
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #212121 0%, #616161 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  Ready to transform your relationship building?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.25rem',
                    color: 'text.secondary',
                    maxWidth: '600px',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                    opacity: 0.9
                  }}
                >
                  The best relationships aren&apos;t built at networking events—they&apos;re cultivated through genuine value exchange. Join executives who&apos;ve stopped networking and started relationship building.
                </Typography>
                <Button
                  component={Link}
                  href="/pricing"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2.5,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    minWidth: 250,
                    height: 64,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, #2196F3 0%, #1976D2 100%)`,
                    boxShadow: `0 8px 32px ${alpha('#2196F3', 0.3)}`,
                    transform: 'scale(1)',
                    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.05) translateY(-2px)',
                      boxShadow: `0 12px 48px ${alpha('#2196F3', 0.4)}`,
                      background: `linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)`,
                    }
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
