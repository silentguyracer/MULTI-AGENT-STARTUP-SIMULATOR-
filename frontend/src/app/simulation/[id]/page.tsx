"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Task, Document, Simulation } from "@/lib/types";
import ChatPanel from "@/components/ChatPanel";
import KanbanBoard from "@/components/KanbanBoard";
import PitchDeckViewer from "@/components/PitchDeckViewer";
import { ArrowLeft, MessageSquare, Kanban, FileText, Cpu, Coins, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export default function SimulationConsole() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.id as string;

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<"chat" | "kanban" | "artifacts">("chat");
  const [activeSpeaker, setActiveSpeaker] = useState<string>("");
  const [cost, setCost] = useState<number>(0.0);
  const [mounted, setMounted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMounted(true);
    // 1. Fetch baseline data
    fetchBaselineData();

    // 2. Setup WebSockets
    const socket = new WebSocket(`${WS_BASE}/${simulationId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected successfully");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleSocketEvent(payload);
      } catch (err) {
        console.error("Failed to parse websocket event", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [simulationId]);

  const fetchBaselineData = async () => {
    try {
      // Simulation Meta
      const simRes = await fetch(`${API_BASE}/simulations/${simulationId}`);
      if (simRes.ok) {
        const data = await simRes.json();
        setSimulation(data);
      }

      // Messages
      const msgRes = await fetch(`${API_BASE}/simulations/${simulationId}/messages`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data);
        // Calculate dynamic cost based on message count (simulate token tracking)
        setCost(data.length * 0.002);
      }

      // Tasks
      const taskRes = await fetch(`${API_BASE}/tasks/simulation/${simulationId}`);
      if (taskRes.ok) {
        const data = await taskRes.json();
        setTasks(data);
      }

      // Documents
      const docRes = await fetch(`${API_BASE}/simulations/${simulationId}/documents`);
      if (docRes.ok) {
        const data = await docRes.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Error loading baseline simulation data", e);
    }
  };

  const handleSocketEvent = (payload: any) => {
    const { type, data } = payload;
    switch (type) {
      case "message":
        setMessages((prev) => [...prev, data]);
        setActiveSpeaker(data.sender_name);
        // Increment fake token usage / cost tracker
        setCost((prev) => prev + 0.002);
        break;
      case "task_created":
        fetchBaselineData(); // Refresh tasks from backend
        break;
      case "task_updated":
        fetchBaselineData();
        break;
      case "artifact":
        setDocuments((prev) => [
          {
            id: Date.now(),
            title: data.title,
            type: data.type,
            content: data.content,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        break;
    }
  };

  const handleSendMessage = (content: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "human_message",
          content,
        })
      );
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: Task["status"]) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
      </main>
    );
  }

  if (!simulation) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="text-sm font-medium tracking-wide">Syncing simulation feed...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 flex flex-col relative overflow-hidden h-screen">
      {/* Top Banner / Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 border border-slate-800 bg-slate-900/40 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h1 className="text-sm font-bold text-slate-200">{simulation.name}</h1>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 max-w-md truncate">
              {simulation.idea}
            </p>
          </div>
        </div>

        {/* Dashboard status indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg">
            <Coins className="w-4 h-4 text-amber-500" />
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-550 block">Cost Usage</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">${cost.toFixed(3)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-550 block">SIM STATE</span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                {simulation.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-20 border-r border-slate-800/80 bg-slate-950/20 py-6 flex flex-col items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("chat")}
            className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === "chat"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === "kanban"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            }`}
          >
            <Kanban className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Kanban</span>
          </button>
          <button
            onClick={() => setActiveTab("artifacts")}
            className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === "artifacts"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Docs</span>
          </button>
        </aside>

        {/* Tab display panel */}
        <section className="flex-1 p-6 overflow-hidden">
          {activeTab === "chat" && (
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              activeSpeaker={activeSpeaker}
            />
          )}
          {activeTab === "kanban" && (
            <KanbanBoard tasks={tasks} onUpdateTaskStatus={handleUpdateTaskStatus} />
          )}
          {activeTab === "artifacts" && <PitchDeckViewer documents={documents} />}
        </section>
      </div>
    </main>
  );
}
