"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const messages = [
  "Initializing store crawler...",
  "Scraping Shopify store collections & pages...",
  "Extracting HTML signals & metadata...",
  "Analyzing layout & buyer psychology with Gemini...",
  "Computing ICE scores and prioritizing recommendations...",
  "Finalizing CRO audit report...",
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/80 backdrop-blur-md rounded-2xl border border-indigo-100/50 shadow-xl max-w-md mx-auto text-center space-y-6 transition-all duration-300 animate-fade-in">
      <div className="relative">
        {/* Glowing backdrop blur */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin stroke-[1.5]" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800">
          Analyzing Store CRO
        </h3>
        <div className="h-6 flex items-center justify-center">
          <p
            key={messageIndex}
            className="text-sm font-medium text-indigo-600 animate-fade-in"
          >
            {messages[messageIndex]}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[200px] space-y-2">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-semibold">
          {Math.round(Math.min(progress, 95))}% complete
        </p>
      </div>

      <p className="text-xs text-slate-400">
        This may take up to a minute depending on the store size
      </p>
    </div>
  );
}
