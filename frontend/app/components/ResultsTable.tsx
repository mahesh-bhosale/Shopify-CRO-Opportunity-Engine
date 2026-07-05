"use client";

import { Opportunity } from "@/lib/types";
import OpportunityCard from "./OpportunityCard";

interface ResultsTableProps {
  opportunities: Opportunity[];
}

export default function ResultsTable({ opportunities }: ResultsTableProps) {
  const sortedOpportunities = [...opportunities].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Identified Opportunities ({opportunities.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {sortedOpportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </div>
  );
}
