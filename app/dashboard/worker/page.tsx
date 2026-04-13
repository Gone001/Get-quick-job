'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/quick-job/navbar';
import { JobCard } from '@/components/quick-job/job-card';
import { DistanceFilter } from '@/components/quick-job/distance-filter';
import { SkillBadge } from '@/components/quick-job/skill-badge';
import { SkeletonJobCard } from '@/components/quick-job/skeleton-job-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, X, AlertCircle, MapPin, SlidersHorizontal, DollarSign, Phone } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useShowToast } from '@/components/quick-job/show-toast';
import { jobsApi, applicationsApi } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  id: string;
  title: string;
  company: string;
  pay_min: number;
  pay_max: number;
  distance: number;
  location: string;
  tags: string[];
  is_urgent: boolean;
  description?: string;
  isApplied?: boolean;
}

const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    title: 'House Cleaning - 3 Hours',
    company: 'Sarah M.',
    pay_min: 45,
    pay_max: 75,
    distance: 2.3,
    location: 'Downtown',
    tags: ['Cleaning', 'Same Day'],
    is_urgent: true,
  },
  {
    id: '2',
    title: 'Package Delivery - Morning Shift',
    company: 'Quick Logistics',
    pay_min: 25,
    pay_max: 40,
    distance: 5.1,
    location: 'North Bay',
    tags: ['Delivery', 'Full Day'],
    is_urgent: false,
  },
  {
    id: '3',
    title: 'Social Media Content Creator',
    company: 'Creative Agency',
    pay_min: 50,
    pay_max: 150,
    distance: 8.2,
    location: 'Central',
    tags: ['Creative', 'Remote'],
    is_urgent: false,
  },
  {
    id: '4',
    title: 'Handyman - Plumbing Repair',
    company: 'John D.',
    pay_min: 60,
    pay_max: 100,
    distance: 3.5,
    location: 'Suburbs',
    tags: ['Plumbing', 'Technical'],
    is_urgent: true,
  },
  {
    id: '5',
    title: 'Dog Walking & Pet Care',
    company: 'Pet Lovers Co.',
    pay_min: 20,
    pay_max: 35,
    distance: 1.8,
    location: 'Downtown',
    tags: ['Pet Care', 'Flexible'],
    is_urgent: false,
  },
  {
    id: '6',
    title: 'Event Setup & Coordination',
    company: 'Event Masters',
    pay_min: 40,
    pay_max: 80,
    distance: 12.5,
    location: 'Exhibition',
    tags: ['Events', 'Weekend'],
    is_urgent: false,
  },
];

