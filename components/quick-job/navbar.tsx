'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, X, Sun, Moon, Sparkles, User, Settings, LogOut, ChevronDown, Briefcase, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '@/lib/supabase';
import { notificationsApi } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface User {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  profile_image_url?: string;
  profile_completed_min?: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  job_id?: string;
  is_read: boolean;
  created_at: string;
}

export function Navbar() {
  const { user, loading: authLoading, role, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
    }
  }, [user?.id]);

  const loadNotifications = async (userId: string) => {
    setNotificationsLoading(true);
    try {
      const data = await notificationsApi.list(userId);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'gradient', icon: Sparkles, label: 'Gradient' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <span className="font-bold text-lg">quick</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
              Home
            </Link>
            {user && role === 'worker' && (
              <Link href="/dashboard/worker" className="text-foreground/70 hover:text-foreground transition-colors">
                Find Jobs
              </Link>
            )}
            {user && role === 'recruiter' && (
              <>
                <Link href="/jobs/post" className="text-foreground/70 hover:text-foreground transition-colors">
                  Post Job
                </Link>
                <Link href="/dashboard/recruiter" className="text-foreground/70 hover:text-foreground transition-colors">
                  Find Workers
                </Link>
              </>
            )}
            {!user && (
              <>
                <Link href="/dashboard/worker" className="text-foreground/70 hover:text-foreground transition-colors">
                  Find Jobs
                </Link>
                <Link href="/dashboard/recruiter" className="text-foreground/70 hover:text-foreground transition-colors">
                  Post Job
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {mounted && (
              <div className="relative" ref={themeDropdownRef}>
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-all border border-transparent hover:border-border"
                >
                  {theme === 'gradient' ? (
                    <Sparkles size={18} className="text-neon-purple" />
                  ) : theme === 'dark' ? (
                    <Moon size={18} className="text-neon-blue" />
                  ) : (
                    <Sun size={18} className="text-neon-green" />
                  )}
                </button>
                
                <AnimatePresence>
                  {themeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-36 py-2 rounded-lg border border-border bg-background shadow-xl shadow-neon-blue/10"
                    >
                      <div className="px-3 py-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                        Theme
                      </div>
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value);
                              setThemeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-all ${
                              theme === option.value 
                                ? 'bg-neon-blue/10 text-neon-blue' 
                                : 'text-foreground'
                            }`}
                          >
                            <Icon size={16} />
                            {option.label}
                            {theme === option.value && (
                              <motion.div 
                                layoutId="themeCheck"
                                className="ml-auto w-2 h-2 rounded-full bg-neon-blue" 
                              />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {mounted && user && (
              <div className="relative" ref={notificationRef}>
                <button 
                  className="relative p-2 text-foreground/70 hover:text-foreground transition-colors"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <Bell size={20} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-neon-green rounded-full"></span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto py-2 rounded-lg border border-border bg-background shadow-xl shadow-neon-blue/10"
                    >
                      <div className="px-4 py-2 border-b border-border">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      
                      {notificationsLoading ? (
                        <div className="px-4 py-8 text-center text-foreground/60">
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-foreground/60">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.job_id ? `/jobs/${notification.job_id}` : '#'}
                              onClick={() => {
                                if (!notification.is_read) {
                                  handleMarkAsRead(notification.id);
                                }
                                setNotificationOpen(false);
                              }}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors ${
                                !notification.is_read ? 'bg-neon-blue/5' : ''
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                notification.type === 'new_job' 
                                  ? 'bg-neon-green/20 text-neon-green'
                                  : 'bg-neon-purple/20 text-neon-purple'
                              }`}>
                                {notification.type === 'new_job' ? (
                                  <Briefcase size={14} />
                                ) : (
                                  <MessageSquare size={14} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{notification.title}</p>
                                <p className="text-xs text-foreground/60 truncate">{notification.message}</p>
                              </div>
                              {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full bg-neon-blue mt-2"></div>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!authLoading && (
              user ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
                  >
                    {user.profile_image_url ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                        <img
                          src={user.profile_image_url}
                          alt={user.full_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neon-blue flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(user.full_name)}
                      </div>
                    )}
                    <ChevronDown size={14} className={`text-foreground/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 py-2 rounded-lg border border-border bg-background shadow-xl shadow-neon-blue/10"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="font-semibold text-sm truncate">{user.full_name || 'User'}</p>
                          <p className="text-xs text-foreground/60 truncate">{user.email}</p>
                        </div>
                        <div className="py-2">
                          <Link
                            href="/dashboard/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                          >
                            <User size={16} className="text-neon-blue" />
                            {user.profile_completed_min ? 'Edit Profile' : 'Complete Profile'}
                          </Link>
                          <Link
                            href="/dashboard/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                          >
                            <Settings size={16} className="text-neon-purple" />
                            Settings
                          </Link>
                        </div>
                        <div className="border-t border-border pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Button asChild className="bg-neon-blue hover:bg-neon-purple text-background">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              )
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            <Link href="/" className="block py-2 text-foreground/70 hover:text-foreground">
              Home
            </Link>
            {user && role === 'worker' && (
              <Link href="/dashboard/worker" className="block py-2 text-foreground/70 hover:text-foreground">
                Find Jobs
              </Link>
            )}
            {user && role === 'recruiter' && (
              <>
                <Link href="/jobs/post" className="block py-2 text-foreground/70 hover:text-foreground">
                  Post Job
                </Link>
                <Link href="/dashboard/recruiter" className="block py-2 text-foreground/70 hover:text-foreground">
                  Find Workers
                </Link>
              </>
            )}
            {!user && (
              <>
                <Link href="/dashboard/worker" className="block py-2 text-foreground/70 hover:text-foreground">
                  Find Jobs
                </Link>
                <Link href="/dashboard/recruiter" className="block py-2 text-foreground/70 hover:text-foreground">
                  Post Job
                </Link>
              </>
            )}
            {user && (
              <>
                <Link href="/dashboard/profile" className="block py-2 text-foreground/70 hover:text-foreground">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block py-2 text-red-500 w-full text-left"
                >
                  Logout
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}