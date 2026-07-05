"use client";

import { useState } from "react";
import { Globe, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

interface UrlFormProps {
  onSubmit: (url: string, competitorUrl?: string) => void;
  isLoading: boolean;
}

export default function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString.trim());
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      const cleaned = urlString.trim();
      return cleaned.includes(".") && cleaned.length > 3;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let primary = url.trim();
    let competitor = competitorUrl.trim();

    if (!primary) {
      setError("Please enter your Shopify store URL.");
      return;
    }

    if (!validateUrl(primary)) {
      setError("Please enter a valid Shopify store URL (e.g., brand.com or brand.myshopify.com).");
      return;
    }

    if (competitor && !validateUrl(competitor)) {
      setError("Please enter a valid competitor URL.");
      return;
    }

    // Standardize URL protocol if not present
    if (!/^https?:\/\//i.test(primary)) {
      primary = "https://" + primary;
    }
    if (competitor && !/^https?:\/\//i.test(competitor)) {
      competitor = "https://" + competitor;
    }

    onSubmit(primary, competitor || undefined);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100/50 p-8 max-w-xl mx-auto transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store URL */}
        <div className="space-y-2">
          <label htmlFor="url" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Globe className="w-4 h-4 text-indigo-500" />
            Your Shopify Store URL
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="brandname.com"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition duration-150 text-slate-800 placeholder-slate-400 font-medium"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Competitor URL */}
        <div className="space-y-2">
          <label htmlFor="competitorUrl" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            Compare against competitor <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Optional</span>
          </label>
          <div className="relative rounded-lg shadow-sm">
            <input
              type="text"
              id="competitorUrl"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="competitor.com"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition duration-150 text-slate-800 placeholder-slate-400 font-medium"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-sm animate-pulse">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-4 px-6 rounded-lg font-semibold shadow-lg hover:shadow-indigo-500/25 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none group"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating Audit Report...
            </span>
          ) : (
            <>
              Run Diagnostic Audit
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
