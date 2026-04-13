'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/quick-job/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { useShowToast } from '@/components/quick-job/show-toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useShowToast();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    accountType: 'worker',
  });

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast("Database not connected. Please refresh.", "error");
        return;
      }
      localStorage.setItem('selectedRole', formData.accountType);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      });
      if (error) {
        showToast(error.message, "error");
        return;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast("Database not connected. Please refresh.", "error");
        return;
      }
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) {
          showToast(error.message, "error");
          return;
        }
        
        router.push('/auth/callback');
      } else {
        localStorage.setItem('selectedRole', formData.accountType);
        
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              role: formData.accountType,
            },
          },
        });
        
        if (error) {
          showToast(error.message, "error");
          return;
        }
        
        showToast("Account created! Check your email to confirm.", "success");
        router.push('/auth/callback');
      }
    } catch (error) {
      console.error('Auth error:', error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Static background accent */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/3 left-1/4 w-56 h-56 bg-neon-blue/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-neon-purple/5 rounded-full blur-2xl"></div>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h1>
              <p className="text-foreground/60">
                {isLogin
                  ? 'Sign in to your quick job marketplace account'
                  : 'Create an account to start earning or hiring'}
              </p>
            </div>

            {/* Google Login Button */}
            <Button
              variant="outline"
              className="w-full border-border hover:bg-card/80"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card/50 text-foreground/60">Or continue with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <Input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 bg-background/50 border-border"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-background/50 border-border"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 bg-background/50 border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">I am a...</label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  >
                    <option value="worker">Worker (Find Jobs)</option>
                    <option value="recruiter">Recruiter (Post Jobs)</option>
                  </select>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    Remember me
                  </label>
                  <Link href="#" className="text-sm text-neon-blue hover:text-neon-blue/80">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold h-11"
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center text-sm">
              <span className="text-foreground/60">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-neon-blue hover:text-neon-blue/80 font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            {/* Terms */}
            {!isLogin && (
              <p className="text-xs text-foreground/50 text-center">
                By signing up, you agree to our{' '}
                <Link href="#" className="text-neon-blue hover:text-neon-blue/80">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-neon-blue hover:text-neon-blue/80">
                  Privacy Policy
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
