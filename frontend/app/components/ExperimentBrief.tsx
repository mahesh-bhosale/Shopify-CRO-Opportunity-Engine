"use client";

import { useState, useEffect } from "react";
import { getExperimentBrief } from "@/lib/api";
import { ExperimentBrief as ExperimentBriefType } from "@/lib/types";

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
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="text-sm text-red-600 py-4">
        {error || "Unable to load experiment brief"}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <h4 className="font-semibold text-gray-900">Experiment Brief</h4>
      
      <div>
        <p className="text-sm font-medium text-gray-700">Hypothesis:</p>
        <p className="text-sm text-gray-600">{brief.hypothesis}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Control:</p>
          <p className="text-sm text-gray-600">{brief.control}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Variant:</p>
          <p className="text-sm text-gray-600">{brief.variant}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Primary Metric:</p>
        <p className="text-sm text-gray-600">{brief.primary_metric}</p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Secondary Metrics:</p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          {brief.secondary_metrics.map((metric, index) => (
            <li key={index}>{metric}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Estimated Duration:</p>
        <p className="text-sm text-gray-600">{brief.estimated_duration}</p>
      </div>
    </div>
  );
}
