'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ThemeRegistry from '@/components/theme/ThemeRegistry'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ToastProvider } from '@/lib/contexts/ToastContext'

interface AppProvidersProps {
  children: React.ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ThemeRegistry>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeRegistry>
  )
} 