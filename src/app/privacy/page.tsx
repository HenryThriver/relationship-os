'use client';

import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import Link from 'next/link';

export default function PrivacyPolicyPage(): React.JSX.Element {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Privacy Policy
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
          1. Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          Relationship OS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our relationship intelligence platform.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          2. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect information you provide directly to us and information we obtain from your use of our services:
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          2.1 Personal Information
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Account information (name, email address, profile information)
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Contact information you add to your relationship network
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Communication records and interaction history
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Voice recordings and audio content you create
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          2.2 Third-Party Data
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Email data from integrated email services
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Calendar information from calendar services
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Social media profile information and interactions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Professional networking data
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          2.3 Usage Information
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Device information and technical data
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Usage patterns and feature interactions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Log files and system activity
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          3. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use your information to provide, maintain, and improve our services:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Deliver relationship intelligence and insights
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Process and analyze your data using AI and machine learning services
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Generate personalized recommendations and suggestions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Facilitate connections and communication management
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Provide customer support and respond to inquiries
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Process payments and manage subscriptions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Improve our services and develop new features
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          4. AI Processing and Machine Learning
        </Typography>
        <Typography variant="body1" paragraph>
          We use AI and machine learning services to analyze your data and provide intelligent insights. This processing may include:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Natural language processing of your communications and notes
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Pattern recognition in your relationship interactions
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Automated categorization and tagging of contacts and activities
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Predictive analysis for relationship maintenance recommendations
          </Typography>
        </Box>
        <Typography variant="body1" paragraph>
          AI processing is performed by trusted third-party AI service providers who are contractually bound to protect your data and use it only for providing services to us.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          5. Information Sharing and Disclosure
        </Typography>
        <Typography variant="body1" paragraph>
          We do not sell, trade, or otherwise transfer your personal information to outside parties except as described in this policy:
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          5.1 Service Providers
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your information with authorized third-party service providers who assist us in operating our platform, including:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            AI and machine learning service providers
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Cloud infrastructure and hosting providers
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Payment processing services
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Authentication and security services
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          5.2 Legal Requirements
        </Typography>
        <Typography variant="body1" paragraph>
          We may disclose your information when required by law, regulation, or legal process, or when necessary to protect the rights, property, or safety of our users or others.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          6. Third-Party Integrations
        </Typography>
        <Typography variant="body1" paragraph>
          Our service integrates with various third-party platforms. When you connect these services, you grant us permission to access and use your data from these platforms as necessary to provide our services. These integrations are subject to the privacy policies of the respective third-party providers.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          7. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Encryption of data in transit and at rest
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Access controls and authentication mechanisms
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Regular security assessments and monitoring
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Secure data processing and storage practices
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          8. Data Retention
        </Typography>
        <Typography variant="body1" paragraph>
          We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your data at any time, subject to certain legal and operational requirements.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          9. Your Rights and Choices
        </Typography>
        <Typography variant="body1" paragraph>
          You have several rights regarding your personal information:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body1" paragraph>
            Access and review your personal information
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Correct or update inaccurate information
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Delete your account and personal information
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Export your data in a portable format
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Withdraw consent for data processing where applicable
          </Typography>
          <Typography component="li" variant="body1" paragraph>
            Object to certain types of data processing
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          10. International Data Transfers
        </Typography>
        <Typography variant="body1" paragraph>
          Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          11. Cookies and Tracking Technologies
        </Typography>
        <Typography variant="body1" paragraph>
          We use cookies and similar tracking technologies to collect information about your use of our services. You can control cookie preferences through your browser settings.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          12. Children&apos;s Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          Our services are not designed for or directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          13. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;last updated&quot; date.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          14. Contact Information
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </Typography>
        <Typography variant="body1" paragraph>
          Email: privacy@relationshipos.com
        </Typography>
        <Typography variant="body1" paragraph>
          For data protection inquiries, you may also contact our Data Protection Officer at: dpo@relationshipos.com
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