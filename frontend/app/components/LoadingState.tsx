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

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/80 backdrop-blur-md rounded-2xl border border-indigo-100/50 shadow-xl max-w-md mx-auto text-center space-y-6 transition-all duration-300">
      <div className="relative">
        {/* Glowing backdrop blur */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin stroke-[1.5]" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800">Analyzing Store CRO</h3>
        <div className="h-6 flex items-center justify-center">
          <p className="text-sm font-medium text-indigo-600 animate-pulse">
            {messages[messageIndex]}
          </p>
        </div>
      </div>

      {/* Sleek inline progress bar loader */}
      <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
        <div className="h-full bg-indigo-600 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-full" />
      </div>
      
      <p className="text-xs text-slate-400">
        This may take up to a minute depending on the store size
      </p>
    </div>
  );
}
