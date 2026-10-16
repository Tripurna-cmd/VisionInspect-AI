
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Factory,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Summary = {
  total_inspections?: number;
  passed_inspections?: number;
  failed_inspections?: number;
  pass_rate?: number;
  defect_rate?: number;
  average_confidence?: number;
  average_defect_severity?: number;
};

type Inspection = Record<string, unknown>;

function formatPercent(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)}%`
    : "—";
}

function formatNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
}

function readText(item: Inspection, ...keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value);
    }
  }
  return "—";
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem("visioninspect_token");

    if (!token) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `${localStorage.getItem("visioninspect_token_type") || "Bearer"} ${token}`,
      };

      const [summaryResponse, recentResponse] = await Promise.all([
        fetch(`${API}/analytics/summary`, { headers }),
        fetch(`${API}/analytics/recent?limit=8`, { headers }),
      ]);

      if (summaryResponse.status === 401 || recentResponse.status === 401) {
        localStorage.removeItem("visioninspect_token");
        localStorage.removeItem("visioninspect_token_type");
        localStorage.removeItem("visioninspect_user");
        router.replace("/");
        return;
      }

      if (!summaryResponse.ok) {
        throw new Error(`Analytics API returned ${summaryResponse.status}.`);
      }

      const summaryData = await summaryResponse.json();
      const recentData = recentResponse.ok
        ? await recentResponse.json()
        : [];

      setSummary(summaryData);
      setRecent(
        Array.isArray(recentData)
          ? recentData
          : Array.isArray(recentData.items)
            ? recentData.items
            : Array.isArray(recentData.inspections)
              ? recentData.inspections
              : []
      );
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function logout() {
    localStorage.removeItem("visioninspect_token");
    localStorage.removeItem("visioninspect_token_type");
    localStorage.removeItem("visioninspect_user");
    router.replace("/");
  }

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("visioninspect_user") || "{}");
    } catch {
      return {};
    }
  })();

  const displayName =
    typeof user.full_name === "string" && user.full_name.trim()
      ? user.full_name
      : typeof user.email === "string"
        ? user.email
        : "Quality team member";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="rounded-xl bg-[#123b5a] p-2.5 text-white">
            <Factory size={23} />
          </div>
          <div>
            <p className="font-bold tracking-tight">VisionInspect AI</p>
            <p className="text-xs text-slate-500">Quality intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-800">
            <LayoutDashboard size={19} />
            Dashboard
          </div>
          <button
            onClick={() => router.push("/inspection")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <ScanSearch size={19} />
            Image inspection
          </button>
          <button
            onClick={() => router.push("/reports")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <FileBarChart size={19} />
            Reports
          </button>
        </nav>

        <div className="m-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={18} className="text-emerald-600" />
            Secure workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Sign out when you finish reviewing inspection results.
          </p>
          <button
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold hover:bg-slate-100"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Quality operations
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-slate-500">
                {user.role || "Workspace member"}
              </p>
            </div>
            <button
              onClick={() => void loadDashboard()}
              disabled={loading}
              aria-label="Refresh dashboard"
              className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={logout}
              aria-label="Sign out"
              className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Quality overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review inspection activity and manufacturing quality outcomes.
              </p>
            </div>
            <button
              onClick={() => router.push("/inspection")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123b5a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b2c45]"
            >
              <ScanSearch size={18} />
              Inspect a product
              <ArrowRight size={17} />
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} />
                Unable to load all dashboard data
              </div>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-xs">
                Confirm the backend is running and your account has permission to access analytics.
              </p>
              <button
                onClick={() => void loadDashboard()}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold"
              >
                Try again
              </button>
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total inspections"
              value={loading && !summary ? "…" : formatNumber(summary?.total_inspections)}
              detail="Inspection records in the database"
              icon={PackageSearch}
              tone="bg-blue-50 text-blue-700"
            />
            <StatCard
              label="Passed inspections"
              value={loading && !summary ? "…" : formatNumber(summary?.passed_inspections)}
              detail="Records marked as passed"
              icon={CheckCircle2}
              tone="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              label="Failed inspections"
              value={loading && !summary ? "…" : formatNumber(summary?.failed_inspections)}
              detail="Records requiring review"
              icon={XCircle}
              tone="bg-rose-50 text-rose-700"
            />
            <StatCard
              label="Pass rate"
              value={loading && !summary ? "…" : formatPercent(summary?.pass_rate)}
              detail="Reported by the backend analytics API"
              icon={TrendingUp}
              tone="bg-violet-50 text-violet-700"
            />
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Activity size={17} />
                Defect rate
              </div>
              <p className="mt-3 text-2xl font-bold">
                {formatPercent(summary?.defect_rate)}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary?.defect_rate || 0))}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck size={17} />
                Average confidence
              </div>
              <p className="mt-3 text-2xl font-bold">
                {formatPercent(
                  summary?.average_confidence === undefined
                    ? undefined
                    : summary.average_confidence <= 1
                      ? summary.average_confidence * 100
                      : summary.average_confidence
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Backend-reported model confidence
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertTriangle size={17} />
                Average defect severity
              </div>
              <p className="mt-3 text-2xl font-bold">
                {formatNumber(summary?.average_defect_severity)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Backend-reported severity score
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h3 className="font-bold">Recent inspections</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Latest records returned by the analytics service.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={15} />
                {updatedAt ? `Updated ${updatedAt}` : "Not yet updated"}
              </div>
            </div>

            {loading && recent.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading inspection records…
              </div>
            ) : recent.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 w-fit rounded-2xl bg-slate-50 p-4 text-slate-500">
                  <PackageSearch size={26} />
                </div>
                <p className="font-semibold">No recent inspections found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Analyze a product image to create your first inspection record.
                </p>
                <button
                  onClick={() => router.push("/inspection")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
                >
                  Start an inspection <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Inspection</th>
                      <th className="px-6 py-4 font-semibold">Product</th>
                      <th className="px-6 py-4 font-semibold">Defect</th>
                      <th className="px-6 py-4 font-semibold">Severity</th>
                      <th className="px-6 py-4 font-semibold">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((item, index) => {
                      const decision = readText(item, "decision", "status", "quality_status");
                      const passed = decision.toLowerCase().includes("pass");
                      return (
                        <tr key={readText(item, "id", "inspection_id") + index} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium">
                            {readText(item, "inspection_id", "id")}
                          </td>
                          <td className="px-6 py-4">
                            {readText(item, "category", "product_name", "product_category")}
                          </td>
                          <td className="px-6 py-4">
                            {readText(item, "defect_type", "defect", "predicted_class")}
                          </td>
                          <td className="px-6 py-4">
                            {readText(item, "severity_level", "risk_level", "severity")}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              passed
                                ? "bg-emerald-50 text-emerald-700"
                                : decision.toLowerCase().includes("fail")
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}>
                              {passed ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {decision}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="mt-6 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:justify-between">
            <span>VisionInspect AI · Manufacturing quality workspace</span>
            <span>AI outputs are decision-support signals and require appropriate validation.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
