import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface SessionLayoutProps {
  children: React.ReactNode;
}

export default function SessionLayout({ children }: SessionLayoutProps): React.JSX.Element {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
} 