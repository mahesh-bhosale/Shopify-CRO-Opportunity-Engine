"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsTable from "@/app/components/ResultsTable";
import OpportunityCard from "@/app/components/OpportunityCard";
import ExportButtons from "@/app/components/ExportButtons";
import {
  CROHealthScore,
  KPISummaryCards,
  PriorityBarChart,
  ImpactEffortMatrix,
  CategoryBreakdown,
  ImpactDistribution,
} from "@/app/components/DashboardCharts";
import { AuditResponse } from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  LayoutDashboard,
  Database,
  AlertCircle,
} from "lucide-react";

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

  // ── Skeleton Loading State ──
  if (!auditResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="h-6 w-48 bg-slate-200 rounded animate-shimmer" />
        </header>
        <main className="max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
          <div className="h-40 bg-white rounded-xl border border-slate-100 animate-shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-100 animate-shimmer"
              />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-72 bg-white rounded-xl border border-slate-100 animate-shimmer" />
            <div className="h-72 bg-white rounded-xl border border-slate-100 animate-shimmer" />
          </div>
        </main>
      </div>
    );
  }

  const opportunities = auditResult.opportunities || [];
  const totalOps = opportunities.length;

  // Format date
  let formattedDate = "";
  if (auditResult.generated_at) {
    try {
      formattedDate = new Date(auditResult.generated_at).toLocaleString(
        undefined,
        { dateStyle: "medium", timeStyle: "short" }
      );
    } catch {
      formattedDate = auditResult.generated_at;
    }
  }

  // ── Empty State ──
  if (totalOps === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold tracking-tight text-slate-800 text-lg">
            CRO Audit Dashboard
          </span>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm max-w-lg space-y-4 animate-fade-in">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto stroke-[1.5]" />
            <h3 className="font-bold text-slate-800 text-xl">
              No Friction Points Identified
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We scanned your store and found no conversion rate optimization
              vulnerabilities. Your pages are using robust layout structures!
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Audit Another URL
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/85 sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
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
            <p className="text-xs text-slate-400 font-semibold mt-0.5 truncate max-w-sm sm:max-w-md">
              Primary Store:{" "}
              <span className="font-bold text-slate-500">
                {auditResult.store_url}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ExportButtons auditResult={auditResult} />
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold select-none shrink-0">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 flex-1 z-10">
        {/* 1. Overall CRO Health Score */}
        <CROHealthScore opportunities={opportunities} />

        {/* 2. KPI Summary Cards */}
        <KPISummaryCards opportunities={opportunities} />

        {/* 3 & 4. Charts — 2 column grid */}
        <section className="grid md:grid-cols-2 gap-6">
          <PriorityBarChart opportunities={opportunities} />
          <ImpactEffortMatrix opportunities={opportunities} />
        </section>

        {/* 5 & 6. Charts — 2 column grid */}
        <section className="grid md:grid-cols-2 gap-6">
          <CategoryBreakdown opportunities={opportunities} />
          <ImpactDistribution opportunities={opportunities} />
        </section>

        {/* Executive Summary */}
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-md border border-indigo-950 p-6 md:p-8 space-y-4 relative overflow-hidden animate-fade-in">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_right_bottom,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="font-extrabold tracking-tight text-lg text-white">
              Executive Summary
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium whitespace-pre-line">
            {auditResult.summary}
          </p>
        </section>

        {/* Opportunity Table & Cards */}
        <section className="space-y-6 print-break">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                CRO Roadmap
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Scored recommendation roadmap ordered by priority
              </p>
            </div>

            {/* Toggle view control */}
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 flex items-center gap-0.5 self-start sm:self-auto select-none no-print">
              <button
                onClick={() => setActiveTab("cards")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition cursor-pointer select-none ${
                  activeTab === "cards"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md transition cursor-pointer select-none ${
                  activeTab === "table"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Matrix Table
              </button>
            </div>
          </div>

          {activeTab === "table" ? (
            <ResultsTable opportunities={opportunities} />
          ) : (
            <div className="grid gap-6">
              {opportunities.map((op, idx) => (
                <div
                  key={op.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <OpportunityCard opportunity={op} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audited Store Index */}
        <section className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-base">
              Audited Store Index
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            The audit engine scraped and evaluated the following resources:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {auditResult.scraped_pages.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-500 truncate hover:bg-slate-100 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{p}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400 no-print">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            &copy; {new Date().getFullYear()} Shopify CRO Opportunity Engine.
            All rights reserved.
          </p>
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
