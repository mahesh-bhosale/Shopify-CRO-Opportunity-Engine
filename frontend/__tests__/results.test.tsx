import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ResultsPage from "../app/results/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock recharts (to avoid rendering full animated canvas SVGs during test runs)
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => null,
  ScatterChart: ({ children }: any) => <div>{children}</div>,
  Scatter: () => <div>Scatter</div>,
  ZAxis: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
  ReferenceArea: () => null,
}));

describe("Results Page Dashboard", () => {
  beforeEach(() => {
    // Clear sessionStorage mock
    Storage.prototype.getItem = jest.fn();
  });

  it("renders loader state when auditResult is null", () => {
    render(<ResultsPage />);
    expect(screen.getByText(/Loading audit dashboard.../i)).toBeInTheDocument();
  });

  it("renders dashboard content when valid data is retrieved from session storage", () => {
    const mockData = {
      store_url: "https://allbirds.com",
      scraped_pages: ["https://allbirds.com"],
      opportunities: [
        {
          id: "op1",
          title: "Improve cart page CTA",
          category: "Cart",
          impact: "High",
          confidence: 0.9,
          effort: "Low",
          score: 8.5,
          evidence: "No prominent CTA",
          recommendation: "Add primary sticky button",
          page_url: "https://allbirds.com/cart",
        },
      ],
      summary: "Notice: Run in Local Diagnostic Mode. Solid DTC layout, but checkout is missing review anchors.",
      generated_at: "2026-07-05T12:00:00Z",
    };

    Storage.prototype.getItem = jest.fn().mockReturnValue(JSON.stringify(mockData));

    render(<ResultsPage />);

    expect(screen.getByText(/CRO Audit Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/allbirds.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Solid DTC layout, but checkout is missing review anchors/i)).toBeInTheDocument();
  });
});
