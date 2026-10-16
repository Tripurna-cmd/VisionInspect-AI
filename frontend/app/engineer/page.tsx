
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Row = Record<string, number | string | null | undefined>;
type Summary = Record<string, number | string | null | undefined>;

function getNumber(data: Summary, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }
  return 0;
}

function getText(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return "—";
}

function getRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];

  if (data && typeof data === "object") {
    const object = data as Record<string, unknown>;
    for (const key of ["items", "results", "inspections", "data", "recent"]) {
      if (Array.isArray(object[key])) return object[key] as Row[];
    }
  }
  return [];
}

export default function EngineerPage() {
  const router = useRouter();

  const [user, setUser] = useState<Row>({});
  const [summary, setSummary] = useState<Summary>({});
  const [defects, setDefects] = useState<Row[]>([]);
  const [severity, setSeverity] = useState<Row[]>([]);
  const [recent, setRecent] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("visioninspect_user");
      if (saved) setUser(JSON.parse(saved));
    } catch {
      setUser({});
    }
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("visioninspect_token");
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    async function request(path: string): Promise<unknown> {
      const response = await fetch(`${API_URL}${path}`, { headers });
      if (!response.ok) {
        throw new Error(`${path} returned HTTP ${response.status}`);
      }
      return response.json();
    }

    try {
      const [summaryData, defectData, severityData, recentData] =
        await Promise.all([
          request("/analytics/summary"),
          request("/analytics/defects"),
          request("/analytics/severity"),
          request("/analytics/recent?limit=10"),
        ]);

      const summaryObject = summaryData as Record<string, unknown>;
      setSummary(
        (summaryObject.summary ?? summaryData) as Summary
      );
      setDefects(getRows(defectData));
      setSeverity(getRows(severityData));
      setRecent(getRows(recentData));
      setUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function logout() {
    localStorage.removeItem("visioninspect_token");
    localStorage.removeItem("visioninspect_token_type");
    localStorage.removeItem("visioninspect_user");
    router.replace("/");
  }

  const total = getNumber(summary, [
    "total_inspections",
    "total",
    "inspection_count",
  ]);
  const passed = getNumber(summary, [
    "passed_inspections",
    "passed",
    "pass_count",
  ]);
  const failed = getNumber(summary, [
    "failed_inspections",
    "failed",
    "fail_count",
  ]);
  const passRate = getNumber(summary, ["pass_rate"]);
  const defectRate = getNumber(summary, ["defect_rate"]);

  const name = getText(user, ["full_name", "name", "email"]);
  const email = getText(user, ["email"]);

  const nav = [
    { label: "Dashboard", href: "/engineer", icon: LayoutDashboard },
    { label: "Image Inspection", href: "/inspection", icon: ScanSearch },
    { label: "Inspection History", href: "#history", icon: ClipboardCheck },
    { label: "Quality Analytics", href: "#analytics", icon: BarChart3 },
    { label: "Quality Reports", href: "/reports", icon: FileText },
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
              <p className="text-xs text-slate-500">Quality inspection</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Quality Engineer
            </p>
            <p className="mt-2 font-semibold">{name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">{email}</p>
          </div>

          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            {nav.map((item, index) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                    index === 0
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-500">
                VisionInspect AI / Quality Engineer
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Quality inspection workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Inspect products, investigate defects, and review quality
                results.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={logout}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700 lg:hidden"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Analytics could not be loaded.</strong>
                <p className="mt-1">{error}</p>
                <p className="mt-1">
                  Confirm that the backend is running, then select Refresh.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Inspection performance</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Summary of recorded inspections
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {updated ? `Updated ${updated}` : "Loading data"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total inspections",
                  value: total,
                  icon: ClipboardCheck,
                  style: "bg-blue-50 text-blue-700",
                },
                {
                  label: "Passed inspections",
                  value: passed,
                  icon: CheckCircle2,
                  style: "bg-green-50 text-green-700",
                },
                {
                  label: "Failed inspections",
                  value: failed,
                  icon: XCircle,
                  style: "bg-red-50 text-red-700",
                },
                {
                  label: "Pass rate",
                  value: `${passRate}%`,
                  icon: Activity,
                  style: "bg-violet-50 text-violet-700",
                },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <article
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-500">{metric.label}</p>
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

            <section className="rounded-xl border border-blue-200 bg-blue-600 p-6 text-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="max-w-xl">
                  <p className="text-sm font-medium text-blue-100">
                    Inspection tool
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">
                    Analyze a product image
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    Upload a product image through the existing inspection
                    workflow to review defect predictions, confidence,
                    severity, and the quality decision returned by the backend.
                  </p>
                </div>
                <Link
                  href="/inspection"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <ScanSearch size={18} />
                  Open inspection
                </Link>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-5">
              <section
                id="history"
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Recent inspection records
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Latest results available from the backend
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
                        const status = getText(row, [
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
                                {getText(row, [
                                  "product_name",
                                  "product",
                                  "category",
                                  "product_code",
                                ])}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {getText(row, [
                                  "created_at",
                                  "inspection_date",
                                  "date",
                                ])}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-slate-600">
                              {getText(row, [
                                "defect_type",
                                "defect",
                                "predicted_class",
                              ])}
                            </td>
                            <td className="px-3 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                            No recent inspection records returned.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                id="analytics"
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
              >
                <h3 className="text-lg font-semibold">Severity analysis</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Severity groups reported by the analytics API
                </p>

                {severity.length ? (
                  <div className="mt-5 space-y-4">
                    {severity.map((item, index) => {
                      const level = getText(item, [
                        "severity_level",
                        "severity",
                        "level",
                      ]);
                      const count = getNumber(item, [
                        "count",
                        "total",
                        "value",
                      ]);
                      const critical = /critical|high/i.test(level);
                      return (
                        <div
                          key={String(item.severity_level ?? item.level ?? index)}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-lg p-2 ${
                                critical
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              <AlertTriangle size={18} />
                            </span>
                            <span className="text-sm font-medium">{level}</span>
                          </div>
                          <strong>{count}</strong>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No severity data available.
                  </p>
                )}

                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Reported defect rate</p>
                  <p className="mt-1 text-2xl font-bold">
                    {loading ? "—" : `${defectRate}%`}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Investigate repeated or severe defects before approving
                    affected products.
                  </p>
                </div>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={23} />
                <div>
                  <h3 className="font-semibold">Defect category analysis</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Categories and counts returned by the backend
                  </p>
                </div>
              </div>

              {defects.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {defects.map((item, index) => (
                    <article
                      key={String(item.defect_type ?? item.name ?? index)}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-sm text-slate-500">
                        {getText(item, [
                          "defect_type",
                          "name",
                          "defect",
                          "category",
                        ])}
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {getNumber(item, ["count", "total", "value"])}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Recorded occurrences
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No defect category breakdown returned.
                </p>
              )}

              <div className="mt-5">
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
                >
                  <FileText size={17} />
                  Open quality reports
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <UserRound className="text-blue-600" size={23} />
                <div>
                  <h3 className="font-semibold">My account</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your signed-in account details
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
                  <p className="mt-1 font-medium">Quality Engineer</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </section>

            <p className="text-xs leading-5 text-slate-400">
              Review AI predictions alongside the inspection evidence and
              applicable quality standards. Dashboard summaries reflect the
              backend data available at the time of loading.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
