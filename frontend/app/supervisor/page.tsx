
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Summary = Record<string, number | string | null | undefined>;

type ApiData = {
  summary?: Summary;
  [key: string]: unknown;
};

type InspectionRow = Record<string, unknown>;

function firstNumber(data: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }
  return 0;
}

function firstText(row: InspectionRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return "—";
}

function rowsFrom(data: unknown): InspectionRow[] {
  if (Array.isArray(data)) return data as InspectionRow[];

  if (data && typeof data === "object") {
    const object = data as Record<string, unknown>;
    for (const key of ["items", "results", "inspections", "data", "recent"]) {
      if (Array.isArray(object[key])) {
        return object[key] as InspectionRow[];
      }
    }
  }

  return [];
}

export default function SupervisorPage() {
  const router = useRouter();

  const [summary, setSummary] = useState<Summary>({});
  const [defects, setDefects] = useState<InspectionRow[]>([]);
  const [severity, setSeverity] = useState<InspectionRow[]>([]);
  const [recent, setRecent] = useState<InspectionRow[]>([]);
  const [user, setUser] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("visioninspect_user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {
      setUser({});
    }
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("visioninspect_token")
        : null;

    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    async function getJson(path: string): Promise<unknown> {
      const response = await fetch(`${API_URL}${path}`, { headers });
      if (!response.ok) {
        throw new Error(`${path} returned HTTP ${response.status}`);
      }
      return response.json();
    }

    try {
      const [summaryData, defectData, severityData, recentData] =
        await Promise.all([
          getJson("/analytics/summary"),
          getJson("/analytics/defects"),
          getJson("/analytics/severity"),
          getJson("/analytics/recent?limit=8"),
        ]);

      const summaryObject = summaryData as ApiData;
      setSummary(summaryObject.summary ?? (summaryData as Summary));
      setDefects(rowsFrom(defectData));
      setSeverity(rowsFrom(severityData));
      setRecent(rowsFrom(recentData));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("visioninspect_token");
    localStorage.removeItem("visioninspect_token_type");
    localStorage.removeItem("visioninspect_user");
    router.replace("/");
  }

  const total = firstNumber(summary, [
    "total_inspections",
    "total",
    "inspection_count",
  ]);
  const passed = firstNumber(summary, [
    "passed_inspections",
    "passed",
    "pass_count",
  ]);
  const failed = firstNumber(summary, [
    "failed_inspections",
    "failed",
    "fail_count",
    "defects",
  ]);
  const passRate = firstNumber(summary, ["pass_rate"]);
  const defectRate = firstNumber(summary, ["defect_rate"]);

  const name = firstText(user, ["full_name", "name", "email"]);
  const email = firstText(user, ["email"]);

  const navigation = [
    { label: "Dashboard", href: "/supervisor", icon: LayoutDashboard },
    { label: "Inspection History", href: "/inspection", icon: ClipboardCheck },
    { label: "Quality Analytics", href: "/dashboard", icon: BarChart3 },
    { label: "Report Analysis", href: "/reports", icon: FileText },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-bold">VisionInspect AI</h1>
              <p className="text-xs text-slate-500">Quality platform</p>
            </div>
          </div>

          <div className="mt-9 rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Signed in as
            </p>
            <p className="mt-2 font-semibold">{name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">{email}</p>
            <p className="mt-3 text-xs font-medium text-blue-700">
              Factory Supervisor
            </p>
          </div>

          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    index === 0
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">
                Manufacturing quality / Supervisor
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Production overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monitor inspection outcomes and production quality.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadDashboard()}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 lg:hidden"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Unable to load all dashboard data.</strong>
                <p className="mt-1">{error}</p>
                <p className="mt-1">
                  Check that the backend is running and the API response is
                  available. The dashboard can be refreshed after fixing it.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">Quality at a glance</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Metrics supplied by the analytics API
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {lastUpdated ? `Updated ${lastUpdated}` : "Waiting for data"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Total inspections",
                  value: total,
                  icon: Package,
                  style: "bg-blue-50 text-blue-700",
                },
                {
                  title: "Passed products",
                  value: passed,
                  icon: CheckCircle2,
                  style: "bg-green-50 text-green-700",
                },
                {
                  title: "Failed inspections",
                  value: failed,
                  icon: XCircle,
                  style: "bg-red-50 text-red-700",
                },
                {
                  title: "Pass rate",
                  value: `${passRate}%`,
                  icon: Activity,
                  style: "bg-violet-50 text-violet-700",
                },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.title}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{metric.title}</p>
                      <span className={`rounded-lg p-2 ${metric.style}`}>
                        <Icon size={20} />
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-bold">
                      {loading ? "—" : metric.value}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Recent inspections
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest records returned by the backend
                    </p>
                  </div>
                  <ClipboardCheck className="text-blue-600" size={22} />
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-medium">Product</th>
                        <th className="px-3 py-3 font-medium">Defect</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recent.map((row, index) => {
                        const status = firstText(row, [
                          "status",
                          "quality_status",
                          "result",
                        ]);
                        const isPass = /pass|good|accepted/i.test(status);
                        const isFail = /fail|defect|rejected/i.test(status);

                        return (
                          <tr key={String(row.id ?? index)}>
                            <td className="px-3 py-4">
                              <p className="font-medium">
                                {firstText(row, [
                                  "product_name",
                                  "product",
                                  "category",
                                  "product_code",
                                ])}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {firstText(row, [
                                  "created_at",
                                  "inspection_date",
                                  "date",
                                ])}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-slate-600">
                              {firstText(row, [
                                "defect_type",
                                "defect",
                                "predicted_class",
                              ])}
                            </td>
                            <td className="px-3 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isPass
                                    ? "bg-green-50 text-green-700"
                                    : isFail
                                      ? "bg-red-50 text-red-700"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!loading && recent.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-8 text-center text-slate-500"
                          >
                            No recent inspection rows were returned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                <h3 className="text-lg font-semibold">Quality alerts</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Based on current reported quality metrics
                </p>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle size={20} />
                    <strong className="text-sm">Defect rate</strong>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-amber-900">
                    {loading ? "—" : `${defectRate}%`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    {defectRate >= 50
                      ? "The reported defect rate is elevated. Review failed products and investigate recurring causes."
                      : "Review quality trends regularly and investigate any repeated defects."}
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-blue-600" />
                    <strong className="text-sm">Severity overview</strong>
                  </div>
                  {severity.length ? (
                    <div className="mt-3 space-y-2">
                      {severity.slice(0, 4).map((item, index) => (
                        <div
                          key={String(
                            item.severity_level ?? item.severity ?? index
                          )}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span className="text-slate-600">
                            {firstText(item, [
                              "severity_level",
                              "severity",
                              "level",
                            ])}
                          </span>
                          <strong>
                            {firstText(item, ["count", "total", "value"])}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No severity breakdown returned.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Defect categories
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Most recently reported defect groups
                    </p>
                  </div>
                  <BarChart3 size={22} className="text-blue-600" />
                </div>

                {defects.length ? (
                  <div className="mt-5 space-y-4">
                    {defects.slice(0, 6).map((item, index) => {
                      const count = firstNumber(item, ["count", "total", "value"]);
                      const max = Math.max(
                        ...defects.map((d) =>
                          firstNumber(d, ["count", "total", "value"])
                        ),
                        1
                      );
                      return (
                        <div key={String(item.defect_type ?? item.name ?? index)}>
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span>
                              {firstText(item, [
                                "defect_type",
                                "name",
                                "defect",
                                "category",
                              ])}
                            </span>
                            <strong>{count}</strong>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${(count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No defect categories returned by the API.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Supervisor actions</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Quick access to quality monitoring tasks
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/reports"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="text-blue-600" size={22} />
                    <p className="mt-3 font-semibold">Report analysis</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Review quality performance
                    </p>
                  </Link>
                  <Link
                    href="/inspection"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <ClipboardCheck className="text-blue-600" size={22} />
                    <p className="mt-3 font-semibold">Inspect product</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Open the inspection workspace
                    </p>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 sm:col-span-2"
                  >
                    <BarChart3 className="text-blue-600" size={22} />
                    <p className="mt-3 font-semibold">Analytics dashboard</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Explore the existing analytics page
                    </p>
                  </Link>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-slate-100 p-3">
                  <UserRound size={22} className="text-slate-700" />
                </span>
                <div>
                  <h3 className="font-semibold">My account</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Signed-in supervisor details
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="mt-1 font-medium">{name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 break-all font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="mt-1 font-medium">Factory Supervisor</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </section>

            <p className="text-xs leading-5 text-slate-400">
              Dashboard information is retrieved from the configured backend.
              AI predictions and quality metrics should be reviewed before
              making production decisions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
