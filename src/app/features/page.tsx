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
  Chip,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Psychology,
  AutoAwesome,
  TrendingUp,
  Campaign,
  ConnectWithoutContact,
  Insights,
  SmartToy,
  Speed,
  PersonSearch,
  Analytics,
  GroupAdd,
  Archive
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CULTIVATE_FEATURES } from '@/config/cultivateFeatures';
import Link from 'next/link';

const categoryIcons = {
  intelligence: Psychology,
  automation: AutoAwesome,
  strategy: TrendingUp,
  communication: Campaign
};


const featureIcons = {
  contact_intelligence: ConnectWithoutContact,
  follow_up_automation: Insights,
  relationship_maintenance: Speed,
  generosity_first_networking: SmartToy,
  conversation_intelligence: Campaign,
  personal_brand_discovery: PersonSearch,
  strategic_networking_roadmap: TrendingUp,
  relationship_analytics: Analytics,
  smart_introductions: GroupAdd,
  context_preservation: Archive
};

export default function FeaturesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const categoryColors = {
    intelligence: theme.palette.primary.main,
    automation: theme.palette.sage.main,
    strategy: theme.palette.amber.main,
    communication: theme.palette.plum.main
  };

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

  // Group features by category
  const featuresByCategory = CULTIVATE_FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof CULTIVATE_FEATURES>);

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
                  color: 'primary.main',
                  fontWeight: 500
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
                    fontSize: { xs: '2.5rem', md: '3rem' },
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    color: 'text.primary'
                  }}
                >
                  Sophisticated capabilities for{' '}
                  <Typography
                    component="span"
                    variant="inherit"
                    sx={{ color: 'primary.main' }}
                  >
                    relationship mastery
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
                  Designed for executives who understand that relationships are the ultimate competitive advantage. Each feature is crafted to enhance your natural strategic instincts.
                </Typography>
              </Stack>
              
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
                Start strategic analysis
              </Button>
            </Stack>
          </Container>
        </Box>

        {/* Features by Category */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Stack spacing={12}>
              {Object.entries(featuresByCategory).map(([category, features], categoryIndex) => {
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
                const categoryColor = categoryColors[category as keyof typeof categoryColors];
                
                return (
                  <Box key={category}>
                    {/* Category Header */}
                    <Stack spacing={4} alignItems="center" textAlign="center" sx={{ mb: 8 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          backgroundColor: alpha(categoryColor, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: categoryColor
                        }}
                      >
                        <CategoryIcon sx={{ fontSize: 32 }} />
                      </Box>
                      
                      <Typography
                        variant="h2"
                        sx={{
                          fontSize: { xs: '1.75rem', md: '2.25rem' },
                          fontWeight: 600,
                          letterSpacing: '-0.02em',
                          textTransform: 'capitalize'
                        }}
                      >
                        {category} Features
                      </Typography>
                      
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: '1.125rem',
                          color: 'text.secondary',
                          maxWidth: '600px'
                        }}
                      >
                        {category === 'intelligence' && 'AI-powered insights that reveal hidden patterns and opportunities in your relationship network.'}
                        {category === 'automation' && 'Sophisticated automation that handles routine tasks while preserving authentic connection.'}
                        {category === 'strategy' && 'Strategic frameworks that transform relationship building into competitive advantage.'}
                        {category === 'communication' && 'Advanced communication tools that elevate every interaction to its highest potential.'}
                      </Typography>
                    </Stack>
                    
                    {/* Features Grid */}
                    <Grid container spacing={4}>
                      {features.map((feature, index) => {
                        const FeatureIcon = featureIcons[feature.key as keyof typeof featureIcons] || ConnectWithoutContact;
                        
                        return (
                          <Grid item xs={12} md={6} key={feature.key}>
                            <Card
                              sx={{
                                height: '100%',
                                p: 4,
                                border: '1px solid',
                                borderColor: 'grey.200',
                                borderRadius: 3,
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  borderColor: categoryColor,
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 8px 24px ${alpha(categoryColor, 0.1)}`
                                }
                              }}
                            >
                              <CardContent sx={{ p: 0 }}>
                                <Stack spacing={3}>
                                  <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box
                                      sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        backgroundColor: alpha(categoryColor, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: categoryColor,
                                        flexShrink: 0
                                      }}
                                    >
                                      <FeatureIcon />
                                    </Box>
                                    
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography
                                        variant="h6"
                                        sx={{ 
                                          fontWeight: 600, 
                                          fontSize: '1.25rem',
                                          mb: 1
                                        }}
                                      >
                                        {feature.title}
                                      </Typography>
                                      
                                      <Chip
                                        label={category}
                                        size="small"
                                        sx={{
                                          textTransform: 'capitalize',
                                          backgroundColor: alpha(categoryColor, 0.1),
                                          color: categoryColor,
                                          fontWeight: 500
                                        }}
                                      />
                                    </Box>
                                  </Stack>
                                  
                                  <Typography
                                    variant="body2"
                                    sx={{ 
                                      color: 'text.secondary', 
                                      lineHeight: 1.6,
                                      fontSize: '1rem'
                                    }}
                                  >
                                    {feature.description}
                                  </Typography>
                                  
                                  {/* Relevant Use Cases */}
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ 
                                        color: 'text.secondary',
                                        fontWeight: 500,
                                        mb: 1,
                                        display: 'block'
                                      }}
                                    >
                                      Relevant for:
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                      {feature.relevantFor.slice(0, 3).map((use, useIndex) => (
                                        <Chip
                                          key={useIndex}
                                          label={use}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            fontSize: '0.75rem',
                                            height: 24,
                                            borderColor: 'grey.300',
                                            color: 'text.secondary'
                                          }}
                                        />
                                      ))}
                                    </Stack>
                                  </Box>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Box 
              sx={{
                textAlign: 'center',
                p: { xs: 4, md: 6 },
                backgroundColor: 'white',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200'
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
                  Experience the power of systematic relationship intelligence designed for strategic minds.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
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
                  <Button
                    component={Link}
                    href="/"
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
                    Learn more
                  </Button>
                </Stack>
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