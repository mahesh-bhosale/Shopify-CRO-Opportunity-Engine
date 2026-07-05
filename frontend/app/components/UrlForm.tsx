"use client";

import { useState } from "react";

interface UrlFormProps {
  onSubmit: (url: string, competitorUrl?: string) => void;
  isLoading: boolean;
}

export default function UrlForm({ onSubmit, isLoading }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    if (competitorUrl && !validateUrl(competitorUrl)) {
      setError("Please enter a valid competitor URL");
      return;
    }

    onSubmit(url, competitorUrl || undefined);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Store URL *
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-store.myshopify.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="competitorUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Compare against competitor (optional)
          </label>
          <input
            type="url"
            id="competitorUrl"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="https://competitor-store.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            disabled={isLoading}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Running Audit..." : "Run Audit"}
        </button>
      </form>
    </div>
  );
}
