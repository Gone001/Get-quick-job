'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/quick-job/navbar';
import { ApplicantCard } from '@/components/quick-job/applicant-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { Plus, Search, Briefcase, Users, TrendingUp, Clock, Loader2, Sparkles, MapPin, CheckCircle, XCircle, UserX } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { jobsApi, applicationsApi } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { useShowToast } from '@/components/quick-job/show-toast';

interface PostedJob {
  id: string;
  title: string;
  category: string;
  description: string;
  pay_min: number;
  pay_max: number;
  urgent: boolean;
  applicants: number;
  posted: string;
  status: 'open' | 'closed' | string;
  created_at: string;
}

interface Applicant {
  id: string;
  name: string;
  skills: string[];
  distance: number;
  rating: number;
  email?: string;
  phone?: string;
  message?: string;
  job_id?: string;
  job_title?: string;
  status?: string;
  profile_image_url?: string;
  bio?: string;
  worker_id?: string;
}

const SAMPLE_POSTED_JOBS = [
  {
    id: '1',
    title: 'House Cleaning - 3 Hours',
    applicants: 12,
    posted: '2 hours ago',
    status: 'open',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Social Media Content Creator',
    applicants: 8,
    posted: '1 day ago',
    status: 'open',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Event Setup & Coordination',
    applicants: 5,
    posted: '3 days ago',
    status: 'filled',
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_APPLICANTS: Applicant[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    skills: ['Cleaning', 'Organization', 'Reliability'],
    distance: 2.3,
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Maria Garcia',
    skills: ['Event Planning', 'Leadership', 'Communication'],
    distance: 5.1,
    rating: 4.9,
  },
  {
    id: '3',
    name: 'Chris Lee',
    skills: ['Creative', 'Social Media', 'Design'],
    distance: 3.8,
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Sarah Martinez',
    skills: ['Cleaning', 'Quick Learner', 'Detail-Oriented'],
    distance: 1.5,
    rating: 5.0,
  },
];

export default function RecruiterDashboard() {
  const router = useRouter();
  const { showToast } = useShowToast();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<PostedJob | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    description: '',
    pay_min: 0,
    pay_max: 0,
    urgent: false
  });
  
  // View applicant dialog
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showApplicantDialog, setShowApplicantDialog] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<PostedJob | null>(null);

  const activeJobs = postedJobs.filter(j => j.status === 'open').length;
  const totalApplicants = applicants.length;
  const hiredThisMonth = applicants.filter(a => a.status === 'hired' || a.status === 'accepted').length || 0;

  const stats = [
    { label: 'Active Jobs', value: activeJobs.toString(), icon: Briefcase, color: 'neon-blue' },
    { label: 'Total Applicants', value: totalApplicants.toString(), icon: Users, color: 'neon-purple' },
    { label: 'Hired This Month', value: hiredThisMonth.toString(), icon: TrendingUp, color: 'neon-green' },
    { label: 'Avg. Filling Time', value: totalApplicants > 0 ? `${(totalApplicants / Math.max(hiredThisMonth, 1)).toFixed(1)}h` : '0h', icon: Clock, color: 'neon-blue' },
  ];

  const handleDeleteJob = async (jobId: string) => {
    try {
      await jobsApi.delete(jobId);
      showToast("Job deleted successfully", "success");
      fetchRecruiterData();
    } catch (e) {
      showToast("Failed to delete job", "error");
    }
  };

  const handleUpdateJob = async (jobId: string, newStatus: string) => {
    try {
      await jobsApi.update(jobId, { status: newStatus });
      showToast(newStatus === 'open' ? "Job reopened" : "Job closed", "success");
      fetchRecruiterData();
    } catch (e) {
      showToast("Failed to update job", "error");
    }
  };

  const openEditModal = (job: PostedJob) => {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      category: job.category || '',
      description: job.description || '',
      pay_min: job.pay_min || 0,
      pay_max: job.pay_max || 0,
      urgent: job.urgent || false
    });
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;
    try {
      await jobsApi.update(editingJob.id, {
        title: editForm.title,
        category: editForm.category,
        description: editForm.description,
        pay: editForm.pay_min,
        urgent: editForm.urgent,
      });
      showToast("Job updated successfully!", "success");
      setEditingJob(null);
      fetchRecruiterData();
    } catch (e) {
      showToast("Failed to update job", "error");
    }
  };


  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  const fetchRecruiterData = useCallback(async () => {
    try {
      setLoading(true);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setPostedJobs([]);
        setApplicants([]);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPostedJobs([]);
        setApplicants([]);
        return;
      }

      const { data: recruiterData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!recruiterData) {
        setPostedJobs([]);
        setApplicants([]);
        return;
      }

      // Use API instead
      const jobs = await jobsApi.byEmployer(recruiterData.id);
      
      // Get all applications to count applicants per job
      const allApps = await applicationsApi.list();
      const jobAppsMap: Record<string, number> = {};
      
      (allApps || []).forEach((app: any) => {
        if (app.job_id) {
          jobAppsMap[app.job_id] = (jobAppsMap[app.job_id] || 0) + 1;
        }
      });
      
      const mappedJobs = (jobs || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        category: job.category || '',
        description: job.description || '',
        pay_min: job.pay || 0,
        pay_max: job.pay_max || 0,
        urgent: job.urgent || false,
        applicants: jobAppsMap[job.id] || 0,
        posted: formatTimeAgo(job.created_at),
        status: job.status || 'open',
        created_at: job.created_at,
      }));
      setPostedJobs(mappedJobs);

      // Get all applications for employer's jobs
      const jobIds = mappedJobs.map(j => j.id);
      if (jobIds.length > 0) {
        try {
          const filteredApps = (allApps || []).filter((app: any) => jobIds.includes(app.job_id));

          const mappedApps = await Promise.all(filteredApps.map(async (app: any) => {
            let name = 'Unknown Applicant';
            let skills: string[] = [];
            let phone = '';
            let message = '';
            let profile_image_url = '';
            let bio = '';
            let email = '';
            let rating = 0;
            
            try {
              const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${app.worker_id}`, {
                headers: {
                  "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                  "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                },
              });
              const users = await userRes.json();
              if (users && users.length > 0) {
                name = users[0].name || users[0].email?.split('@')[0] || 'Unknown';
                skills = users[0].skills || [];
                phone = users[0].phone || '';
                profile_image_url = users[0].profile_image_url || '';
                bio = users[0].bio || '';
                email = users[0].email || '';
                rating = users[0].rating || 0;
              }
            } catch { }

            message = app.message || '';

            // Get worker_id from application
            const workerId = app.worker_id;

            return {
              id: app.id,
              name,
              skills,
              phone,
              email,
              message,
              profile_image_url,
              bio,
              distance: 0,
              rating: rating,
              status: app.status || 'pending',
              job_id: app.job_id,
              worker_id: workerId,
            };
          }));

          setApplicants(mappedApps);
        } catch {
          setApplicants([]);
        }
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error('Error fetching recruiter data:', error);
      setPostedJobs([]);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecruiterData();
  }, [fetchRecruiterData]);



  const handleHire = async (applicant: Applicant) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast("Database not connected", "error");
        return;
      }
      if (applicant.job_id) {
        const { error } = await supabase
          .from('applications')
          .update({ status: 'accepted' })
          .eq('id', applicant.id);
        
        if (error) {
          console.error("Supabase error:", error);
          showToast("Failed to hire: " + error.message, "error");
          return;
        }

        // Get job details to find the worker's application
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title, employer_id')
          .eq('id', applicant.job_id)
          .single();

        // Create notification for the worker
        if (jobData && applicant.email) {
          // First get the worker's user ID from their email
          const { data: workerUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', applicant.email)
            .single();
          
          if (workerUser) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: workerUser.id,
                type: 'application_accepted',
                title: '🎉 You have been hired!',
                message: `Congratulations! You have been hired for the job "${jobData.title}". The employer will contact you soon.`,
                job_id: applicant.job_id,
                is_read: false,
              });
            
            if (notifError) {
              console.error("Notification error:", notifError);
            }
          }
        }
      }
      
      // Update local state to reflect hired status
      setApplicants(prev => prev.map(app => 
        app.id === applicant.id ? { ...app, status: 'accepted' } : app
      ));
      
      // Close dialog
      setShowApplicantDialog(false);
      
      showToast(`Hired ${applicant.name}!`, "success");
    } catch (error) {
      console.error('Error hiring applicant:', error);
      showToast("Failed to hire applicant", "error");
    }
  };

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/auth/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('profile_completed_min, name, role')
        .eq('id', user.id)
        .single();

      if (!userData || !userData.name) {
        setProfileComplete(false);
        return;
      }
      
      if (!userData.profile_completed_min) {
        setProfileComplete(false);
        return;
      }
      
      // Check if user has recruiter role
      if (userData.role && userData.role !== 'recruiter') {
        showToast("You have a Worker account. Please switch to Recruiter role in Settings.", "error");
        router.push('/dashboard/worker');
        return;
      }
      
      setProfileComplete(true);
    };

    checkProfile();
  }, [router, showToast]);

  const filteredApplicants = applicants.filter((applicant) => {
    // If a specific job is selected, filter by that job
    if (selectedJobForApplicants) {
      return applicant.job_id === selectedJobForApplicants.id;
    }
    // Otherwise show all
    const matchesSearch = applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (profileComplete === null || profileComplete === false) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          {profileComplete === null ? (
            <div className="text-lg">Loading...</div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Complete Your Profile First</h2>
              <p className="text-foreground/60 mb-6">You need to complete your profile to post jobs</p>
              <Button onClick={() => router.push('/dashboard/profile')}>Complete Profile</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Your Jobs</h1>
            <p className="text-foreground/60">Post, track, and hire talent</p>
          </div>
          <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
            <Link href="/jobs/post">
              <Plus size={20} className="mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 animate-pulse">
                <div className="h-8 bg-foreground/10 rounded w-20 mb-2"></div>
                <div className="h-4 bg-foreground/10 rounded w-16"></div>
              </div>
            ))
          ) : (
            stats.map((stat) => {
              const Icon = stat.icon;
              const colorMap = {
                'neon-blue': 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
                'neon-purple': 'bg-neon-purple/10 text-neon-purple border-neon-purple/30',
                'neon-green': 'bg-neon-green/10 text-neon-green border-neon-green/30',
              };

              return (
                <div
                  key={stat.label}
                  className={`rounded-xl border ${colorMap[stat.color as keyof typeof colorMap]} bg-card/50 backdrop-blur-sm p-6`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground/60 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <Icon size={24} className="opacity-40" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'jobs'
              ? 'text-neon-blue border-neon-blue'
              : 'text-foreground/60 border-transparent hover:text-foreground'
              }`}
          >
            Your Jobs
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'applicants'
              ? 'text-neon-blue border-neon-blue'
              : 'text-foreground/60 border-transparent hover:text-foreground'
              }`}
          >
            Recent Applicants
          </button>
        </div>

        {/* Content */}
        {activeTab === 'jobs' ? (
          loading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-6 animate-pulse">
                  <div className="h-6 bg-foreground/10 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-foreground/10 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : postedJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/5 mb-4">
                <Briefcase className="w-8 h-8 text-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Jobs Posted Yet</h3>
              <p className="text-foreground/60 mb-4">Post your first job to start receiving applications</p>
              <Link href="/jobs/post">
                <Button>Post a Job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {postedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-6 hover:border-neon-blue/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                        {job.urgent && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">Urgent</span>
                        )}
                      </div>
                      {job.category && (
                        <span className="text-xs text-neon-blue mb-2 inline-block">{job.category.toUpperCase()}</span>
                      )}
                      <div className="flex items-center gap-4 text-sm text-foreground/60">
                        {job.pay_min > 0 && (
                          <span className="text-neon-green font-medium">
                            ₹{job.pay_min}{job.pay_max > job.pay_min ? `-₹${job.pay_max}` : ''}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForApplicants(job);
                              setActiveTab('applicants');
                            }}
                            className="hover:text-neon-blue underline underline-offset-2"
                          >
                            {job.applicants}
                          </button>
                        </span>
                        <span>{job.posted}</span>
                        <Badge
                          className={
                            job.status === 'open'
                              ? 'bg-neon-green/20 text-neon-green hover:bg-neon-green/30'
                              : 'bg-foreground/10 text-foreground/60 hover:bg-foreground/20'
                          }
                        >
                          {job.status === 'open' ? 'Open' : 'Cancelled'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={() => openEditModal(job)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={() => handleUpdateJob(job.id, job.status === 'open' ? 'cancelled' : 'open')}
                      >
                        {job.status === 'open' ? 'Cancel' : 'Open'}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Applicant Preview - Show top 3 applicants */}
                  {job.applicants > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-foreground/50 uppercase tracking-wider mb-3">Recent Applicants</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {filteredApplicants.slice(0, 3).map((applicant, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-32 p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                                {applicant.name.charAt(0)}
                              </div>
                              <span className="text-xs font-medium truncate">{applicant.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-foreground/50">
                              <MapPin size={10} />
                              {applicant.distance}km
                            </div>
                          </div>
                        ))}
                        {job.applicants > 3 && (
                          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg border border-dashed border-border text-foreground/40 text-xs">
                            +{job.applicants - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Selected Job Filter */}
            {selectedJobForApplicants && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-blue/10 border border-neon-blue/30">
                <span className="text-sm text-neon-blue font-medium">
                  Showing applicants for: <span className="font-bold">{selectedJobForApplicants.title}</span>
                </span>
                <button 
                  onClick={() => setSelectedJobForApplicants(null)}
                  className="ml-auto text-foreground/60 hover:text-foreground"
                >
                  <XCircle size={18} />
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search applicants by name or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-card/50 border-border"
              />
            </div>

            {/* Applicants Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 animate-pulse">
                    <div className="h-6 bg-foreground/10 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-foreground/10 rounded w-full mb-2"></div>
                    <div className="h-4 bg-foreground/10 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/5 mb-4">
                  <UserX className="w-8 h-8 text-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                <p className="text-foreground/60">When workers apply to your jobs, they'll appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApplicants.map((applicant) => (
                  <div 
                    key={applicant.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedApplicant(applicant);
                      setShowApplicantDialog(true);
                    }}
                  >
                    <ApplicantCard
                      name={applicant.name}
                      skills={applicant.skills}
                      distance={applicant.distance}
                      rating={applicant.rating}
                      status={applicant.status}
                      onHire={() => handleHire(applicant)}
                      onView={() => {
                        setSelectedApplicant(applicant);
                        setShowApplicantDialog(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAB */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
          className="fixed bottom-8 right-8 z-40"
        >
          <Link href="/jobs/post">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-neon-blue hover:bg-neon-blue/90 text-background shadow-lg shadow-neon-blue/30 hover:shadow-neon-blue/50 transition-all"
            >
              <Sparkles size={24} />
            </Button>
          </Link>
        </motion.div>
      </main>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-foreground/70 mb-1 block">Job Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="e.g. House Cleaning"
              />
            </div>
            <div>
              <label className="text-sm text-foreground/70 mb-1 block">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground"
              >
                <option value="">Select Category</option>
                <option value="cleaning">Cleaning</option>
                <option value="delivery">Delivery</option>
                <option value="moving">Moving</option>
                <option value="handyman">Handyman</option>
                <option value="cooking">Cooking</option>
                <option value="pet care">Pet Care</option>
                <option value="tutoring">Tutoring</option>
                <option value="events">Events</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground/70 mb-1 block">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe the job requirements..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">Min Pay (₹)</label>
                <Input
                  type="number"
                  value={editForm.pay_min}
                  onChange={(e) => setEditForm({ ...editForm, pay_min: parseInt(e.target.value) || 0 })}
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="text-sm text-foreground/70 mb-1 block">Max Pay (₹)</label>
                <Input
                  type="number"
                  value={editForm.pay_max}
                  onChange={(e) => setEditForm({ ...editForm, pay_max: parseInt(e.target.value) || 0 })}
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="urgent"
                checked={editForm.urgent}
                onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="urgent" className="text-sm text-foreground/70">Mark as Urgent</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Applicant Dialog */}
      <Dialog open={showApplicantDialog} onOpenChange={setShowApplicantDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplicant && (
            <div className="space-y-4 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                {selectedApplicant.profile_image_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon-blue/50">
                    <img 
                      src={selectedApplicant.profile_image_url} 
                      alt={selectedApplicant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-blue via-neon-purple to-neon-blue flex items-center justify-center text-2xl font-bold text-white">
                    {selectedApplicant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedApplicant.name}</h3>
                  <p className="text-sm text-foreground/60">Rating: {selectedApplicant.rating}/5</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-card/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-foreground/70">Contact Information</h4>
                <p className="text-sm"><span className="font-medium">Email:</span> {selectedApplicant.email || 'Not provided'}</p>
                <p className="text-sm"><span className="font-medium">Phone:</span> {selectedApplicant.phone || 'Not provided'}</p>
              </div>

              {/* Skills */}
              {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground/70">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-neon-blue/10 text-neon-blue text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedApplicant.bio && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground/70">About</h4>
                  <p className="text-sm text-foreground/80">{selectedApplicant.bio}</p>
                </div>
              )}

              {/* Application Message */}
              {selectedApplicant.message && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground/70">Application Message</h4>
                  <p className="text-sm text-foreground/80 bg-card/50 p-3 rounded-lg">{selectedApplicant.message}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplicantDialog(false)}>
              Close
            </Button>
            {selectedApplicant && selectedApplicant.status !== 'hired' && selectedApplicant.status !== 'accepted' && (
              <Button 
                onClick={() => {
                  handleHire(selectedApplicant);
                  setShowApplicantDialog(false);
                }}
                className="bg-neon-green hover:bg-neon-green/90"
              >
                Hire This Candidate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
