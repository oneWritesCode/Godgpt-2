import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client'; // Use Better Auth's built-in hook

export function useAuth() {
  // Use Better Auth's built-in session management
  const { data: session, isPending: isLoading, error } = useSession();

  const login = async (provider: 'google' | 'github') => {
    try {
      console.log(`Logging in with ${provider}`);
      await authClient.signIn.social({
        provider,
        callbackURL: '/chat',
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
    error,
  };
}