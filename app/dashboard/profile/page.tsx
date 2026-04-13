'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/quick-job/navbar';
import { SkillBadge } from '@/components/quick-job/skill-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Award, X, Upload, Loader2, Check, Clock, FileText, Camera, Sparkles, Navigation, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usersApi, jobsApi, applicationsApi } from '@/lib/api-client';
import { getSupabaseClient } from '@/lib/supabase';
import { useShowToast } from '@/components/quick-job/show-toast';

export default function ProfilePage() {
  const { showToast } = useShowToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Load profile from API
  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase?.auth.getUser();
        if (user) {
          // Get user by email instead of ID
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          
            if (userData) {
            console.log("Loaded from DB - userData:", userData);
            console.log("Loaded from DB - skills:", userData.skills);
            setFormData({
              name: userData.name || '',
              email: userData.email || user.email || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              skills: Array.isArray(userData.skills) ? userData.skills : [],
              isAvailable: userData.availability ?? true,
              role: userData.role || '',
              company: userData.company || '',
              experience: userData.experience || '',
              profile_completed_min: userData.profile_completed_min || false,
              latitude: userData.latitude || null,
              longitude: userData.longitude || null,
              profile_image_url: userData.profile_image_url || null,
            });
            // Set initial preview from DB image
            setPreviewImage(userData.profile_image_url || null);
            // Set resume from DB if exists
            if (userData.resume_url) {
              setResumeFile(userData.resume_url);
            }
            if (userData.role) {
              loadStats(userData.id, userData.role);
            } else {
              setStatsLoading(false);
            }
          } else {
            setFormData({
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              email: user.email || '',
              phone: '',
              bio: '',
              skills: [],
              isAvailable: true,
              role: '',
              company: '',
              experience: '',
              profile_completed_min: false,
              latitude: null,
              longitude: null,
            });
            setStatsLoading(false);
          }
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    }
    
    async function loadStats(userId: string, role: string) {
      try {
        if (role === 'worker') {
          // Fetch user data to get rating
          const supabase = getSupabaseClient();
          const { data: userData } = await supabase
            .from('users')
            .select('rating, total_reviews, completed_jobs, cancelled_jobs')
            .eq('id', userId)
            .single();
          
          // Fetch applications for this worker
          const applications = await applicationsApi.list({ worker_id: userId });
          const completedApps = applications.filter((a: any) => a.status === 'completed');
          const acceptedApps = applications.filter((a: any) => a.status === 'accepted');
          const rejectedApps = applications.filter((a: any) => a.status === 'rejected');
          
          // Calculate total earned from completed applications
          let totalEarned = 0;
          if (completedApps.length > 0) {
            const jobs = await jobsApi.list({});
            for (const app of completedApps) {
              const job = jobs.find((j: any) => j.id === app.job_id);
              if (job && job.pay) {
                totalEarned += job.pay;
              }
            }
          }
          
          // Calculate acceptance rate (accepted / total applied)
          const totalApplied = applications.length;
          const acceptanceRate = totalApplied > 0 
            ? Math.round(((acceptedApps.length + completedApps.length) / totalApplied) * 100) 
            : 0;
          
          setStats({
            jobsCompleted: userData?.completed_jobs || completedApps.length,
            averageRating: userData?.rating || 0,
            totalEarned: totalEarned,
            acceptanceRate: acceptanceRate,
            jobsPosted: 0,
            totalHired: 0,
            activeJobs: 0,
            hireRate: 0,
          });

          // Load applied jobs details
          try {
            const jobs = await jobsApi.list({});
            const appliedWithJobDetails = await Promise.all(
              applications.map(async (app: any) => {
                const jobDetails = jobs.find((j: any) => j.id === app.job_id);
                return {
                  ...app,
                  job: jobDetails || null,
                };
              })
            );
            setAppliedJobs(appliedWithJobDetails);
          } catch (e) {
            console.error('Error loading applied jobs:', e);
          } finally {
            setAppliedJobsLoading(false);
          }
        } else if (role === 'recruiter') {
          const jobs = await jobsApi.byEmployer(userId);
          const activeJobs = jobs.filter((j: any) => j.status === 'open');
          const closedJobs = jobs.filter((j: any) => j.status === 'closed');
          
          // Get all applications for all jobs
          let totalApplications = 0;
          let totalHired = 0;
          
          for (const job of jobs) {
            const apps = await applicationsApi.byJob(job.id);
            totalApplications += apps.length;
            const hired = apps.filter((a: any) => a.status === 'accepted' || a.status === 'completed');
            totalHired += hired.length;
          }
          
          // Calculate hire rate
          const hireRate = totalApplications > 0 
            ? Math.round((totalHired / totalApplications) * 100) 
            : 0;
          
          setStats({
            jobsCompleted: closedJobs.length,
            averageRating: 0,
            totalEarned: 0,
            acceptanceRate: 0,
            jobsPosted: jobs.length,
            totalHired: totalHired,
            activeJobs: activeJobs.length,
            hireRate: hireRate,
          });
          setStatsLoading(false);
        }
      } catch (e) {
        console.error('Error loading stats:', e);
        setStatsLoading(false);
      }
    }
    
    loadProfile();
  }, []);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    bio: string;
    skills: string[];
    isAvailable: boolean;
    role: string;
    company: string;
    experience: string;
    profile_completed_min: boolean;
    latitude: number | null;
    longitude: number | null;
    profile_image_url: string | null;
  }>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    skills: [],
    isAvailable: true,
    role: '',
    company: '',
    experience: '',
    profile_completed_min: false,
    latitude: null,
    longitude: null,
    profile_image_url: null,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const availableSkills = ['Cleaning', 'Delivery', 'Creative', 'Technical', 'Pet Care', 'Events', 'Teaching', 'Cooking'];
  
  const [stats, setStats] = useState({
    jobsCompleted: 0,
    averageRating: 0,
    totalEarned: 0,
    acceptanceRate: 0,
    jobsPosted: 0,
    totalHired: 0,
    activeJobs: 0,
    hireRate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "error");
        return;
      }
      setResumeFile(file.name);
      showToast("Resume uploaded successfully!", "success");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        showToast("Location detected!", "success");
      },
      (error) => {
        showToast("Could not get location", "error");
      }
    );
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Get current user
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast("Please refresh and sign in again", "error");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("Please sign in", "error");
        return;
      }

      // Update via API - use exact DB column names
      const updateProfileData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        profile_completed_min: true,
      };
      
      console.log("Saving profile with:", updateProfileData);
      console.log("User ID being used:", user.id);
      
      // Add skills only for worker
      if (formData.role === 'worker' && formData.skills.length > 0) {
        updateProfileData.skills = formData.skills;
        console.log("Adding skills:", formData.skills);
      }
      
      // Add role if selected
      if (formData.role) {
        updateProfileData.role = formData.role;
      }
      
      // Add company for recruiter
      if (formData.company) {
        updateProfileData.company = formData.company;
      }
      
      // Add experience for worker
      if (formData.experience) {
        updateProfileData.experience = formData.experience;
      }
      
      // Add location
      if (formData.latitude && formData.longitude) {
        updateProfileData.latitude = formData.latitude;
        updateProfileData.longitude = formData.longitude;
      }
      
      // Add profile image if uploaded (base64 data URL)
      if (previewImage && previewImage.startsWith('data:')) {
        updateProfileData.profile_image_url = previewImage;
      }
      
      // Add resume URL for worker
      if (formData.role === 'worker' && resumeFile) {
        updateProfileData.resume_url = resumeFile;
      }
      
      console.log("Final update data:", JSON.stringify(updateProfileData));
      
      // Use email to find the user in DB since that's how we loaded
      const result = await usersApi.update(user.email, updateProfileData);
      console.log("Update result:", result);

      showToast("Profile saved successfully!", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
      // Update local form data with profile_completed_min
      setFormData(prev => ({ ...prev, profile_completed_min: true, profile_image_url: previewImage }));
      
      // If profile completed, redirect after a short delay
      setTimeout(() => {
        if (formData.role === 'worker') {
          window.location.href = '/dashboard/worker';
        } else if (formData.role === 'recruiter') {
          window.location.href = '/dashboard/recruiter';
        }
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletion = () => {
    let score = 0;
    const items = [
      { done: !!previewImage },
      { done: !!formData.name },
      { done: !!formData.email },
      { done: !!formData.phone },
      { done: !!formData.bio },
      { done: formData.role === 'worker' && formData.skills.length > 0 },
    ];
    
    // Add resume for workers
    if (formData.role === 'worker') {
      items.push({ done: !!resumeFile });
    }
    
    const eachScore = 100 / items.length;
    items.forEach(item => {
      if (item.done) score += eachScore;
    });
    
    return Math.round(score);
  };
  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          {loading ? (
            <p className="text-foreground/60">Loading profile...</p>
          ) : (
          <>
            <h1 className="text-4xl font-bold mb-2">
              {formData.profile_completed_min ? 'Edit Profile' : 'Complete Your Profile'}
            </h1>
            <p className="text-foreground/60">
              {formData.profile_completed_min 
                ? 'Update your information and keep your profile fresh' 
                : 'Build your reputation and attract more opportunities'}
            </p>
          </>
          )}
        </div>

        {/* Completion Progress - Only show when not complete */}
        {completionPercentage < 100 && (
          <div className="mb-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-border"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={226.2}
                    strokeDashoffset={226.2 - (226.2 * completionPercentage) / 100}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-neon-green">{completionPercentage}%</span>
                </div>
              </div>
              
              {/* Progress Items */}
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-3 text-foreground/80">Complete Your Profile</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Profile Photo', done: !!previewImage },
                    { label: 'Full Name', done: !!formData.name },
                    { label: 'Email', done: !!formData.email },
                    { label: 'Phone Number', done: !!formData.phone },
                    { label: 'Bio', done: !!formData.bio },
                    { label: 'Skills', done: formData.role === 'worker' && formData.skills.length > 0 },
                    ...(formData.role === 'worker' ? [{ label: 'Resume', done: !!resumeFile }] : []),
                  ].filter(item => 
                    item.label !== 'Skills' || formData.role === 'worker'
                  ).map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        item.done 
                          ? 'bg-neon-green/10 text-neon-green' 
                          : 'bg-foreground/5 text-foreground/50'
                      }`}
                    >
                      {item.done ? (
                        <Check size={14} className="text-neon-green flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-foreground/30 flex-shrink-0" />
                      )}
                      <span className="text-xs truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User size={20} className="text-neon-blue" />
                  Basic Information
                </h2>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">I am a *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border text-foreground"
                  required
                >
                  <option value="">Select your role</option>
                  <option value="worker">Worker (Find Jobs)</option>
                  <option value="recruiter">Recruiter (Post Jobs)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                  <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <AnimatePresence mode="wait">
                        {previewImage ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon-blue/50 shadow-lg shadow-neon-blue/20 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }}
                          >
                            <img
                              src={previewImage}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="initial"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-blue via-neon-purple to-neon-blue flex items-center justify-center text-xl font-bold shadow-lg shadow-neon-blue/20 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }}
                          >
                            {formData.name ? formData.name.charAt(0) : '?'}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-blue flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={12} className="text-background" />
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-border"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload size={16} className="mr-2" />
                      {previewImage ? <><Check size={16} className="mr-2 text-neon-green" /> Done</> : 'Upload Photo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Navigation size={16} />
                  Location
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getLocation}
                    className="flex-1 border-neon-green/50 text-neon-green hover:bg-neon-green/10"
                  >
                    <Navigation size={16} className="mr-2" />
                    Use My Location
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-neon-green mt-2">
                    ✓ Location detected: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio / About You</label>
                <Textarea
                  name="bio"
                  placeholder="Tell us about yourself, your experience, and what makes you great..."
                  value={formData.bio}
                  onChange={handleChange}
                  className="min-h-24 bg-background/50 border-border"
                />
              </div>
            </div>

{/* Section 2: Skills (Only for Worker) */}
            <div className="space-y-6 pt-6 border-t border-border">
              {/* Company for Recruiter */}
              {formData.role === 'recruiter' && (
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Briefcase size={16} />
                    Company Name
                  </label>
                  <Input
                    name="company"
                    placeholder="Your company name or 'Individual'"
                    value={formData.company || ''}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                  />
                </div>
              )}

              {/* Skills - Only for Worker */}
              {formData.role === 'worker' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award size={20} className="text-neon-purple" />
                    Skills
                  </h2>

                  {/* Current Skills */}
                  {formData.skills.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground/60">Your skills</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <SkillBadge
                            key={skill}
                            skill={skill}
                            onRemove={() => removeSkill(skill)}
                            variant={formData.skills.indexOf(skill) % 3 === 0 ? 'primary' : formData.skills.indexOf(skill) % 3 === 1 ? 'secondary' : 'accent'}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Skills */}
                  <div className="space-y-3">
                    <p className="text-sm text-foreground/60">Add more skills</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSkills
                        .filter((skill) => !formData.skills.includes(skill))
                        .map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="px-4 py-2 rounded-lg border-2 border-dashed border-border hover:border-neon-blue/50 text-foreground/60 hover:text-neon-blue transition-colors text-sm"
                          >
                            + {skill}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Section 3: Availability Toggle - Only for Worker */}
            {formData.role === 'worker' && (
              <div className="space-y-6 pt-6 border-t border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock size={20} className="text-neon-green" />
                  Availability
                </h2>
                
                <motion.div 
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 relative overflow-hidden"
                  whileHover={{ borderColor: 'rgba(0, 200, 255, 0.3)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formData.isAvailable ? 'bg-neon-green/20 text-neon-green' : 'bg-foreground/10 text-foreground/40'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Clock size={24} />
                    </motion.div>
                    <div>
                      <p className="font-semibold">
                        {formData.isAvailable ? 'Available for work' : 'Not available'}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {formData.isAvailable 
                          ? 'Your profile is visible to employers' 
                          : 'You are hidden from job searches'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    className={`w-14 h-8 rounded-full transition-all relative overflow-hidden ${
                      formData.isAvailable ? 'bg-neon-green shadow-lg shadow-neon-green/30' : 'bg-foreground/20'
                    }`}
                  >
                    <motion.div
                      animate={{ x: formData.isAvailable ? 24 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                    />
                  </button>
                </motion.div>
              </div>
            )}

              {/* Section 4: Resume Upload - Only for Worker */}
              {formData.role === 'worker' && (
                <div className="space-y-6 pt-6 border-t border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText size={20} className="text-neon-purple" />
                    Resume & Documents
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center">
                        <FileText size={24} className="text-foreground/60" />
                      </div>
                      <div>
                        <p className="font-medium">{resumeFile || 'No resume uploaded'}</p>
                        <p className="text-sm text-foreground/60">PDF up to 5MB</p>
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={resumeInputRef}
                        onChange={handleResumeUpload}
                        accept=".pdf"
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="border-border"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resumeInputRef.current?.click();
                        }}
                      >
                        <Upload size={16} className="mr-2" />
                        {resumeFile ? <><Check size={16} className="mr-2 text-neon-green" /> Done</> : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* Section 5: Stats - Different for Worker vs Recruiter */}
            <div className="pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-card/50 p-4 text-center animate-pulse">
                      <div className="h-4 bg-foreground/10 rounded w-20 mx-auto mb-2"></div>
                      <div className="h-8 bg-foreground/10 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </>
              ) : formData.role === 'worker' ? (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Jobs Completed</p>
                    <p className="text-2xl font-bold text-neon-green">{stats.jobsCompleted}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Average Rating</p>
                    <p className="text-2xl font-bold text-neon-blue">{stats.averageRating > 0 ? `${stats.averageRating}★` : '-'}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-neon-purple">₹{stats.totalEarned.toLocaleString()}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-neon-green">{stats.acceptanceRate}%</p>
                  </motion.div>
                </>
              ) : formData.role === 'recruiter' ? (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Jobs Posted</p>
                    <p className="text-2xl font-bold text-neon-green">{stats.jobsPosted}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Total Hired</p>
                    <p className="text-2xl font-bold text-neon-blue">{stats.totalHired}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Active Jobs</p>
                    <p className="text-2xl font-bold text-neon-purple">{stats.activeJobs}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Hire Rate</p>
                    <p className="text-2xl font-bold text-neon-green">{stats.hireRate}%</p>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Jobs Completed</p>
                    <p className="text-2xl font-bold text-neon-green">-</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Average Rating</p>
                    <p className="text-2xl font-bold text-neon-blue">-</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-neon-purple">-</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-card/50 p-4 text-center"
                  >
                    <p className="text-xs text-foreground/60 mb-1">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-neon-green">-</p>
                  </motion.div>
                </>
              )}
            </div>

            {/* Applied Jobs Section - Only for Workers */}
            {formData.role === 'worker' && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-neon-blue" />
                  My Applied Jobs
                </h2>
                
                {appliedJobsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse border border-border"></div>
                    ))}
                  </div>
                ) : appliedJobs.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <p className="text-foreground/60">No applications yet</p>
                    <Link href="/dashboard/worker" className="text-neon-blue hover:underline mt-2 inline-block">
                      Find jobs →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appliedJobs.map((app) => (
                      <div key={app.id} className="rounded-xl border border-border bg-card/50 p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {app.job?.title || 'Job #' + app.job_id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-foreground/60">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'accepted' ? 'bg-neon-green/20 text-neon-green' :
                            app.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            app.status === 'completed' ? 'bg-neon-purple/20 text-neon-purple' :
                            'bg-neon-blue/20 text-neon-blue'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="pt-6 border-t border-border flex gap-4">
              <Button asChild variant="outline" className="flex-1 border-border">
                <Link href="/dashboard/worker">Cancel</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
