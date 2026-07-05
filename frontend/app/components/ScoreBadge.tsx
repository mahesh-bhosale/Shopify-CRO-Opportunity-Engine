"use client";

interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  // Normalize score to fit in [0, 10]
  const normalizedScore = Math.max(0, Math.min(10, score));
  
  // HSL colors depending on score
  // Red = 0 (low score), Yellow = 60 (medium score), Green = 120 (high score)
  const hue = Math.max(0, Math.min(120, normalizedScore * 12));
  const colorClass = `hsl(${hue}, 85%, 45%)`;
  const bgClass = `hsl(${hue}, 85%, 96%)`;
  const textClass = `hsl(${hue}, 90%, 30%)`;
  const glowShadow = `0 6px 20px -2px hsl(${hue}, 80%, 75%)`;

  const radius = 28;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 10) * circumference;

  return (
    <div className="flex flex-col items-center select-none">
      <div 
        className="relative w-18 h-18 rounded-full flex items-center justify-center bg-white transition-all duration-500 ease-out"
        style={{ 
          boxShadow: glowShadow,
          backgroundColor: bgClass 
        }}
      >
        {/* SVG Ring */}
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.05)"
            strokeWidth={stroke}
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="transparent"
            stroke={colorClass}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span 
          className="text-lg font-black tracking-tighter z-10"
          style={{ color: textClass }}
        >
          {normalizedScore.toFixed(1)}
        </span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-2">
        ICE Score
      </span>
    </div>
  );
}
