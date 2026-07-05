import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  CROHealthScore,
  KPISummaryCards,
  PriorityBarChart,
  ImpactDistribution,
  CategoryBreakdown,
  ImpactEffortMatrix,
} from "../app/components/DashboardCharts";
import { Opportunity } from "@/lib/types";

// Mock Recharts
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div data-testid="bar">Bar</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div data-testid="pie">Pie</div>,
  Cell: () => null,
  ScatterChart: ({ children }: any) => <div>{children}</div>,
  Scatter: () => <div data-testid="scatter">Scatter</div>,
  ZAxis: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
  ReferenceArea: () => null,
}));

const mockOpportunities: Opportunity[] = [
  {
    id: "op1",
    title: "Add review stars near prices",
    category: "Trust & Social Proof",
    impact: "High",
    confidence: 0.9,
    effort: "Low",
    score: 8.5,
    evidence: "reviews_count: 0",
    recommendation: "Embed Judge.me anchors.",
    page_url: "https://shop.com/product",
  },
];

describe("Dashboard Charts Components", () => {
  it("renders health score ring successfully", () => {
    render(<CROHealthScore opportunities={mockOpportunities} />);
    expect(screen.getByText(/Overall CRO Health Score/i)).toBeInTheDocument();
  });

  it("renders KPI summary statistics successfully", () => {
    render(<KPISummaryCards opportunities={mockOpportunities} />);
    expect(screen.getByText(/Total Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/High Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Confidence/i)).toBeInTheDocument();
  });

  it("renders top 5 priority horizontal bar chart panel", () => {
    render(<PriorityBarChart opportunities={mockOpportunities} />);
    expect(screen.getByText(/Top 5 Priority Opportunities/i)).toBeInTheDocument();
  });

  it("renders impact donut distribution panel", () => {
    render(<ImpactDistribution opportunities={mockOpportunities} />);
    expect(screen.getByText(/Impact Distribution/i)).toBeInTheDocument();
  });

  it("renders categories breakdown panel", () => {
    render(<CategoryBreakdown opportunities={mockOpportunities} />);
    expect(screen.getByText(/Category Breakdown/i)).toBeInTheDocument();
  });

  it("renders impact vs effort scatter matrix", () => {
    render(<ImpactEffortMatrix opportunities={mockOpportunities} />);
    expect(screen.getByText(/Impact vs Effort Matrix/i)).toBeInTheDocument();
  });
});
