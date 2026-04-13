'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useShowToast } from '@/components/quick-job/show-toast';

export function useRoleValidator(allowedRoles: ('worker' | 'recruiter')[]) {
  const router = useRouter();
  const { showToast } = useShowToast();
  const [isValidating, setIsValidating] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function validateRole() {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          // Not logged in, redirect to login
          router.push('/auth/login');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Get user role from database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();

        const role = userData?.role || null;
        setUserRole(role);

        if (!role) {
          // No role set, prompt to complete profile
          showToast("Please complete your profile first to continue", "error");
          router.push('/dashboard/profile');
          return;
        }

        if (!allowedRoles.includes(role as 'worker' | 'recruiter')) {
          // Role not allowed for this page
          if (role === 'worker') {
            showToast("You have a Worker account. Create a Recruiter account to post jobs.", "error");
            router.push('/dashboard/worker');
          } else if (role === 'recruiter') {
            showToast("You have a Recruiter account. Create a Worker account to find jobs.", "error");
            router.push('/dashboard/recruiter');
          }
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error('Role validation error:', error);
        router.push('/auth/login');
      }
    }

    validateRole();
  }, [router, showToast, allowedRoles]);

  return { isValidating, userRole };
}