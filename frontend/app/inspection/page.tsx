
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Image as ImageIcon,
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
  Factory,
  LogOut,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const categories = [
  "bottle",
  "cable",
  "capsule",
  "carpet",
  "grid",
  "hazelnut",
  "leather",
  "metal_nut",
  "pill",
  "screw",
  "tile",
  "toothbrush",
  "transistor",
  "wood",
  "zipper",
];

type Analysis = {
  message?: string;
  inspection_id?: number | string;
  category?: string;
  original_filename?: string;
  defect_detection?: Record<string, unknown>;
  defect_classification?: Record<string, unknown>;
  severity_assessment?: Record<string, unknown>;
  quality_result?: Record<string, unknown>;
  [key: string]: unknown;
};

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(2) : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).replaceAll("_", " ");
}

function findValue(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
): unknown {
  if (!data) return undefined;
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) return data[key];
  }
  return undefined;
}

function percentValue(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
}

export default function InspectionPage() {
  const router = useRouter();
  const [category, setCategory] = useState("bottle");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("visioninspect_token")) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(selected: File | null) {
    setError("");
    setResult(null);

    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(selected.type)) {
      setFile(null);
      setError("Please select a JPG, JPEG, or PNG image.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("The image must be 10 MB or smaller.");
      return;
    }
    setFile(selected);
  }

  async function analyzeProduct() {
    if (!file) {
      setError("Please upload a product image first.");
      return;
    }

    const token = localStorage.getItem("visioninspect_token");
    if (!token) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("category", category);
      form.append("file", file);

      const response = await fetch(`${API}/inspection/analyze`, {
        method: "POST",
        headers: {
          Authorization: `${localStorage.getItem("visioninspect_token_type") || "Bearer"} ${token}`,
        },
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("visioninspect_token");
        localStorage.removeItem("visioninspect_token_type");
        localStorage.removeItem("visioninspect_user");
        router.replace("/");
        return;
      }

      if (!response.ok) {
        const detail = data.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg).join(", ")
              : `Inspection failed (${response.status}). Check the backend logs.`
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the inspection service."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetInspection() {
    setFile(null);
    setResult(null);
    setError("");
  }

  const quality = result?.quality_result;
  const classification = result?.defect_classification;
  const severity = result?.severity_assessment;
  const detection = result?.defect_detection;

  const passed = findValue(quality, "is_passed", "passed") === true;
  const decision = findValue(quality, "decision", "status");
  const severityLevel = findValue(severity, "severity_level", "level");
  const defectType = findValue(
    classification,
    "defect_type",
    "class_name",
    "predicted_class"
  ) ?? findValue(quality, "defect_type");

  const confidence = findValue(
    classification,
    "classification_confidence",
    "confidence",
    "confidence_score"
  ) ?? findValue(quality, "confidence_score");

  const severityScore = findValue(severity, "severity_score", "score");

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#123b5a] p-2.5 text-white">
              <Factory size={22} />
            </div>
            <div>
              <p className="font-bold">VisionInspect AI</p>
              <p className="text-xs text-slate-500">Product inspection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("visioninspect_token");
                localStorage.removeItem("visioninspect_token_type");
                localStorage.removeItem("visioninspect_user");
                router.replace("/");
              }}
              aria-label="Sign out"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Quality control / Inspection
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Inspect a product
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Upload a product image and run the configured inspection pipeline
            to receive its analysis, severity assessment, and quality decision.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-semibold">Inspection could not be completed</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <UploadCloud size={23} />
              </div>
              <div>
                <h2 className="font-bold">Upload product image</h2>
                <p className="mt-1 text-sm text-slate-500">
                  JPG or PNG · Maximum 10 MB
                </p>
              </div>
            </div>

            <label htmlFor="category" className="mb-2 block text-sm font-semibold">
              Product category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setResult(null);
                setError("");
              }}
              disabled={loading}
              className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            <label
              htmlFor="product-image"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                chooseFile(e.dataTransfer.files?.[0] || null);
              }}
              className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Selected product preview"
                  className="max-h-72 max-w-full rounded-xl object-contain"
                />
              ) : (
                <>
                  <div className="mb-4 rounded-2xl bg-white p-4 text-blue-700 shadow-sm">
                    <ImageIcon size={31} />
                  </div>
                  <p className="font-semibold">Drop your product image here</p>
                  <p className="mt-2 text-sm text-slate-500">
                    or click to browse your computer
                  </p>
                </>
              )}
              <input
                id="product-image"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                className="sr-only"
                disabled={loading}
                onChange={(e) => chooseFile(e.target.files?.[0] || null)}
              />
            </label>

            {file && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={resetInspection}
                  disabled={loading}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Remove
                </button>
              </div>
            )}

            <button
              onClick={analyzeProduct}
              disabled={!file || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b5a] px-5 py-3.5 font-semibold text-white transition hover:bg-[#0b2c45] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" />
                  Analyzing product…
                </>
              ) : (
                <>
                  <ScanSearch size={19} />
                  Analyze product
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              The image will be sent to your configured backend for analysis.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldCheck size={23} />
              </div>
              <div>
                <h2 className="font-bold">Inspection results</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Results returned by the backend
                </p>
              </div>
            </div>

            {!result && !loading && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center">
                <div className="mb-4 rounded-2xl bg-white p-4 text-slate-400 shadow-sm">
                  <ScanSearch size={32} />
                </div>
                <p className="font-semibold">Waiting for an inspection</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Choose a category, upload an image, and select Analyze product.
                  The result will appear here.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <LoaderCircle className="animate-spin text-blue-700" size={38} />
                <p className="mt-4 font-semibold">Analyzing your image</p>
                <p className="mt-2 text-sm text-slate-500">
                  Running the configured inspection pipeline…
                </p>
              </div>
            )}

            {result && (
              <div>
                <div className={`rounded-2xl border p-5 ${
                  passed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}>
                  <div className="flex items-center gap-3">
                    {passed ? (
                      <CheckCircle2 className="text-emerald-700" size={29} />
                    ) : (
                      <XCircle className="text-amber-700" size={29} />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Quality decision
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">
                        {displayValue(decision ?? (passed ? "PASS" : "REVIEW REQUIRED"))}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {displayValue(findValue(quality, "recommendation", "remarks"))}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Defect type</p>
                    <p className="mt-2 break-words font-semibold">
                      {displayValue(defectType)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Severity level</p>
                    <p className="mt-2 font-semibold">
                      {displayValue(severityLevel)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="mt-2 text-xl font-bold">
                      {percentValue(confidence)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Severity score</p>
                    <p className="mt-2 text-xl font-bold">
                      {displayValue(severityScore)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Inspection details
                  </p>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Inspection ID</dt>
                      <dd className="break-all text-right font-semibold">
                        {displayValue(result.inspection_id)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Category</dt>
                      <dd className="font-semibold">
                        {displayValue(result.category)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Image</dt>
                      <dd className="max-w-48 break-all text-right font-semibold">
                        {displayValue(result.original_filename)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Detection status</dt>
                      <dd className="text-right font-semibold">
                        {displayValue(findValue(detection, "status", "is_anomaly", "anomaly_detected"))}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  onClick={resetInspection}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  <RotateCcw size={17} />
                  Inspect another product
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <ShieldCheck size={19} className="mt-0.5 shrink-0" />
          <p className="leading-6">
            <strong>Quality reminder:</strong> AI predictions are decision-support
            outputs. Validate results against known product defects before using
            them for production or safety-critical decisions.
          </p>
        </div>
      </div>
    </main>
  );
}
