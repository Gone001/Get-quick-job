'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.error('Supabase not initialized');
          setStatus('error');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }

        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (getUserError || !user) {
          throw getUserError || new Error('No user found');
        }

        // Just get user - don't check existing (they might already exist)
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (!existingUser) {
          const selectedRole = localStorage.getItem('selectedRole') || 'worker';
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,  // Use auth user ID
              email: user.email,
              role: selectedRole,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            });

          if (insertError && insertError.code !== '23505') {
            console.error('Error inserting user:', insertError);
          }
        }

        localStorage.removeItem('selectedRole');
        setStatus('success');

        const userRole = existingUser?.role || localStorage.getItem('selectedRole') || 'worker';
        
        setTimeout(() => {
          if (userRole === 'recruiter') {
            router.push('/dashboard/recruiter');
          } else {
            router.push('/dashboard/worker');
          }
        }, 500);

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lg">Completing sign in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg">Sign in successful! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg">Sign in failed. Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
