"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsTable from "@/app/components/ResultsTable";
import OpportunityCard from "@/app/components/OpportunityCard";
import { AuditResponse } from "@/lib/types";
import { ArrowLeft, Calendar, FileText, CheckCircle2, LayoutDashboard, Database } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "cards">("cards");

  useEffect(() => {
    const stored = sessionStorage.getItem("auditResult");
    if (stored) {
      try {
        setAuditResult(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse auditResult from sessionStorage:", err);
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!auditResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="text-slate-400 font-medium">Loading audit dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const opportunities = auditResult.opportunities || [];
  const totalOps = opportunities.length;
  const avgScore = totalOps > 0 ? opportunities.reduce((acc, curr) => acc + curr.score, 0) / totalOps : 0;
  const highImpactCount = opportunities.filter((op) => op.impact.toLowerCase() === "high").length;
  const pagesCount = auditResult.scraped_pages?.length || 0;

  // Format date
  let formattedDate = "";
  if (auditResult.generated_at) {
    try {
      formattedDate = new Date(auditResult.generated_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      formattedDate = auditResult.generated_at;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/85 sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-800 text-lg">
                CRO Audit Dashboard
              </span>
              <span className="text-[10px] tracking-wider uppercase font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                PRO REPORT
              </span>
            </div>
            <p className="text-xs text-slate-450 font-semibold mt-0.5 truncate max-w-sm sm:max-w-md">
              Primary Store: <span className="font-bold text-slate-550">{auditResult.store_url}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold select-none shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Report Generated: {formattedDate}</span>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 flex-1 z-10">
        {/* KPI Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Average ICE Score</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800">{avgScore.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-bold">/ 10</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Based on priority matrix</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Opportunities Found</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-indigo-600">{totalOps}</span>
              <span className="text-xs text-slate-400 font-bold">actionable</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Spanning 5 page-types</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">High CVR Impact</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-rose-600">{highImpactCount}</span>
              <span className="text-xs text-slate-400 font-bold">prioritized</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Target testing candidates</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Scraped Pages</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600">{pagesCount}</span>
              <span className="text-xs text-slate-400 font-bold">harvested</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-1">Fully parsed HTML components</p>
          </div>
        </section>

        {/* Executive Summary Card */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-md border border-indigo-950 p-6 md:p-8 space-y-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_right_bottom,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-extrabold tracking-tight text-lg text-white">Executive Summary</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium whitespace-pre-line">
            {auditResult.summary}
          </p>
        </section>

        {/* Interactive Opportunities View */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">CRO Roadmap</h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Scored recommendation roadmap ordered by priority</p>
            </div>

            {/* Toggle view control */}
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 flex items-center gap-0.5 self-start sm:self-auto select-none">
              <button
                onClick={() => setActiveTab("cards")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition cursor-pointer select-none ${
                  activeTab === "cards" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition cursor-pointer select-none ${
                  activeTab === "table" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Matrix Table
              </button>
            </div>
          </div>

          {/* Empty State */}
          {totalOps === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm max-w-lg mx-auto space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto stroke-[1.5]" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">No Friction Points Identified</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  We scanned your store and found no conversion rate optimization vulnerabilities. Your pages are using robust layout structures!
                </p>
              </div>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 transition"
              >
                Audit Another URL
              </button>
            </div>
          ) : activeTab === "table" ? (
            <ResultsTable opportunities={opportunities} />
          ) : (
            <div className="grid gap-6">
              {opportunities.map((op) => (
                <OpportunityCard key={op.id} opportunity={op} />
              ))}
            </div>
          )}
        </section>

        {/* Scraped Pages List */}
        <section className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-base">Audited Store Index</h3>
          </div>
          <p className="text-xs text-slate-400 font-semibold">The audit engine scraped and evaluated the following resources:</p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {auditResult.scraped_pages.map((p, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-500 truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{p}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Shopify CRO Opportunity Engine. All rights reserved.</p>
          <button 
            onClick={() => router.push("/")}
            className="text-indigo-600 hover:text-indigo-800 font-bold transition"
          >
            Audit Another Brand
          </button>
        </div>
      </footer>
    </div>
  );
}
