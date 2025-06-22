'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert, Chip, Divider } from '@mui/material';
import { Refresh, Psychology, SmartToy } from '@mui/icons-material';

interface VoiceMemo {
  id: string;
  transcription_status: string;
  ai_parsing_status: string;
  contact_info: {
    is_self_contact: boolean;
    name: string;
  } | null;
  is_onboarding: boolean;
  memo_type: string;
  has_transcription: boolean;
  transcription_preview: string | null;
  created_at: string;
}

interface VoiceMemoStatus {
  voice_memos: VoiceMemo[];
  summary: {
    total: number;
    onboarding_memos: number;
    self_contact_memos: number;
    completed_ai: number;
    pending_ai: number;
  };
}

export default function VoiceMemoTestPage() {
  const [status, setStatus] = useState<VoiceMemoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/voice-memo-status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const reprocessOnboardingMemo = async (artifactId: string) => {
    setProcessing(artifactId);
    setError(null);
    try {
      const response = await fetch('/api/debug/voice-memo-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reprocess_onboarding_ai',
          artifact_id: artifactId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reprocess');
      }

      const result = await response.json();
      console.log('Reprocessing result:', result);
      
      // Refresh status after a short delay
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Voice Memo Processing Test
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={fetchStatus}
          disabled={loading}
        >
          Refresh Status
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {status && (
        <>
          {/* Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Total: ${status.summary.total}`} />
                <Chip label={`Onboarding: ${status.summary.onboarding_memos}`} color="primary" />
                <Chip label={`Self-Contact: ${status.summary.self_contact_memos}`} color="secondary" />
                <Chip label={`AI Complete: ${status.summary.completed_ai}`} color="success" />
                <Chip label={`AI Pending: ${status.summary.pending_ai}`} color="warning" />
              </Box>
            </CardContent>
          </Card>

          {/* Voice Memos List */}
          <Typography variant="h6" gutterBottom>
            Voice Memos
          </Typography>
          
          {status.voice_memos.map((memo) => (
            <Card key={memo.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {memo.contact_info?.name || 'Unknown Contact'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      {memo.is_onboarding && <Chip size="small" label="Onboarding" color="primary" />}
                      {memo.contact_info?.is_self_contact && <Chip size="small" label="Self-Contact" color="secondary" />}
                      <Chip size="small" label={memo.memo_type} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        size="small" 
                        label={`Transcription: ${memo.transcription_status}`}
                        color={memo.transcription_status === 'completed' ? 'success' : memo.transcription_status === 'failed' ? 'error' : 'default'}
                      />
                      <Chip 
                        size="small" 
                        label={`AI: ${memo.ai_parsing_status}`}
                        color={memo.ai_parsing_status === 'completed' ? 'success' : memo.ai_parsing_status === 'failed' ? 'error' : 'default'}
                      />
                    </Box>
                  </Box>
                  
                  {memo.is_onboarding && memo.has_transcription && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SmartToy />}
                      onClick={() => reprocessOnboardingMemo(memo.id)}
                      disabled={processing === memo.id}
                    >
                      {processing === memo.id ? 'Processing...' : 'Reprocess with Onboarding AI'}
                    </Button>
                  )}
                </Box>

                {memo.transcription_preview && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Transcription Preview:</strong> {memo.transcription_preview}
                    </Typography>
                  </>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Created: {new Date(memo.created_at).toLocaleString()} | ID: {memo.id}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {loading && (
        <Typography>Loading...</Typography>
      )}
    </Box>
  );
} 