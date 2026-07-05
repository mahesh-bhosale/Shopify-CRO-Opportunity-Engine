"use client";

import { Opportunity } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";
import ExperimentBrief from "./ExperimentBrief";
import { useState } from "react";
import { AlertCircle, Lightbulb, Link2, ChevronDown, ChevronUp, Zap, BarChart2 } from "lucide-react";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [showExperiment, setShowExperiment] = useState(false);

  const getImpactStyles = (impact: string) => {
    switch (impact.toLowerCase()) {
      case "high":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      default:
        return "bg-sky-50 text-sky-700 border border-sky-100";
    }
  };

  const getEffortStyles = (effort: string) => {
    switch (effort.toLowerCase()) {
      case "low":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "medium":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      default:
        return "bg-rose-50 text-rose-700 border border-rose-100";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md hover:border-indigo-100/80 transition duration-200">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-5">
        <div className="flex-1 space-y-3">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {opportunity.category}
            </span>
            <span className={`text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded flex items-center gap-1 ${getImpactStyles(opportunity.impact)}`}>
              <Zap className="w-3 h-3 stroke-[2.5]" />
              Impact: {opportunity.impact}
            </span>
            <span className={`text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded flex items-center gap-1 ${getEffortStyles(opportunity.effort)}`}>
              <BarChart2 className="w-3 h-3 stroke-[2.5]" />
              Effort: {opportunity.effort}
            </span>
            <span className="text-[10px] tracking-wider uppercase font-extrabold px-2.5 py-1 rounded bg-slate-50 text-slate-500 border border-slate-200">
              Confidence: {Math.round(opportunity.confidence * 100)}%
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 leading-snug">
            {opportunity.title}
          </h3>
        </div>
        
        {/* Score Display */}
        <div className="shrink-0 flex items-center justify-start md:justify-end">
          <ScoreBadge score={opportunity.score} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5 pt-4 border-t border-slate-50">
        {/* Evidence */}
        <div className="space-y-1.5 p-4 rounded-lg bg-slate-50 border border-slate-100/50">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-500 stroke-[2]" />
            Evidence / Observation
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
            &ldquo;{opportunity.evidence}&rdquo;
          </p>
        </div>

        {/* Recommendation */}
        <div className="space-y-1.5 p-4 rounded-lg bg-indigo-50/30 border border-indigo-50">
          <p className="text-xs uppercase tracking-wider font-bold text-indigo-500 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-indigo-500 stroke-[2]" />
            Actionable Recommendation
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {opportunity.recommendation}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
        {/* Page Link */}
        {opportunity.page_url ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Link2 className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold text-slate-400 shrink-0">Source:</span>
            <a
              href={opportunity.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[280px]"
            >
              {opportunity.page_url}
            </a>
          </div>
        ) : (
          <div />
        )}

        {/* Experiment Toggle */}
        <button
          onClick={() => setShowExperiment(!showExperiment)}
          className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition py-1 px-3.5 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100/50 select-none cursor-pointer self-start sm:self-auto"
        >
          {showExperiment ? (
            <>
              Hide A/B Test Brief
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Generate A/B Test Brief
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {showExperiment && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <ExperimentBrief opportunityId={opportunity.id} />
        </div>
      )}
    </div>
  );
}
