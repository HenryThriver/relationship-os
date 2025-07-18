'use client';

import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import Link from 'next/link';

export default function TermsOfServicePage(): React.JSX.Element {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Terms of Service
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By accessing and using Relationship OS (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          2. Description of Service
        </Typography>
        <Typography variant="body1" paragraph>
          Relationship OS is a comprehensive relationship intelligence platform that helps users manage and nurture their professional and personal networks. The Service includes:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            AI-powered contact intelligence and relationship analysis
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Integration with third-party services including email, calendar, and social platforms
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Voice memo recording and processing capabilities
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Automated relationship maintenance and follow-up suggestions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Contact management and interaction tracking
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          3. User Accounts and Authentication
        </Typography>
        <Typography variant="body1" paragraph>
          To access the Service, you must create an account using third-party authentication services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Typography>
        <Typography variant="body1" paragraph>
          You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          4. Subscription and Payment Terms
        </Typography>
        <Typography variant="body1" paragraph>
          The Service is provided on a subscription basis. Payment processing is handled by authorized third-party payment processors. By subscribing, you agree to pay all applicable fees and taxes associated with your subscription.
        </Typography>
        <Typography variant="body1" paragraph>
          Subscription fees are non-refundable except as required by law. You may cancel your subscription at any time through your account settings.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          5. Data Usage and Processing
        </Typography>
        <Typography variant="body1" paragraph>
          By using the Service, you grant us permission to process your data as described in our Privacy Policy. This includes:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Processing your contact information and interaction data
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Using AI and machine learning services to analyze and enhance your data
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Integrating with external services as authorized by you
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Generating insights and suggestions based on your data
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          6. Acceptable Use Policy
        </Typography>
        <Typography variant="body1" paragraph>
          You agree not to use the Service for any unlawful purposes or in any way that could damage, disable, or impair the Service. Prohibited activities include:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Uploading or transmitting harmful, threatening, or inappropriate content
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Attempting to gain unauthorized access to the Service or other user accounts
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Using the Service to spam, harass, or abuse others
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Reverse engineering or attempting to extract source code
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          7. Intellectual Property Rights
        </Typography>
        <Typography variant="body1" paragraph>
          The Service and its original content, features, and functionality are owned by Relationship OS and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Typography>
        <Typography variant="body1" paragraph>
          You retain ownership of your data and content. AI-generated insights and suggestions are provided as part of the Service but remain subject to these Terms.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          8. Third-Party Integrations
        </Typography>
        <Typography variant="body1" paragraph>
          The Service may integrate with third-party platforms and services. We are not responsible for the content, policies, or practices of these third-party services. Your use of integrated services is subject to their respective terms of service and privacy policies.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          9. Service Availability and Modifications
        </Typography>
        <Typography variant="body1" paragraph>
          We strive to provide reliable service but cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          10. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          To the maximum extent permitted by law, Relationship OS shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the Service.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          11. Termination
        </Typography>
        <Typography variant="body1" paragraph>
          We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or the Service.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          12. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "last updated" date.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          13. Contact Information
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms of Service, please contact us at: legal@relationshipos.com
        </Typography>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
            ← Back to Dashboard
          </Typography>
        </Link>
      </Box>
    </Container>
  );
}