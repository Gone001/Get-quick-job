'use client';

import { useState } from 'react';
import { MapPin, Briefcase, DollarSign, ArrowRight, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  payMin: number;
  payMax: number;
  distance: number;
  location: string;
  tags?: string[];
  isUrgent?: boolean;
  onApply?: () => void;
  isApplying?: boolean;
  isApplied?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  payMin,
  payMax,
  distance,
  location,
  tags = [],
  isUrgent = false,
  onApply,
  isApplying = false,
  isApplied = false,
}: JobCardProps) {
  const handleApply = () => {
    console.log('JobCard handleApply called, onApply exists:', !!onApply);
    if (onApply) {
      onApply();
    }
  };

  const getDistanceLabel = (dist: number) => {
    if (dist < 1) return '<1km';
    if (dist < 3) return 'Nearby';
    if (dist < 5) return 'Close';
    return `${dist.toFixed(1)}km`;
  };

  const getDistanceColor = (dist: number) => {
    if (dist < 1) return 'bg-neon-green text-background';
    if (dist < 3) return 'bg-neon-blue text-background';
    if (dist < 5) return 'bg-neon-purple text-background';
    return 'bg-foreground/40 text-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 hover:border-neon-blue/60 hover:shadow-[0_0_30px_rgba(0,200,255,0.15)] transition-all duration-300"
      style={{ zIndex: 1 }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {isUrgent && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4 pointer-events-none"
        >
          <Badge className="bg-neon-green text-background hover:bg-neon-green shadow-lg shadow-neon-green/30">
            <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse mr-1.5" />
            Urgent
          </Badge>
        </motion.div>
      )}

      <div className={`absolute -top-2 -left-2 px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1 ${getDistanceColor(distance)} transition-all duration-300 group-hover:scale-110 pointer-events-none`}>
        <Navigation size={10} />
        {getDistanceLabel(distance)}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-neon-blue transition-colors line-clamp-1 pr-16">
            {title}
          </h3>
          <p className="text-sm text-foreground/60">{company}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className={`${
                idx === 0 ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' :
                idx === 1 ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' :
                'bg-secondary/50'
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 py-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-neon-green" />
            <span className="text-sm font-bold">
              ₹{payMin}–₹{payMax}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-neon-blue" />
            <span className="text-sm">{distance}km</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-neon-purple" />
            <span className="text-sm truncate">{location}</span>
          </div>
        </div>

        <Button
          onClick={handleApply}
          disabled={isApplying || isApplied}
          className="w-full bg-neon-blue hover:bg-neon-blue/90 text-background font-semibold shadow-lg shadow-neon-blue/20 group-hover:shadow-neon-blue/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-10"
        >
          {isApplying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Applying...
            </>
          ) : isApplied ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mr-2"
              >
                ✓
              </motion.div>
              Applied!
            </>
          ) : (
            <>
              Apply Now
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
