'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/quick-job/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, DollarSign, MapPin, Clock, AlertCircle, Loader2, Navigation } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { jobsApi } from '@/lib/api-client';
import { useShowToast } from '@/components/quick-job/show-toast';

export default function PostJobPage() {
  const router = useRouter();
  const { showToast } = useShowToast();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    payMin: '',
    payMax: '',
    address: '',
    city: '',
    pincode: '',
    latitude: '',
    longitude: '',
    location: '',
    duration: '',
    isUrgent: false,
  });

  // Validate user role on mount
  useEffect(() => {
    const validateUser = async () => {
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
        .select('role, profile_completed_min')
        .eq('id', user.id)
        .single();

      if (!userData?.profile_completed_min) {
        showToast("Please complete your profile first", "error");
        router.push('/dashboard/profile');
        return;
      }

      if (userData.role && userData.role !== 'recruiter') {
        showToast("You have a Worker account. Create a Recruiter account to post jobs.", "error");
        router.push('/dashboard/worker');
        return;
      }

      setIsValidating(false);
    };

    validateUser();
  }, [router, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
      return;
    }
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          setFormData((prev) => ({
            ...prev,
            address: data.address?.road || data.address?.suburb || '',
            city: data.address?.city || data.address?.town || data.address?.village || '',
            pincode: data.address?.postcode || '',
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          showToast("Location detected!", "success");
        } catch {
          // Just save coordinates if reverse geocoding fails
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          showToast("Coordinates saved!", "success");
        }
        setGettingLocation(false);
      },
      (error) => {
        showToast("Could not get location", "error");
        setGettingLocation(false);
      }
    );
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
if (!user) {
        showToast("Please sign in to post a job", "error");
        return;
      }

      const { data: recruiterData, error: recruiterError } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', user.email)
        .single();

      if (recruiterError || !recruiterData) {
        console.error('Error fetching recruiter:', recruiterError);
        showToast("Failed to find recruiter profile", "error");
        return;
      }

const jobData = {
        title: formData.title,
        category: formData.category?.toLowerCase(),
        description: formData.description,
        pay: parseInt(formData.payMin) || parseInt(formData.payMax) || 0,
        employer_id: recruiterData.id,
        status: 'open',
        urgent: formData.isUrgent || false,
        address: formData.address || undefined,
        city: formData.city || undefined,
        pincode: formData.pincode || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      };

      // Use API - if fails, use Supabase
      try {
        await jobsApi.create(jobData);
      } catch (e) {
        const { error: jobError } = await supabase.from('jobs').insert(jobData);
        if (jobError) throw jobError;
      }

      showToast("Job posted successfully!", "success");
      router.push('/dashboard/recruiter');
    } catch (error: any) {
      console.error('Error posting job:', error);
      showToast("Failed to post job", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-lg">Validating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Post a New Job</h1>
          <p className="text-foreground/60">Fill in the details to attract the right worker</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Job Basics */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-neon-blue" />
                  Job Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title *</label>
                  <Input
                    type="text"
                    name="title"
                    placeholder="e.g., House Cleaning - 3 Hours"
                    value={formData.title}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="delivery">Delivery</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="event">Event Planning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <Textarea
                  name="description"
                  placeholder="Describe the job, requirements, and what you're looking for..."
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-32 bg-background/50 border-border"
                  required
                />
              </div>
            </div>

            {/* Section 2: Pay & Duration */}
            <div className="space-y-6 pt-6 border-t border-border">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-neon-green" />
                  Payment & Duration
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Min. Pay (₹) *</label>
                  <Input
                    type="number"
                    name="payMin"
                    placeholder="25"
                    value={formData.payMin}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max. Pay (₹) *</label>
                  <Input
                    type="number"
                    name="payMax"
                    placeholder="75"
                    value={formData.payMax}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration *</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="30min">30 minutes</option>
                    <option value="1hour">1 hour</option>
                    <option value="2hours">2 hours</option>
                    <option value="3hours">3 hours</option>
                    <option value="halfday">Half day</option>
                    <option value="fullday">Full day</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Location */}
            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin size={20} className="text-neon-purple" />
                  Location
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className={`border-neon-green/50 hover:bg-neon-green/10 ${gettingLocation ? 'opacity-50' : 'text-neon-green'}`}
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation size={16} className="mr-2" />
                      Use My Location
                    </>
                  )}
                </Button>
              </div>
              {(formData.latitude && formData.longitude) && (
                <div className="text-xs text-neon-green">
                  ✓ Location detected: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  type="text"
                  name="address"
                  placeholder="Street address or area"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-background/50 border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pincode</label>
                  <Input
                    type="text"
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="bg-background/50 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Options */}
            <div className="space-y-6 pt-6 border-t border-border">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-neon-blue" />
                  Options
                </h2>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:border-neon-blue/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <AlertCircle size={16} className="text-neon-green" />
                    Mark as Urgent
                  </div>
                  <p className="text-sm text-foreground/60">Urgent jobs get 3x more visibility</p>
                </div>
                {formData.isUrgent && (
                  <div className="text-xs font-medium text-neon-green">+$5</div>
                )}
              </label>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-neon-blue/5 border border-neon-blue/30">
                <AlertCircle size={20} className="text-neon-blue flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70">
                  All jobs are reviewed before posting. You&apos;ll receive confirmation within 1 hour.
                </p>
              </div>

              <div className="flex gap-4">
                <Button asChild variant="outline" className="flex-1 border-border">
                  <Link href="/dashboard/recruiter">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Job'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
