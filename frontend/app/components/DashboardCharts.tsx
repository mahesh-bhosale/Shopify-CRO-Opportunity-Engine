"use client";

import { Opportunity } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  CartesianGrid,
  ReferenceArea,
} from "recharts";
import {
  Gauge,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  DollarSign,
  Rocket,
  AlertTriangle,
} from "lucide-react";

// ── Color palette ──
const COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  orange: "#f97316",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Product Page": COLORS.indigo,
  Collection: COLORS.emerald,
  Homepage: COLORS.sky,
  Cart: COLORS.amber,
  "Trust & Social Proof": COLORS.violet,
  Merchandising: COLORS.teal,
  "Mobile UX": COLORS.rose,
  Navigation: COLORS.orange,
  Checkout: COLORS.rose,
  Other: "#94a3b8",
};

const PIE_COLORS = [COLORS.rose, COLORS.amber, COLORS.sky];

// ── Helpers ──
function getImpactRank(impact: string): number {
  switch (impact.toLowerCase()) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function getEffortRank(effort: string): number {
  switch (effort.toLowerCase()) {
    case "low":
      return 1;
    case "medium":
      return 2;
    default:
      return 3;
  }
}

// ══════════════════════════════════════════════════════════════════════
// 1. CRO Health Score
// ══════════════════════════════════════════════════════════════════════

export function CROHealthScore({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const total = opportunities.length;
  if (total === 0)
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm text-center text-slate-400">
        No data
      </div>
    );

  const highCount = opportunities.filter(
    (o) => o.impact.toLowerCase() === "high"
  ).length;
  const medCount = opportunities.filter(
    (o) => o.impact.toLowerCase() === "medium"
  ).length;
  const lowCount = opportunities.filter(
    (o) => o.impact.toLowerCase() === "low"
  ).length;

  // Score = 100 minus weighted penalty for issues found
  // High issues penalize more heavily
  const penalty = highCount * 8 + medCount * 4 + lowCount * 2;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  let color = "text-emerald-600 border-emerald-200 bg-emerald-50";
  let label = "Excellent";
  if (score < 50) {
    color = "text-rose-600 border-rose-200 bg-rose-50";
    label = "Needs Work";
  } else if (score < 70) {
    color = "text-amber-600 border-amber-200 bg-amber-50";
    label = "Fair";
  } else if (score < 90) {
    color = "text-sky-600 border-sky-200 bg-sky-50";
    label = "Good";
  }

  const radius = 54;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = "#10b981";
  if (score < 50) strokeColor = "#f43f5e";
  else if (score < 70) strokeColor = "#f59e0b";
  else if (score < 90) strokeColor = "#0ea5e9";

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Gauge className="w-5 h-5 text-indigo-500" />
        <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">
          Overall CRO Health Score
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circular gauge */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={stroke}
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-800">{score}</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${color}`}
          >
            {label}
          </span>
          <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
            Based on {total} identified opportunities. Higher scores indicate
            fewer critical CRO issues.
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 2. KPI Summary Cards
// ══════════════════════════════════════════════════════════════════════

export function KPISummaryCards({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const total = opportunities.length;
  const highImpact = opportunities.filter(
    (o) => o.impact.toLowerCase() === "high"
  ).length;
  const avgConfidence =
    total > 0
      ? opportunities.reduce((s, o) => s + o.confidence, 0) / total
      : 0;
  const avgScore =
    total > 0 ? opportunities.reduce((s, o) => s + o.score, 0) / total : 0;

  // Estimated revenue lift heuristic
  const revLift = opportunities.reduce((sum, o) => {
    const imp = o.impact.toLowerCase();
    if (imp === "high") return sum + 6.5;
    if (imp === "medium") return sum + 3;
    return sum + 1.5;
  }, 0);

  const quickWins = opportunities.filter(
    (o) =>
      o.impact.toLowerCase() === "high" && o.effort.toLowerCase() === "low"
  ).length;

  const highEffort = opportunities.filter(
    (o) => o.effort.toLowerCase() === "high"
  ).length;

  // CRO Health Score (same logic as CROHealthScore)
  const penalty = highImpact * 8 + opportunities.filter(o => o.impact.toLowerCase() === "medium").length * 4 + opportunities.filter(o => o.impact.toLowerCase() === "low").length * 2;
  const croScore = Math.max(0, Math.min(100, 100 - penalty));

  const cards = [
    {
      label: "CRO Score",
      value: `${croScore}`,
      sub: "/ 100",
      icon: Gauge,
      color: "text-indigo-600",
    },
    {
      label: "Total Opportunities",
      value: `${total}`,
      sub: "actionable",
      icon: Target,
      color: "text-sky-600",
    },
    {
      label: "High Impact",
      value: `${highImpact}`,
      sub: "prioritized",
      icon: Zap,
      color: "text-rose-600",
    },
    {
      label: "Avg Confidence",
      value: `${Math.round(avgConfidence * 100)}%`,
      sub: "data-backed",
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      label: "Avg Priority",
      value: avgScore.toFixed(1),
      sub: "ICE score",
      icon: BarChart3,
      color: "text-violet-600",
    },
    {
      label: "Est. Revenue Lift",
      value: `${revLift.toFixed(0)}%`,
      sub: "potential",
      icon: DollarSign,
      color: "text-amber-600",
    },
    {
      label: "Quick Wins",
      value: `${quickWins}`,
      sub: "high impact, low effort",
      icon: Rocket,
      color: "text-teal-600",
    },
    {
      label: "High Effort",
      value: `${highEffort}`,
      sub: "require investment",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-1 hover:shadow-md hover:border-slate-200 transition-all duration-200"
        >
          <div className="flex items-center gap-1.5">
            <c.icon className={`w-4 h-4 ${c.color}`} />
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {c.label}
            </p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${c.color}`}>{c.value}</span>
            <span className="text-xs text-slate-400 font-bold">{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 3. Priority Bar Chart (Top 5)
// ══════════════════════════════════════════════════════════════════════

export function PriorityBarChart({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const top5 = [...opportunities]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .reverse();

  const data = top5.map((o) => ({
    name: o.title.length > 30 ? o.title.slice(0, 30) + "\u2026" : o.title,
    fullTitle: o.title,
    score: o.score,
    category: o.category,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm animate-slide-up">
      <h3 className="font-extrabold text-slate-800 text-base mb-4 tracking-tight">
        Top 5 Priority Opportunities
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any, _name: any, props: any) => [
              `${Number(value).toFixed(1)}`,
              `Score — ${props.payload?.fullTitle || ""}`,
            ]}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={CATEGORY_COLORS[entry.category] || COLORS.indigo}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 4. Impact Distribution (Donut)
// ══════════════════════════════════════════════════════════════════════

export function ImpactDistribution({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const high = opportunities.filter(
    (o) => o.impact.toLowerCase() === "high"
  ).length;
  const medium = opportunities.filter(
    (o) => o.impact.toLowerCase() === "medium"
  ).length;
  const low = opportunities.filter(
    (o) => o.impact.toLowerCase() === "low"
  ).length;

  const data = [
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm animate-slide-up">
      <h3 className="font-extrabold text-slate-800 text-base mb-4 tracking-tight">
        Impact Distribution
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_entry, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any) => [`${value} opportunities`]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 5. Category Breakdown (Vertical Bar)
// ══════════════════════════════════════════════════════════════════════

export function CategoryBreakdown({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const categoryMap: Record<string, number> = {};
  opportunities.forEach((o) => {
    const cat = o.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const data = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm animate-slide-up">
      <h3 className="font-extrabold text-slate-800 text-base mb-4 tracking-tight">
        Category Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#64748b" }}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: any) => [`${value} opportunities`]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={CATEGORY_COLORS[entry.name] || COLORS.indigo}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// 6. Impact vs Effort Matrix (Scatter)
// ══════════════════════════════════════════════════════════════════════

export function ImpactEffortMatrix({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const data = opportunities.map((o) => ({
    x: getEffortRank(o.effort),
    y: getImpactRank(o.impact),
    z: o.score * 20, // bubble size
    title: o.title,
    impact: o.impact,
    effort: o.effort,
    confidence: o.confidence,
    score: o.score,
    category: o.category,
    fill: CATEGORY_COLORS[o.category] || COLORS.indigo,
  }));

  const effortLabels: Record<number, string> = {
    1: "Low",
    2: "Medium",
    3: "High",
  };
  const impactLabels: Record<number, string> = {
    1: "Low",
    2: "Medium",
    3: "High",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
          Impact vs Effort Matrix
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
          ★ Quick Wins = Top-Left
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          {/* Quick-win highlight zone */}
          <ReferenceArea
            x1={0.5}
            x2={1.5}
            y1={2.5}
            y2={3.5}
            fill="#10b981"
            fillOpacity={0.06}
            stroke="#10b981"
            strokeOpacity={0.15}
            strokeDasharray="4 4"
          />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0.5, 3.5]}
            ticks={[1, 2, 3]}
            tickFormatter={(v: number) => effortLabels[v] || ""}
            label={{
              value: "Implementation Effort →",
              position: "bottom",
              fontSize: 11,
              fill: "#94a3b8",
            }}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0.5, 3.5]}
            ticks={[1, 2, 3]}
            tickFormatter={(v: number) => impactLabels[v] || ""}
            label={{
              value: "Business Impact →",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
              fill: "#94a3b8",
              dx: -5,
            }}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <ZAxis type="number" dataKey="z" range={[60, 300]} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
              maxWidth: 280,
            }}
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-1 max-w-[260px]">
                  <p className="font-bold text-slate-800 text-sm leading-snug">
                    {d.title}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-500">
                    <span>Impact: <b className="text-slate-700">{d.impact}</b></span>
                    <span>Effort: <b className="text-slate-700">{d.effort}</b></span>
                    <span>Confidence: <b className="text-slate-700">{Math.round(d.confidence * 100)}%</b></span>
                    <span>Score: <b className="text-slate-700">{d.score.toFixed(1)}</b></span>
                  </div>
                  <p className="text-[10px] text-indigo-500 font-bold">
                    {d.category}
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="top"
            content={() => null} // Categories visible in tooltip
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
