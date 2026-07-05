"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsTable from "@/app/components/ResultsTable";
import { AuditResponse } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("auditResult");
    if (stored) {
      setAuditResult(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!auditResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRO Audit Results
          </h1>
          <p className="text-gray-600 mb-4">
            Store: <span className="font-medium">{auditResult.store_url}</span>
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-2">Summary</h2>
            <p className="text-gray-700">{auditResult.summary}</p>
          </div>
        </div>

        <ResultsTable opportunities={auditResult.opportunities} />
      </div>
    </div>
  );
}
