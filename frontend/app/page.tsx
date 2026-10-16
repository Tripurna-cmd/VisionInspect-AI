
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  ShieldCheck,
  Factory,
  ScanSearch,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type UserData = {
  id?: number;
  email: string;
  full_name?: string;
  role_id?: number;
  role?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("2");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/auth/login" : "/auth/register";

      const body =
        mode === "login"
          ? { email, password }
          : {
              full_name: fullName.trim(),
              email,
              password,
              role_id: Number(roleId),
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = data.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item: { msg?: string }) => item.msg).join(", ")
              : "Request failed. Check your details and try again."
        );
      }

      if (mode === "register") {
        setMode("login");
        setPassword("");
        setError("");
        alert("Account created. Please sign in.");
        return;
      }

      const token = data.access_token || data.token;
      if (!token) {
        throw new Error("The server did not return an access token.");
      }

      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `${data.token_type || "Bearer"} ${token}`,
        },
      });

      let user: UserData = { email };
      if (userResponse.ok) {
        user = { ...user, ...(await userResponse.json()) };
      }

      localStorage.setItem("visioninspect_token", token);
      localStorage.setItem(
        "visioninspect_token_type",
        data.token_type || "Bearer"
      );
      localStorage.setItem("visioninspect_user", JSON.stringify(user));

      const role = String(user.role || "").toLowerCase();
      if (role.includes("supervisor") || user.role_id === 3) {
        router.push("/supervisor");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#102b43] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="rounded-xl bg-cyan-400 p-2.5 text-slate-950">
            <Eye size={25} />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">VisionInspect AI</p>
            <p className="text-xs text-slate-300">Intelligent quality inspection</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            AI-ASSISTED MANUFACTURING
          </span>
          <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
            Quality you can see.
            <br />
            <span className="text-cyan-300">Confidence you can measure.</span>
          </h1>
          <p className="mt-6 max-w-lg leading-7 text-slate-300">
            Inspect product images, identify potential defects, assess
            severity, and track quality outcomes from one workspace.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ScanSearch className="mb-3 text-cyan-300" size={24} />
              <p className="font-semibold">Visual inspection</p>
              <p className="mt-1 text-sm text-slate-300">
                Analyze submitted product images.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="mb-3 text-cyan-300" size={24} />
              <p className="font-semibold">Quality decisions</p>
              <p className="mt-1 text-sm text-slate-300">
                Review inspection results and severity.
              </p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          Manufacturing Defect Detection &amp; Quality Inspection System
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-[#102b43] p-2.5 text-white">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">VisionInspect AI</p>
              <p className="text-xs text-slate-500">Quality inspection platform</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
              <Factory size={26} />
            </div>
            <p className="text-sm font-semibold text-blue-700">
              MANUFACTURING QUALITY PLATFORM
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Sign in to access your inspection workspace."
                : "Register as a quality engineer or factory supervisor."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
                  Full name
                </label>
                <input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {mode === "register" && (
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium">
                  Workspace role
                </label>
                <select
                  id="role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="2">Quality Engineer</option>
                  <option value="3">Factory Supervisor</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b5a] px-4 py-3.5 font-semibold text-white transition hover:bg-[#0b2c45] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" size={19} />
                  Please wait...
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in to workspace" : "Create account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-500">
            Authorized users only. Inspection results should be reviewed by
            qualified personnel before production decisions are made.
          </p>
        </div>
      </section>
    </main>
  );
}
