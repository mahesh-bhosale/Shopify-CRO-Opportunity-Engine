"use client";

interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${getScoreColor(score)} text-white font-bold text-xl w-16 h-16 rounded-full flex items-center justify-center shadow-lg`}
      >
        {score.toFixed(1)}
      </div>
      <span className="text-xs text-gray-500 mt-1">Score</span>
    </div>
  );
}
