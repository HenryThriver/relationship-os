'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ThemeRegistry from '@/components/theme/ThemeRegistry';
import { AuthProvider } from '@/lib/contexts/AuthContext';
// import { SessionContextProvider } from '@supabase/auth-helpers-react'; // Removing this
import { supabase } from '@/lib/supabase/client'; 

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const supabaseClient = supabase; // This is the shared client instance

  return (
    <ThemeRegistry>
      {/* <SessionContextProvider supabaseClient={supabaseClient}> */}
        <AuthProvider> {/* AuthProvider already uses the supabase client from /lib/supabase/client */}
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AuthProvider>
      {/* </SessionContextProvider> */}
    </ThemeRegistry>
  );
} 