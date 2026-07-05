"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UrlForm from "@/app/components/UrlForm";
import LoadingState from "@/app/components/LoadingState";
import { runAudit } from "@/lib/api";
import { AuditResponse } from "@/lib/types";
import { Cpu, Target, Compass, Sparkles, TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuditSubmit = async (url: string, competitorUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: AuditResponse = await runAudit(url, competitorUrl);
      sessionStorage.setItem("auditResult", JSON.stringify(result));
      router.push("/results");
    } catch (err: any) {
      setError(err.message || "Failed to run audit. Please check the URL and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-400 stroke-[2.5]" />
          <span className="font-extrabold tracking-tight text-white text-lg">
            Shopify <span className="text-indigo-400">CRO</span> Engine
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          Powered by Gemini 1.5
        </div>
      </header>

      {/* Main SaaS Hero and Form */}
      <main className="relative max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col items-center justify-center z-10">
        {/* Hero Copy */}
        <div className="text-center max-w-3xl space-y-4 mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 mb-2 select-none">
            Diagnostics Tool
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Turn Shopify Traffic Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              High-Converting Buyers
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enter any Shopify brand URL. Our diagnostics engine scrapes real site data, identifies conversion friction, and outputs a prioritized, scored CRO roadmap.
          </p>
        </div>

        {/* Audit Form Container */}
        <div className="w-full max-w-lg mb-16 relative">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm font-medium text-center">
              {error}
            </div>
          )}
          <UrlForm onSubmit={handleAuditSubmit} isLoading={isLoading} />
        </div>

        {/* Feature Cards Section */}
        <section className="w-full grid md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Continuous Deep Scrape</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Crawls homepage, collection templates, product detail pages (PDPs), and cart modules to harvest real structure and layout evidence.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Gemini-Powered Auditor</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Applies DTC buyer psychology principles. Rejects generic tips to offer evidence-rooted changes citing actual fields.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Prioritized ICE Scorecard</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every discovery is evaluated on expected Impact, Confidence, and Effort, creating an actionable priority testing roadmap.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Shopify CRO Opportunity Engine. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400">Privacy Policy</span>
            <span className="hover:text-slate-400">Terms of Service</span>
            <span className="hover:text-slate-400">DTC CRO Playbook</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
