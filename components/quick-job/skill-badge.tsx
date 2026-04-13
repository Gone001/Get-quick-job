import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SkillBadgeProps {
  skill: string;
  onRemove?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function SkillBadge({ skill, onRemove, variant = 'secondary' }: SkillBadgeProps) {
  const colorMap = {
    primary: 'bg-neon-blue text-background',
    secondary: 'bg-neon-purple text-background',
    accent: 'bg-neon-green text-background',
  };

  return (
    <Badge className={`${colorMap[variant]} flex items-center gap-2 cursor-default hover:opacity-90`}>
      {skill}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:opacity-70">
          <X size={14} />
        </button>
      )}
    </Badge>
  );
}