export default function WorkerDashboard() {
  const router = useRouter();
  const { showToast } = useShowToast();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [distance, setDistance] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  
  // Apply dialog state
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyPhone, setApplyPhone] = useState('');
  const [applyExpectedPrice, setApplyExpectedPrice] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const availableSkills = ['Cleaning', 'Delivery', 'Creative', 'Technical', 'Pet Care', 'Events'];

  // Load saved skills and location from localStorage on mount
  useEffect(() => {
    const savedSkills = localStorage.getItem('worker_skills');
    if (savedSkills) {
      setSelectedSkills(JSON.parse(savedSkills));
    }
    
    const savedLocation = localStorage.getItem('worker_location');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation);
      setUserLocation(loc);
    }
  }, []);

  // Save skills to localStorage when changed
  useEffect(() => {
    localStorage.setItem('worker_skills', JSON.stringify(selectedSkills));
  }, [selectedSkills]);

  // Save location to localStorage when changed
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('worker_location', JSON.stringify(userLocation));
    }
  }, [userLocation]);

  // Get current location from browser
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        setLocationLoading(false);
        showToast('Location updated! Jobs near you will be shown.', 'success');
      },
      (error) => {
        setLocationLoading(false);
        setLocationError('Could not get your location. Please check permissions.');
        showToast('Could not get location', 'error');
      }
    );
  };

  // Check profile and role on mount
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
      
      // Check if user has worker role
      if (userData.role && userData.role !== 'worker') {
        showToast("You have a Recruiter account. Please switch to Worker role in Settings.", "error");
        router.push('/dashboard/recruiter');
        return;
      }
      
      setProfileComplete(true);
      
      // Get user's applied jobs
      try {
        const applications = await applicationsApi.list({ worker_id: user.id });
        const appliedIds = new Set(applications.map((a: any) => a.job_id));
        setAppliedJobIds(appliedIds);
      } catch (e) {
        console.error('Error fetching applications:', e);
      }
    };
    
    checkProfile();
  }, [router, showToast]);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      
      const jobs = await jobsApi.list({ status: 'open' });
      
      // Calculate distance using Haversine formula if user location is available
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      const mappedJobs: Job[] = (jobs || []).map((job: any) => {
        let distance = 0;
        if (userLocation && job.latitude && job.longitude) {
          distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            job.latitude, 
            job.longitude
          );
        }
        
        return {
          id: job.id,
          title: job.title,
          company: 'Company',
          pay_min: job.pay || 0,
          pay_max: job.pay_max || job.pay || 0,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          location: job.city || job.address || job.category || 'Unknown',
          tags: job.category ? [job.category] : [],
          is_urgent: job.urgent || false,
          description: job.description || '',
        };
      });
      
      setJobs(mappedJobs.length > 0 ? mappedJobs : SAMPLE_JOBS);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs(SAMPLE_JOBS);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApplyClick = (job: Job) => {
    // Check if already applied
    if (job.isApplied || appliedJobIds.has(job.id)) {
      showToast("You have already applied for this job", "error");
      return;
    }
    console.log('handleApplyClick called for job:', job.id, job.title);
    setSelectedJob(job);
    setShowApplyDialog(true);
    setApplyPhone('');
    setApplyExpectedPrice('');
    setApplyMessage('');
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    
    try {
      setSubmitting(true);
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        showToast("Please refresh the page and sign in again", "error");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showToast("Please sign in to apply for jobs", "error");
        return;
      }

      const { data: workerData } = await supabase
        .from('users')
        .select('id, phone')
        .eq('id', user.id)
        .single();

      if (!workerData) {
        showToast("Worker profile not found", "error");
        setSubmitting(false);
        return;
      }

      // Use API to apply with message
      await applicationsApi.create({
        job_id: selectedJob.id,
        worker_id: workerData.id,
        message: applyMessage || `Phone: ${applyPhone || workerData.phone || 'N/A'}, Expected: ${applyExpectedPrice || 'Negotiable'}`,
      });

      setAppliedJobIds(prev => new Set(prev).add(selectedJob.id));
      setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, isApplied: true } : j));
      showToast("Application submitted successfully!", "success");
      setShowApplyDialog(false);
    } catch (error: any) {
      console.error('Error applying for job:', error);
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('already applied')) {
        // Mark as applied locally too
        setAppliedJobIds(prev => new Set(prev).add(selectedJob.id));
        setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, isApplied: true } : j));
        showToast("You have already applied for this job", "error");
      } else if (errorMsg.includes('profile')) {
        showToast("Please complete your profile first", "error");
      } else {
        showToast(error.message || "Failed to apply. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.some((skill) => job.tags.includes(skill));
    const matchesDistance = job.distance <= distance;

    return matchesSearch && matchesSkills && matchesDistance;
  });

  const hasActiveFilters = searchQuery || selectedSkills.length > 0 || distance < 50;

  if (profileComplete === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (profileComplete === false) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile First</h2>
          <p className="text-foreground/60 mb-6">You need to complete your profile before viewing jobs</p>
          <Button onClick={() => router.push('/dashboard/profile')}>Complete Profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Find Your Next Job</h1>
              <p className="text-foreground/60">
                {loading ? 'Loading...' : `${filteredJobs.length} available opportunities near you`}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card/50 border border-border text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className={`border-border ${userLocation ? 'border-neon-green bg-neon-green/10 text-neon-green' : ''}`}
            >
              {locationLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Getting location...
                </span>
              ) : userLocation ? (
                <>
                  <MapPin size={18} className="mr-2" />
                  {userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}
                </>
              ) : (
                <>
                  <MapPin size={18} className="mr-2" />
                  Use My Location
                </>
              )}
            </Button>
            {userLocation && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setUserLocation(null);
                  localStorage.removeItem('worker_location');
                  showToast('Location cleared', 'success');
                }}
                className="text-foreground/60 hover:text-foreground"
              >
                <X size={18} />
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-border ${hasActiveFilters ? 'border-neon-blue bg-neon-blue/10' : ''}`}
            >
              <SlidersHorizontal size={18} className="mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-blue text-background text-xs">
                  {(selectedSkills.length || 0) + (searchQuery ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Completion Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-neon-green/30 bg-neon-green/5 p-4 flex items-start gap-3"
          >
            <AlertCircle className="text-neon-green flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Complete Your Profile</h3>
              <p className="text-sm text-foreground/70">Add skills and a profile picture to unlock 5x more opportunities</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-neon-blue">
              <a href="/dashboard/profile">Complete Profile →</a>
            </Button>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:col-span-1 space-y-6"
              />
            )}
          </AnimatePresence>
          
          <div className={`lg:col-span-1 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Distance Filter */}
            <DistanceFilter onDistanceChange={setDistance} maxDistance={50} />

            {/* Skills Filter */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Skills & Categories</h3>
              <div className="space-y-2">
                {availableSkills.map((skill) => (
                  <label key={skill} className="flex items-center gap-3 cursor-pointer hover:bg-card/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSkills([...selectedSkills, skill]);
                        } else {
                          setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                        }
                      }}
                      className="w-4 h-4 rounded border-border bg-background/50 accent-neon-blue"
                    />
                    <span className="text-sm text-foreground/70">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-foreground/60">ACTIVE FILTERS</span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSkills([]);
                      setDistance(50);
                    }}
                    className="text-xs text-neon-blue hover:text-neon-blue/80"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      onRemove={() => setSelectedSkills(selectedSkills.filter((s) => s !== skill))}
                      variant="primary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Job Cards */}
          <div className="lg:col-span-3">
            {loading ? (
              <SkeletonJobCard count={6} />
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <JobCard
                      id={job.id}
                      title={job.title}
                      company={job.company}
                      payMin={job.pay_min}
                      payMax={job.pay_max}
                      distance={job.distance}
                      location={job.location}
                      tags={job.tags}
                      isUrgent={job.is_urgent}
                      onApply={() => handleApplyClick(job)}
                      isApplying={applyingJobId === job.id}
                      isApplied={job.isApplied || appliedJobIds.has(job.id)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-12 text-center space-y-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/5">
                  <Search className="w-8 h-8 text-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No jobs found</h3>
                <p className="text-foreground/60">Try adjusting your search or filters to find more opportunities</p>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSkills([]);
                    setDistance(50);
                  }}
                  className="mt-4 bg-neon-blue hover:bg-neon-blue/90 text-background"
                >
                  Reset Filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
            <DialogDescription>
              {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Phone size={16} className="text-neon-blue" />
                Contact Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={applyPhone}
                onChange={(e) => setApplyPhone(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-neon-green" />
                Expected Price (Optional)
              </label>
              <Input
                type="number"
                placeholder="Enter your expected price"
                value={applyExpectedPrice}
                onChange={(e) => setApplyExpectedPrice(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Message to Employer (Optional)
              </label>
              <Textarea
                placeholder="Introduce yourself and why you're a good fit..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={submitting}
              className="bg-neon-blue hover:bg-neon-blue/90"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
