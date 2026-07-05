"use client";

import { useState } from "react";
import { Opportunity } from "@/lib/types";
import {
  Search,
  ArrowUpDown,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ResultsTableProps {
  opportunities: Opportunity[];
  onSelectOpportunity?: (opportunity: Opportunity) => void;
}

type SortField =
  | "score"
  | "title"
  | "category"
  | "impact"
  | "effort"
  | "confidence";
type SortOrder = "asc" | "desc";

const ROWS_PER_PAGE = 10;

export default function ResultsTable({
  opportunities,
  onSelectOpportunity,
}: ResultsTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(0);
  };

  const getImpactRank = (impact: string): number => {
    switch (impact.toLowerCase()) {
      case "high":
        return 3;
      case "medium":
        return 2;
      default:
        return 1;
    }
  };

  const getEffortRank = (effort: string): number => {
    switch (effort.toLowerCase()) {
      case "high":
        return 3;
      case "medium":
        return 2;
      default:
        return 1;
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
    let aVal: string | number = (a as Record<string, any>)[sortField];
    let bVal: string | number = (b as Record<string, any>)[sortField];

    if (sortField === "impact") {
      aVal = getImpactRank(a.impact);
      bVal = getImpactRank(b.impact);
    } else if (sortField === "effort") {
      aVal = getEffortRank(a.effort);
      bVal = getEffortRank(b.effort);
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paged = sorted.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  const getScoreColorClass = (score: number) => {
    if (score >= 8)
      return "text-emerald-600 bg-emerald-50 border border-emerald-200";
    if (score >= 6)
      return "text-amber-600 bg-amber-50 border border-amber-200";
    if (score >= 4)
      return "text-orange-600 bg-orange-50 border border-orange-200";
    return "text-rose-600 bg-rose-50 border border-rose-200";
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="px-4 py-4 cursor-pointer hover:text-indigo-600 transition whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={`w-3 h-3 ${
            sortField === field ? "text-indigo-500" : ""
          }`}
        />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-lg">
            Opportunities Matrix
          </h3>
          <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {sorted.length} total
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
              <SortHeader field="score">Score</SortHeader>
              <SortHeader field="title">Title</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              <SortHeader field="impact">Impact</SortHeader>
              <SortHeader field="confidence">Confidence</SortHeader>
              <SortHeader field="effort">Effort</SortHeader>
              <th className="px-4 py-4 whitespace-nowrap">Evidence</th>
              <th className="px-4 py-4 whitespace-nowrap">Recommendation</th>
              <th className="px-4 py-4 whitespace-nowrap">Page</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length > 0 ? (
              paged.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => onSelectOpportunity?.(op)}
                  className={`hover:bg-slate-50/70 transition duration-150 ${
                    onSelectOpportunity
                      ? "cursor-pointer active:bg-slate-100"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center font-black text-sm w-9 h-9 rounded-full ${getScoreColorClass(
                        op.score
                      )}`}
                    >
                      {op.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <p className="font-bold text-slate-700 text-sm leading-snug truncate">
                      {op.title}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      {op.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] tracking-wide uppercase font-extrabold px-2.5 py-0.5 rounded ${
                        op.impact.toLowerCase() === "high"
                          ? "bg-rose-50 text-rose-600"
                          : op.impact.toLowerCase() === "medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-sky-50 text-sky-600"
                      }`}
                    >
                      {op.impact}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-sm font-bold text-slate-600">
                    {Math.round(op.confidence * 100)}%
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] tracking-wide uppercase font-extrabold px-2.5 py-0.5 rounded ${
                        op.effort.toLowerCase() === "low"
                          ? "bg-emerald-50 text-emerald-600"
                          : op.effort.toLowerCase() === "medium"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {op.effort}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[160px]">
                    <p className="text-xs text-slate-400 line-clamp-2 italic">
                      {op.evidence}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 max-w-[180px]">
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {op.recommendation}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 max-w-[100px]">
                    {op.page_url ? (
                      <a
                        href={op.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-slate-400 font-medium"
                >
                  No opportunities match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400 font-semibold">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
