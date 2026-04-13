'use client';

import { HeroSection } from '@/components/quick-job/hero-section';
import { FeatureCard } from '@/components/quick-job/feature-card';
import { Navbar } from '@/components/quick-job/navbar';
import { Zap, Users, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, role, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">Why Choose Quick</h2>
              <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
                Built for speed, designed for reliability. Get connected to real opportunities in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<Zap size={24} />}
                title="Lightning Fast"
                description="Post jobs and find talent in minutes, not days"
                accent="blue"
              />
              <FeatureCard
                icon={<Users size={24} />}
                title="Real People"
                description="Verified workers and genuine job opportunities"
                accent="purple"
              />
              <FeatureCard
                icon={<Clock size={24} />}
                title="Instant Payments"
                description="Get paid same-day or next-day guaranteed"
                accent="green"
              />
              <FeatureCard
                icon={<TrendingUp size={24} />}
                title="Build Your Reputation"
                description="Ratings and reviews to grow your profile"
                accent="blue"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-foreground/60">Three simple steps to get started</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  description: 'Sign up in seconds and tell us what you&apos;re looking for or what you&apos;re offering.',
                },
                {
                  step: '02',
                  title: 'Find Matches',
                  description: 'Browse real jobs or connect with qualified workers in your area.',
                },
                {
                  step: '03',
                  title: 'Get to Work',
                  description: 'Start immediately and build your reputation one job at a time.',
                },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -top-4 -left-4 text-6xl font-bold text-neon-blue/20">
                    {item.step}
                  </div>
                  <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 min-h-64 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                      <p className="text-foreground/60">{item.description}</p>
                    </div>
                    {idx < 2 && (
                      <div className="absolute -right-4 top-1/2 hidden md:flex items-center justify-center w-8 h-8 bg-background border border-border rounded-full">
                        <div className="w-1 h-1 bg-neon-blue rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-neon-blue/10 via-background to-neon-purple/10 border-t border-border">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg text-foreground/60">
              Join thousands of workers and employers already earning on quick job marketplace
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!loading && user && role === 'recruiter' ? (
                <>
                  <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
                    <Link href="/jobs/post">Post a Job</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-neon-purple text-neon-purple hover:bg-neon-purple/10">
                    <Link href="/dashboard/recruiter">Find Workers</Link>
                  </Button>
                </>
              ) : !loading && user && role === 'worker' ? (
                <>
                  <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
                    <Link href="/dashboard/worker">Find Jobs</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-neon-purple text-neon-purple hover:bg-neon-purple/10">
                    <Link href="/dashboard/profile">My Profile</Link>
                  </Button>
                </>
              ) : !loading && user && !role ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
                    <Link href="/dashboard/worker">Find Jobs</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-neon-purple text-neon-purple hover:bg-neon-purple/10">
                    <Link href="/jobs/post">Post Jobs</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
                    <Link href="/auth/login">Find Jobs</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-neon-purple text-neon-purple hover:bg-neon-purple/10">
                    <Link href="/auth/login">Post Jobs</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-background/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-neon-blue rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">⚡</span>
                  </div>
                  <span className="font-bold">quick</span>
                </div>
                <p className="text-sm text-foreground/60">The fast way to find work and hire talent</p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-foreground">For Workers</h4>
                <ul className="space-y-2 text-sm text-foreground/60">
                  {user && role === 'worker' ? (
                    <>
                      <li><Link href="/dashboard/worker" className="hover:text-foreground transition-colors">Find Jobs</Link></li>
                      <li><Link href="/dashboard/profile" className="hover:text-foreground transition-colors">My Profile</Link></li>
                    </>
                  ) : user && role === 'recruiter' ? (
                    <>
                      <li><Link href="/dashboard/recruiter" className="hover:text-foreground transition-colors">Find Workers</Link></li>
                      <li><Link href="/jobs/post" className="hover:text-foreground transition-colors">Post a Job</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Find Jobs</Link></li>
                      <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Post a Job</Link></li>
                    </>
                  )}
                  <li><Link href="#" className="hover:text-foreground transition-colors">How It Works</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-foreground">For Employers</h4>
                <ul className="space-y-2 text-sm text-foreground/60">
                  {user && role === 'recruiter' ? (
                    <>
                      <li><Link href="/jobs/post" className="hover:text-foreground transition-colors">Post a Job</Link></li>
                      <li><Link href="/dashboard/recruiter" className="hover:text-foreground transition-colors">Find Workers</Link></li>
                    </>
                  ) : user && role === 'worker' ? (
                    <>
                      <li><Link href="/dashboard/worker" className="hover:text-foreground transition-colors">Find Jobs</Link></li>
                      <li><Link href="/dashboard/profile" className="hover:text-foreground transition-colors">My Profile</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Post a Job</Link></li>
                      <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Find Workers</Link></li>
                    </>
                  )}
                  <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-foreground">Company</h4>
                <ul className="space-y-2 text-sm text-foreground/60">
                  <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center text-sm text-foreground/60">
              <p>&copy; 2025 quick job marketplace. All rights reserved.</p>
              <div className="flex gap-6 mt-4 sm:mt-0">
                <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
