"use client";

import { Opportunity } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";
import ExperimentBrief from "./ExperimentBrief";
import { useState } from "react";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [showExperiment, setShowExperiment] = useState(false);

  const impactColors = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };

  const effortColors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-red-100 text-red-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
              {opportunity.category}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${impactColors[opportunity.impact]}`}>
              Impact: {opportunity.impact}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${effortColors[opportunity.effort]}`}>
              Effort: {opportunity.effort}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {opportunity.title}
          </h3>
        </div>
        <ScoreBadge score={opportunity.score} />
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
          <p className="text-sm text-gray-600 italic">"{opportunity.evidence}"</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Recommendation:</p>
          <p className="text-sm text-gray-600">{opportunity.recommendation}</p>
        </div>
        {opportunity.page_url && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Found on:</p>
            <a
              href={opportunity.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {opportunity.page_url}
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Confidence: {Math.round(opportunity.confidence * 100)}%
        </div>
        <button
          onClick={() => setShowExperiment(!showExperiment)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showExperiment ? "Hide Experiment" : "View Experiment"}
        </button>
      </div>

      {showExperiment && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ExperimentBrief opportunityId={opportunity.id} />
        </div>
      )}
    </div>
  );
}
