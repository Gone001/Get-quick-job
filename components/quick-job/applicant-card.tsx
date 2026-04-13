'use client';

import { Users, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ApplicantCardProps {
  name: string;
  skills: string[];
  distance: number;
  rating: number;
  applicantCount?: number;
  status?: string;
  onHire?: () => void;
  onView?: () => void;
}

export function ApplicantCard({
  name,
  skills,
  distance,
  rating,
  applicantCount = 0,
  status,
  onHire,
  onView,
}: ApplicantCardProps) {
  const isHired = status === 'accepted' || status === 'hired';
  
  return (
    <div className={`rounded-xl border bg-card/50 backdrop-blur-sm p-5 transition-all duration-300 ${
      isHired ? 'border-neon-green/50 bg-neon-green/5' : 'border-border hover:border-neon-blue hover:shadow-lg hover:shadow-neon-purple/20'
    }`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{name}</h4>
              {isHired && (
                <Badge className="bg-neon-green/20 text-neon-green text-xs">
                  Hired
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {rating > 0 ? (
                <>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < Math.floor(rating) ? 'text-neon-yellow' : 'text-foreground/30'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-foreground/60">{rating.toFixed(1)}</span>
                </>
              ) : (
                <span className="text-xs text-foreground/40">No rating yet</span>
              )}
            </div>
          </div>
          {applicantCount > 0 && (
            <Badge className="bg-neon-blue text-background hover:bg-neon-blue">
              <Users size={12} className="mr-1" />
              {applicantCount}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs bg-secondary/50">
              {skill}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-foreground/60 py-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            {distance}km away
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            Available now
          </div>
        </div>

        {!isHired && (
          <div className="flex gap-2">
            <Button
              onClick={onHire}
              className="flex-1 bg-neon-green hover:bg-neon-green/90 text-background text-xs font-semibold"
            >
              Hire
            </Button>
            <Button
              onClick={onView}
              variant="outline"
              className="flex-1 text-xs border-neon-blue/50 hover:bg-neon-blue/10"
            >
              View Profile
            </Button>
          </div>
        )}
        {isHired && (
          <div className="text-center text-neon-green text-sm font-medium py-2 bg-neon-green/10 rounded-lg">
            ✓ This candidate has been hired
          </div>
        )}
      </div>
    </div>
  );
}
