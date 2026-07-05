"use client";

import { AuditResponse, Opportunity } from "@/lib/types";
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react";

interface ExportButtonsProps {
  auditResult: AuditResponse;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function opportunitiesToCSV(opportunities: Opportunity[]): string {
  const headers = [
    "Priority",
    "Title",
    "Category",
    "Impact",
    "Confidence",
    "Effort",
    "Score",
    "Evidence",
    "Recommendation",
    "Page URL",
  ];

  const escape = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;

  const rows = opportunities.map((o, idx) =>
    [
      idx + 1,
      escape(o.title),
      escape(o.category),
      o.impact,
      `${Math.round(o.confidence * 100)}%`,
      o.effort,
      o.score.toFixed(1),
      escape(o.evidence),
      escape(o.recommendation),
      o.page_url || "",
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export default function ExportButtons({ auditResult }: ExportButtonsProps) {
  const storeName = auditResult.store_url
    .replace(/https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleCSV = () => {
    const csv = opportunitiesToCSV(auditResult.opportunities);
    downloadFile(csv, `cro_audit_${storeName}_${dateStr}.csv`, "text/csv");
  };

  const handleJSON = () => {
    const json = JSON.stringify(auditResult, null, 2);
    downloadFile(
      json,
      `cro_audit_${storeName}_${dateStr}.json`,
      "application/json"
    );
  };

  const handlePDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-1">
        <Download className="w-3.5 h-3.5" />
        Export:
      </span>
      <button
        onClick={handlePDF}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition select-none cursor-pointer"
        aria-label="Export as PDF"
      >
        <FileText className="w-3.5 h-3.5" />
        PDF
      </button>
      <button
        onClick={handleCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition select-none cursor-pointer"
        aria-label="Export as CSV"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        CSV
      </button>
      <button
        onClick={handleJSON}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition select-none cursor-pointer"
        aria-label="Export as JSON"
      >
        <FileJson className="w-3.5 h-3.5" />
        JSON
      </button>
    </div>
  );
}
