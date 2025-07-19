'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RelationshipSessionInterface } from '@/components/features/relationship-sessions';

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function SessionPage({ params }: SessionPageProps): React.JSX.Element {
  const router = useRouter();
  const [sessionId, setSessionId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setSessionId(p.sessionId));
  }, [params]);

  const handleCloseSession = () => {
    router.push('/dashboard');
  };

  if (!sessionId) {
    return <div>Loading...</div>;
  }

  return (
    <RelationshipSessionInterface
      sessionId={sessionId}
      onClose={handleCloseSession}
    />
  );
} 