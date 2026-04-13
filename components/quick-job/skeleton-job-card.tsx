'use client';

import { motion } from 'framer-motion';

interface SkeletonJobCardProps {
  count?: number;
}

export function SkeletonJobCard({ count = 6 }: SkeletonJobCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4"
        >
          <div className="flex justify-between">
            <div className="h-4 w-20 rounded-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-14 rounded-md bg-foreground/10 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="h-5 w-3/4 rounded-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-1/2 rounded-md bg-foreground/10 animate-pulse" />
          </div>
          
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-md bg-foreground/10 animate-pulse" />
            <div className="h-5 w-20 rounded-md bg-foreground/10 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-3 gap-3 py-3 border-t border-border/50">
            <div className="h-4 w-16 rounded-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-12 rounded-md bg-foreground/10 animate-pulse" />
            <div className="h-4 w-20 rounded-md bg-foreground/10 animate-pulse" />
          </div>
          
          <div className="h-10 w-full rounded-md bg-foreground/10 animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}