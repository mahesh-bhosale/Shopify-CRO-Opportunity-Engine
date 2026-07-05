"use client";

import { useState, useEffect } from "react";
import { getExperimentBrief } from "@/lib/api";
import { ExperimentBrief as ExperimentBriefType } from "@/lib/types";
import { FlaskConical, Target, Repeat2, Gauge, Timer, AlertCircle } from "lucide-react";

interface ExperimentBriefProps {
  opportunityId: string;
}

export default function ExperimentBrief({ opportunityId }: ExperimentBriefProps) {
  const [brief, setBrief] = useState<ExperimentBriefType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const data = await getExperimentBrief(opportunityId);
        setBrief(data);
      } catch (err) {
        setError("Failed to load experiment brief");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrief();
  }, [opportunityId]);

  if (isLoading) {
    return (
      <div className="space-y-3 animate-shimmer">
        <div className="h-5 w-40 bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-100 rounded-lg" />
          <div className="h-16 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-lg">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        <p className="text-sm text-rose-700 font-medium">
          {error || "Unable to load experiment brief"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-indigo-500" />
        <h4 className="font-bold text-slate-800 text-sm">A/B Experiment Brief</h4>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
          Hypothesis
        </p>
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          {brief.hypothesis}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-3.5 rounded-lg border border-slate-100 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
            <Repeat2 className="w-3.5 h-3.5" /> Control
          </p>
          <p className="text-sm text-slate-600 font-medium">{brief.control}</p>
        </div>
        <div className="bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-100 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5" /> Variant
          </p>
          <p className="text-sm text-slate-700 font-medium">{brief.variant}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" /> Primary Metric
          </p>
          <p className="text-sm text-slate-700 font-bold">
            {brief.primary_metric}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Secondary Metrics
          </p>
          <ul className="text-sm text-slate-600 space-y-0.5">
            {brief.secondary_metrics.map((metric, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                {metric}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" /> Duration
          </p>
          <p className="text-sm text-slate-700 font-bold">
            {brief.estimated_duration}
          </p>
        </div>
      </div>
    </div>
  );
}
