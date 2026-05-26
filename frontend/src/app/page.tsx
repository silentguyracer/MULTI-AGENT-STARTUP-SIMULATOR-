"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Simulation } from "@/lib/types";
import { Play, Plus, Cpu, Rocket, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Dashboard() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // New Simulation State
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load user session on mount
  useEffect(() => {
    setMounted(true);
    const cachedUserId = localStorage.getItem("user_id");
    if (cachedUserId) {
      setUserId(parseInt(cachedUserId));
      fetchSimulations(parseInt(cachedUserId));
    }
  }, []);

  const fetchSimulations = async (uid: number) => {
    try {
      const res = await fetch(`${API_BASE}/simulations/user/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setSimulations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegistering ? "/users/register" : "/users/login";
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("user_id", data.id.toString());
        setUserId(data.id);
        fetchSimulations(data.id);
      } else {
        alert("Authentication failed.");
      }
    } catch (e) {
      alert("Error connecting to server.");
    }
  };

  const handleCreateSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !name || !idea) return;
    setIsCreating(true);

    try {
      const res = await fetch(`${API_BASE}/simulations/?user_id=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, idea }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/simulation/${data.id}`);
      } else {
        alert("Failed to initialize simulator.");
      }
    } catch (e) {
      alert("Connection error.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    setUserId(null);
    setSimulations([]);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">
        <Cpu className="w-5 h-5 animate-spin text-cyan-400" />
      </main>
    );
  }

  // Auth Screen
  if (!userId) {
    return (
      <main className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />

        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl p-8 relative shadow-2xl z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center mb-3">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-200">
              Antigravity AI Startup OS
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-Agent Collaborative Sandbox
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-100 font-medium py-2.5 rounded-lg border border-cyan-500/30 transition-all cursor-pointer text-sm"
            >
              {isRegistering ? "Create Simulator Account" : "Access Sandbox Console"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isRegistering
                ? "Already have access? Sign In"
                : "Need console credentials? Register here"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard Screen
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Console Control Center</h1>
              <p className="text-xs text-slate-500">Launch and manage your simulated enterprises</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors border border-slate-800 hover:border-rose-950 px-4 py-2 rounded-lg bg-slate-900/40"
          >
            Disconnect Terminal
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* New Simulation Creator */}
          <div className="lg:col-span-1 bg-slate-900/55 border border-slate-800 rounded-xl p-6 backdrop-blur-xl flex flex-col gap-5 h-fit shadow-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Initialize Enterprise
              </h2>
            </div>
            <form onSubmit={handleCreateSimulation} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Enterprise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthflow AI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Startup Vision (Prompt)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Build an autonomous agent system for scheduling medical appointments and doing automatic follow-ups..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50 text-slate-200 resize-none leading-relaxed"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-850 disabled:border-slate-800 text-slate-100 font-medium py-2.5 rounded-lg border border-cyan-500/30 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                {isCreating ? "Booting Agents..." : "Launch Simulator"}
              </button>
            </form>
          </div>

          {/* Active Simulations List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Simulations
            </h2>
            {simulations.length === 0 ? (
              <div className="h-64 border border-dashed border-slate-800 rounded-xl flex items-center justify-center flex-col text-slate-650 gap-2">
                <Cpu className="w-8 h-8 text-slate-800 animate-pulse" />
                <span className="text-xs font-medium tracking-wide">No active simulations deployed.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulations.map((sim) => (
                  <motion.div
                    key={sim.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-5 bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-xl flex flex-col gap-4 shadow-lg transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-200 truncate pr-2">
                          {sim.name}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/30 text-cyan-400">
                          {sim.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                        {sim.idea}
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/simulation/${sim.id}`)}
                      className="w-full mt-1 bg-slate-950 border border-slate-850 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-slate-100 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      Resume Control Console
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
