"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UrlForm from "@/app/components/UrlForm";
import { runAudit } from "@/lib/api";
import { AuditResponse } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuditSubmit = async (url: string, competitorUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result: AuditResponse = await runAudit(url, competitorUrl);
      sessionStorage.setItem("auditResult", JSON.stringify(result));
      router.push("/results");
    } catch (err) {
      setError("Failed to run audit. Please check the URL and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Shopify CRO Opportunity Engine
          </h1>
          <p className="text-lg text-gray-600">
            Enter a Shopify store URL. Get a prioritized, evidence-based CRO audit in seconds.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <UrlForm onSubmit={handleAuditSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
