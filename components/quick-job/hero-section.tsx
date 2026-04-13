'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Zap, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface JobDot {
  id: number;
  x: number;
  y: number;
  delay: number;
}

function generateDots(count: number): JobDot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 25 + Math.random() * 50,
    y: 25 + Math.random() * 50,
    delay: Math.random() * 2,
  }));
}

export function HeroSection() {
  const [dots, setDots] = useState<JobDot[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(generateDots(Math.floor(Math.random() * 4) + 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen bg-background overflow-hidden pt-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-blue/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-purple/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              <Zap size={16} className="text-neon-green" />
              <span className="text-sm font-medium">Fast. Reliable. Real Jobs.</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Find Your Next{' '}
              <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green bg-clip-text text-transparent">
                Opportunity
              </span>
            </h1>

            <p className="text-lg text-foreground/70 max-w-lg">
              Connect with real jobs in your area. Work on your terms, get paid fast, and build your experience with quick job marketplace.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold">
                <Link href="/dashboard/worker">
                  Find Jobs
                  <ArrowRight size={20} className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-neon-purple text-neon-purple hover:bg-neon-purple/10">
                <Link href="/dashboard/recruiter">Post a Job</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="text-3xl font-bold text-neon-green">2.5k+</p>
                <p className="text-sm text-foreground/60">Active Jobs</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-neon-blue">15k+</p>
                <p className="text-sm text-foreground/60">Workers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-neon-purple">₹500k+</p>
                <p className="text-sm text-foreground/60">Paid Out</p>
              </div>
            </div>
          </div>

          <div className="relative h-96 lg:h-full min-h-96 flex items-center justify-center">
            <div className="relative w-80 h-80">
              {[3, 2, 1].map((ring, i) => (
<motion.div
              key={ring}
              className="absolute inset-0 rounded-full border-2 border-neon-green/40"
              animate={{
                scale: [0.2, 1.5],
                opacity: [0.7, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeOut",
              }}
            />
              ))}

              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-14 bg-gradient-to-b from-neon-green to-transparent opacity-70 rounded-full" />
              </motion.div>

              <motion.div
                className="absolute inset-0"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-6 bg-gradient-to-t from-neon-blue to-transparent opacity-40 rounded-full" />
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 bg-neon-green rounded-full shadow-lg shadow-neon-green/80"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              {dots.map((dot) => (
                <motion.div
                  key={dot.id}
                  className="absolute w-4 h-4 bg-neon-green rounded-full shadow-lg shadow-neon-green/60"
                  style={{ 
                    left: `${dot.x}%`, 
                    top: `${dot.y}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 0.8] }}
                  transition={{ 
                    duration: 1.5, 
                    delay: dot.delay,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <motion.div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 text-neon-green text-xs font-medium whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2.5, delay: dot.delay + 0.5, repeat: Infinity }}
                  >
                    <MapPin size={12} />
                    <span>Job</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="absolute bottom-0 flex items-center gap-2 text-neon-green text-sm"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Navigation size={14} />
              <span>Scanning for jobs...</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}