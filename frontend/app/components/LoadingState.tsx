"use client";

import { useEffect, useState } from "react";

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Scraping product pages…",
    "Analyzing catalog…",
    "Identifying CRO opportunities…",
    "Ranking by impact…",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-lg font-medium text-gray-700">{messages[messageIndex]}</p>
    </div>
  );
}
