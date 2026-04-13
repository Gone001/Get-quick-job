'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/quick-job/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Moon, 
  Sun, 
  Sparkles,
  Lock, 
  Mail, 
  Smartphone, 
  Trash2, 
  Loader2, 
  Check,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { useShowToast } from '@/components/quick-job/show-toast';

export default function SettingsPage() {
  const { showToast } = useShowToast();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
  });

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase?.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (data) {
          setUserData(data);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase?.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({
            email_notifications: notifications.emailNotifications,
            push_notifications: notifications.pushNotifications,
            job_alerts: notifications.jobAlerts,
            marketing_emails: notifications.marketingEmails,
          })
          .eq('id', user.id);
        
        showToast("Settings saved successfully!", "success");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    
    setChangingPassword(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase?.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Password changed successfully!", "success");
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      showToast("Failed to change password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase?.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast("Failed to delete account", "error");
    }
  };

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light', description: 'Clean light theme' },
    { value: 'dark', icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
    { value: 'gradient', icon: Sparkles, label: 'Gradient', description: 'Neon glow effect' },
  ];

  const notificationSettings = [
    { 
      id: 'email', 
      label: 'Email Notifications', 
      description: 'Receive updates via email',
      icon: Mail,
      enabled: notifications.emailNotifications,
      onChange: (val: boolean) => setNotifications(n => ({ ...n, emailNotifications: val })),
    },
    { 
      id: 'push', 
      label: 'Push Notifications', 
      description: 'Get instant alerts on your device',
      icon: Smartphone,
      enabled: notifications.pushNotifications,
      onChange: (val: boolean) => setNotifications(n => ({ ...n, pushNotifications: val })),
    },
    { 
      id: 'jobAlerts', 
      label: 'Job Alerts', 
      description: 'New jobs matching your skills',
      icon: Bell,
      enabled: notifications.jobAlerts,
      onChange: (val: boolean) => setNotifications(n => ({ ...n, jobAlerts: val })),
    },
    { 
      id: 'marketing', 
      label: 'Marketing Emails', 
      description: 'News, tips, and promotions',
      icon: Mail,
      enabled: notifications.marketingEmails,
      onChange: (val: boolean) => setNotifications(n => ({ ...n, marketingEmails: val })),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-foreground/60">Manage your account and preferences</p>
        </div>

        {loading ? (
          <p className="text-foreground/60">Loading...</p>
        ) : (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User size={20} className="text-neon-blue" />
                Profile Information
              </h2>
              
              <div className="flex items-center gap-6 mb-6">
                {userData?.profile_image_url ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neon-blue/50">
                    <img
                      src={userData.profile_image_url}
                      alt={userData.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue via-neon-purple to-neon-blue flex items-center justify-center text-2xl font-bold text-white">
                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <p className="font-medium">{userData?.name || 'User'}</p>
                  <p className="text-sm text-foreground/60">{userData?.role || 'Worker'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <Input
                      type="text"
                      value={userData?.name || ''}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      placeholder="Your name"
                      className="bg-background/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={userData?.email || ''}
                      disabled
                      className="bg-background/50 border-border opacity-60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      type="tel"
                      value={userData?.phone || ''}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="bg-background/50 border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                      <span className={`text-sm font-medium capitalize ${userData?.role === 'worker' ? 'text-neon-blue' : 'text-neon-purple'}`}>
                        {userData?.role || 'worker'}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const newRole = userData?.role === 'worker' ? 'recruiter' : 'worker';
                          try {
                            const supabase = getSupabaseClient();
                            const { data: { user } } = await supabase?.auth.getUser();
                            if (user) {
                              await supabase
                                .from('users')
                                .update({ role: newRole })
                                .eq('id', user.id);
                              setUserData({ ...userData, role: newRole });
                              showToast(`Switched to ${newRole} account`, "success");
                            }
                          } catch (e) {
                            showToast("Failed to switch role", "error");
                          }
                        }}
                        className="ml-auto text-xs text-foreground/60 hover:text-neon-blue underline"
                      >
                        Switch to {userData?.role === 'worker' ? 'Recruiter' : 'Worker'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Palette size={20} className="text-neon-blue" />
                Appearance
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      theme === option.value
                          ? 'border-neon-blue bg-neon-blue/10 shadow-lg shadow-neon-blue/20'
                          : 'border-border hover:border-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                      <Icon 
                        size={20} 
                        className={theme === option.value ? 'text-neon-blue' : 'text-foreground/60'} 
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-foreground/60">{option.description}</p>
                    {theme === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-neon-blue flex items-center justify-center"
                        >
                          <Check size={12} className="text-background" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell size={20} className="text-neon-purple" />
                Notifications
              </h2>
              
              <div className="space-y-4">
                {notificationSettings.map((setting) => {
                  const Icon = setting.icon;
                  return (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30 hover:border-neon-blue/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                          <Icon size={18} className="text-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium">{setting.label}</p>
                          <p className="text-sm text-foreground/60">{setting.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={setting.onChange}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Shield size={20} className="text-neon-green" />
                Security
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center">
                      <Lock size={18} className="text-neon-blue" />
                    </div>
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-foreground/60">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-border" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="p-4 rounded-xl border border-border bg-card/30 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-background/50 border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="bg-background/50 border-border"
                      />
                    </div>
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !newPassword || !confirmPassword}
                      className="bg-neon-blue hover:bg-neon-blue/90 text-background"
                    >
                      {changingPassword ? 'Changing...' : 'Update Password'}
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/30">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center">
                      <Key size={18} className="text-neon-purple" />
                    </div>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-foreground/60">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-border">
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-destructive">
                <Trash2 size={20} />
                Danger Zone
              </h2>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-background/50">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-foreground/60">Permanently remove your account and all data</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </motion.div>

            <div className="flex justify-end gap-4 pt-4">
              <Button asChild variant="outline" className="border-border">
                <Link href="/dashboard/profile">Cancel</Link>
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold min-w-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}