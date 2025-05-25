'use client';

import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function ContactsPage(): React.JSX.Element {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Contacts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your relationship network
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
        >
          Add Contact
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom>
            No contacts yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Start building your relationship network by adding your first contact
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            size="large"
          >
            Add Your First Contact
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 