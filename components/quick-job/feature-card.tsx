import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: 'blue' | 'purple' | 'green';
}

export function FeatureCard({ icon, title, description, accent = 'blue' }: FeatureCardProps) {
  const accentMap = {
    blue: 'border-neon-blue bg-neon-blue/5',
    purple: 'border-neon-purple bg-neon-purple/5',
    green: 'border-neon-green bg-neon-green/5',
  };

  const iconColorMap = {
    blue: 'text-neon-blue',
    purple: 'text-neon-purple',
    green: 'text-neon-green',
  };

  return (
    <div className={`rounded-xl border ${accentMap[accent]} p-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300`}>
      <div className={`w-12 h-12 rounded-lg ${accentMap[accent]} flex items-center justify-center mb-4`}>
        <div className={iconColorMap[accent]}>{icon}</div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-foreground/60 text-sm">{description}</p>
    </div>
  );
}
