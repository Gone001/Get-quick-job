'use client';

import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface DistanceFilterProps {
  onDistanceChange?: (distance: number) => void;
  maxDistance?: number;
}

export function DistanceFilter({ onDistanceChange, maxDistance = 50 }: DistanceFilterProps) {
  const [distance, setDistance] = useState(5);

  const handleChange = (value: number[]) => {
    setDistance(value[0]);
    onDistanceChange?.(value[0]);
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin size={20} className="text-neon-blue" />
        <h3 className="font-semibold text-foreground">Search Radius</h3>
      </div>

      <div className="space-y-3">
        <Slider
          value={[distance]}
          onValueChange={handleChange}
          min={1}
          max={maxDistance}
          step={1}
          className="w-full"
        />

        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/60">Distance</span>
          <span className="text-lg font-bold text-neon-blue">{distance}km</span>
        </div>
      </div>
    </div>
  );
}
