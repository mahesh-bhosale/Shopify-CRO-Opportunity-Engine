"use client";

import { useState } from "react";
import { Opportunity } from "@/lib/types";
import { Search, ArrowUpDown, Activity } from "lucide-react";

interface ResultsTableProps {
  opportunities: Opportunity[];
  onSelectOpportunity?: (opportunity: Opportunity) => void;
}

type SortField = "score" | "title" | "category" | "impact" | "effort";
type SortOrder = "asc" | "desc";

export default function ResultsTable({ opportunities, onSelectOpportunity }: ResultsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getImpactRank = (impact: string): number => {
    switch (impact.toLowerCase()) {
      case "high": return 3;
      case "medium": return 2;
      default: return 1;
    }
  };

  const getEffortRank = (effort: string): number => {
    switch (effort.toLowerCase()) {
      case "high": return 3;
      case "medium": return 2;
      default: return 1;
    }
  };

  const filtered = opportunities.filter((op) => {
    const term = search.toLowerCase();
    return (
      op.title.toLowerCase().includes(term) ||
      op.category.toLowerCase().includes(term) ||
      op.evidence.toLowerCase().includes(term) ||
      op.recommendation.toLowerCase().includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "impact") {
      aVal = getImpactRank(a.impact);
      bVal = getImpactRank(b.impact);
    } else if (sortField === "effort") {
      aVal = getEffortRank(a.effort);
      bVal = getEffortRank(b.effort);
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50 border border-emerald-150";
    if (score >= 6) return "text-amber-600 bg-amber-50 border border-amber-150";
    if (score >= 4) return "text-orange-600 bg-orange-50 border border-orange-150";
    return "text-rose-600 bg-rose-50 border border-rose-150";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-lg">Opportunities Matrix</h3>
          <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {sorted.length} shown
          </span>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Filter recommendations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition" onClick={() => handleSort("score")}>
                <div className="flex items-center gap-1">
                  Priority Score
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition" onClick={() => handleSort("title")}>
                <div className="flex items-center gap-1">
                  Recommendation Title
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition" onClick={() => handleSort("category")}>
                <div className="flex items-center gap-1">
                  Category
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition" onClick={() => handleSort("impact")}>
                <div className="flex items-center gap-1">
                  Impact
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition" onClick={() => handleSort("effort")}>
                <div className="flex items-center gap-1">
                  Effort
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length > 0 ? (
              sorted.map((op) => (
                <tr 
                  key={op.id} 
                  onClick={() => onSelectOpportunity?.(op)}
                  className={`hover:bg-slate-50/70 transition duration-150 ${onSelectOpportunity ? "cursor-pointer active:bg-slate-100" : ""}`}
                >
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center font-black text-sm w-9 h-9 rounded-full ${getScoreColorClass(op.score)}`}>
                      {op.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700 text-sm leading-snug">{op.title}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md line-clamp-1 italic">
                      {op.recommendation}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      {op.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] tracking-wide uppercase font-extrabold px-2.5 py-0.5 rounded ${
                      op.impact.toLowerCase() === "high" ? "bg-rose-50 text-rose-600" : 
                      op.impact.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"
                    }`}>
                      {op.impact}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] tracking-wide uppercase font-extrabold px-2.5 py-0.5 rounded ${
                      op.effort.toLowerCase() === "low" ? "bg-emerald-50 text-emerald-600" : 
                      op.effort.toLowerCase() === "medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {op.effort}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No opportunities match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
