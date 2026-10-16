
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Report = {
  report_title: string;
  summary: {
    total_inspections: number;
    passed_inspections: number;
    failed_inspections: number;
    pass_rate: number;
    defect_rate: number;
    average_confidence: number;
    average_defect_severity: number;
  };
  defect_summary: { defect_type: string; count: number }[];
  severity_summary: { severity_level: string; count: number }[];
  products: {
    product_name: string;
    product_code: string;
    inspection_count: number;
  }[];
  quality_recommendation: string;
};

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/reports/production`);

      if (!response.ok) {
        throw new Error(`Report request failed (${response.status})`);
      }

      const data: Report = await response.json();
      setReport(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the production report."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  const summary = report?.summary;

  const metrics = [
    {
      label: "Total inspections",
      value: summary?.total_inspections ?? 0,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Passed inspections",
      value: summary?.passed_inspections ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Failed inspections",
      value: summary?.failed_inspections ?? 0,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Pass rate",
      value: `${summary?.pass_rate ?? 0}%`,
      icon: ShieldCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <h1 className="text-2xl font-bold">
              Production Quality Report
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manufacturing inspection results and quality analysis
            </p>
          </div>

          <button
            onClick={() => void loadReport()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        {loading && (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
            Loading production report...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">
              Could not load report
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <p className="mt-2 text-sm text-slate-500">
              Confirm that the backend is running on port 8000.
            </p>
            <button
              onClick={() => void loadReport()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && report && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <article
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {metric.label}
                      </p>
                      <span className={`rounded-lg p-2 ${metric.bg}`}>
                        <Icon size={20} className={metric.color} />
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-bold">
                      {metric.value}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Quality performance</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pass and defect rates reported by the backend
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Pass rate</span>
                      <strong>{summary?.pass_rate ?? 0}%</strong>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, summary?.pass_rate ?? 0))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Defect rate</span>
                      <strong>{summary?.defect_rate ?? 0}%</strong>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, summary?.defect_rate ?? 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
                  <div>
                    <p className="text-sm text-slate-500">
                      Average confidence
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {summary?.average_confidence ?? 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      Average defect severity
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {summary?.average_defect_severity ?? 0}/100
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={21} />
                  <h2 className="text-lg font-semibold">
                    Quality recommendation
                  </h2>
                </div>
                <p className="mt-4 leading-7 text-slate-600">
                  {report.quality_recommendation}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Recommendation generated from the current report data.
                </p>
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Defect analysis</h2>
                <p className="mb-5 mt-1 text-sm text-slate-500">
                  Failed inspections grouped by defect type
                </p>

                {report.defect_summary.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No failed defects are recorded.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {report.defect_summary.map((item) => {
                      const maxCount = Math.max(
                        ...report.defect_summary.map((d) => d.count),
                        1
                      );

                      return (
                        <div key={item.defect_type}>
                          <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span className="break-words">
                              {item.defect_type}
                            </span>
                            <strong>{item.count}</strong>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${(item.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold">Severity breakdown</h2>
                <p className="mb-5 mt-1 text-sm text-slate-500">
                  Recorded failed inspections by severity level
                </p>

                {report.severity_summary.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No severity records are available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.severity_summary.map((item) => (
                      <div
                        key={item.severity_level}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                      >
                        <span>{item.severity_level}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold">
                          {item.count} cases
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b p-6">
                <Package size={21} className="text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold">
                    Product inspection summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Inspection counts grouped by product
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Product</th>
                      <th className="px-6 py-3 font-medium">Product code</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Inspections
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.products.map((product) => (
                      <tr key={product.product_code}>
                        <td className="px-6 py-4 font-medium">
                          {product.product_name}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {product.product_code}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {product.inspection_count}
                        </td>
                      </tr>
                    ))}
                    {report.products.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No product inspection data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-xs text-slate-400">
              Report values are loaded from the VisionInspect AI backend.
              Review results before making production decisions.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
