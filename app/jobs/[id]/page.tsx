'use client';

import { useEffect, useState, use } from 'react';
import { Navbar } from '@/components/quick-job/navbar';
import { JobCard } from '@/components/quick-job/job-card';
import { SkeletonJobCard } from '@/components/quick-job/skeleton-job-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Clock, Briefcase, Share2, Flag, Star, AlertCircle } from 'lucide-react';
import { jobsApi, usersApi, applicationsApi } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface JobDetailType {
  id: string;
  title: string;
  description: string;
  category: string;
  pay: number;
  address: string;
  city: string;
  pincode: string;
  urgent: boolean;
  employer_id: string;
  status: string;
  created_at: string;
}

interface EmployerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [job, setJob] = useState<JobDetailType | null>(null);
  const [employer, setEmployer] = useState<EmployerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicants, setApplicants] = useState(0);
  const [similarJobs, setSimilarJobs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchJobData() {
      try {
        console.log('Fetching job:', resolvedParams.id);
        const jobData = await jobsApi.get(resolvedParams.id);
        console.log('Job data:', jobData);
        
        if (!jobData) {
          setError('Job not found');
          return;
        }
        setJob(jobData);

        if (jobData.employer_id) {
          console.log('Fetching employer:', jobData.employer_id);
          const empRes = await usersApi.get(jobData.employer_id);
          console.log('Employer:', empRes);
          setEmployer(empRes);
        }

        const appsRes = await applicationsApi.byJob(resolvedParams.id);
        console.log('Applications:', appsRes);
        setApplicants(appsRes?.length || 0);

        if (jobData.category) {
          const similarRes = await jobsApi.list({ category: jobData.category, limit: 3 });
          setSimilarJobs(similarRes?.filter((j: JobDetailType) => j.id !== resolvedParams.id).slice(0, 2) || []);
        }
      } catch (err) {
        setError('Failed to load job');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SkeletonJobCard />
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
            <p className="text-foreground/60 mb-4">{error || 'This job may have been removed'}</p>
            <p className="text-sm text-foreground/40 mb-4">Job ID: {resolvedParams.id}</p>
            <Button onClick={() => router.push('/dashboard/worker')}>Browse Jobs</Button>
          </div>
        </main>
      </div>
    );
  }

  const employerName = employer?.name || 'Unknown';
  const tags = job.category ? [job.category] : [];
  if (job.urgent) tags.push('Urgent');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    {job.urgent && (
                      <Badge className="bg-neon-green text-background hover:bg-neon-green">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-foreground/60 mb-4">{employerName}</p>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-neon-green" />
                      <span className="font-semibold">
                        ${job.pay}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-neon-blue" />
                      <span className="font-semibold">{job.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-neon-purple" />
                      <span className="font-semibold">{job.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={18} className="text-foreground/40" />
                      <span className="font-semibold">{applicants} applicants</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-secondary/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors">
                    <Share2 size={20} />
                  </button>
                  <button className="p-3 rounded-lg border border-border hover:bg-card/50 transition-colors">
                    <Flag size={20} />
                  </button>
                </div>
              </div>

              {/* About the Poster */}
              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold mb-3">About the Poster</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg font-bold">
                    {employerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{employerName}</p>
                    <div className="flex items-center gap-1 text-sm text-foreground/60">
                      <Star size={14} className="text-yellow-500" />
                      <span>4.9</span>
                      <span>(128 reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 space-y-4">
              <h2 className="text-2xl font-bold">Job Details</h2>
              <div className="prose prose-invert max-w-none text-foreground/80 whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* CTA */}
            <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/5 backdrop-blur-sm p-6 space-y-4">
              <Button className="w-full bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold h-12">
                Apply Now
              </Button>
              <p className="text-xs text-foreground/60 text-center">
                {applicants} people have already applied
              </p>
            </div>

            {/* Quick Info */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
              <h3 className="font-semibold">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/60">Pay</span>
                  <span className="font-medium">${job.pay}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Location</span>
                  <span className="font-medium">{job.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Address</span>
                  <span className="font-medium">{job.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/60">Status</span>
                  <span className="font-medium">{job.status}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-3">
              <h3 className="font-semibold">Tips to Stand Out</h3>
              <ul className="space-y-2 text-xs text-foreground/70">
                <li>✓ Complete your profile picture</li>
                <li>✓ Show relevant experience</li>
                <li>✓ Respond quickly to messages</li>
                <li>✓ Be professional and punctual</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <section className="mt-20 space-y-8">
            <h2 className="text-3xl font-bold">Similar Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {similarJobs.map((j: JobDetailType) => (
                <JobCard
                  key={j.id}
                  id={j.id}
                  title={j.title}
                  company={j.employer_id}
                  payMin={j.pay}
                  payMax={j.pay}
                  distance={0}
                  location={j.city}
                  tags={j.category ? [j.category] : []}
                  isUrgent={j.urgent}
                  onApply={() => router.push(`/jobs/${j.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
