"use client";

import { Task } from "@/lib/types";
import { CheckCircle, Circle, PlayCircle, Eye, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus?: (taskId: number, status: Task["status"]) => void;
}

const COLUMNS: { id: Task["status"]; label: string; color: string; glow: string }[] = [
  { id: "todo", label: "Todo", color: "text-slate-400 border-slate-800", glow: "shadow-slate-500/5" },
  { id: "in_progress", label: "In Progress", color: "text-cyan-400 border-cyan-900/30 bg-cyan-950/10", glow: "shadow-cyan-500/5" },
  { id: "review", label: "Review", color: "text-violet-400 border-violet-900/30 bg-violet-950/10", glow: "shadow-violet-500/5" },
  { id: "done", label: "Done", color: "text-emerald-400 border-emerald-950/30 bg-emerald-950/10", glow: "shadow-emerald-500/5" }
];

export default function KanbanBoard({ tasks, onUpdateTaskStatus }: KanbanBoardProps) {
  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((t) => t.status === status);
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return <Circle className="w-4 h-4 text-slate-500" />;
      case "in_progress":
        return <PlayCircle className="w-4 h-4 text-cyan-400" />;
      case "review":
        return <Eye className="w-4 h-4 text-violet-400" />;
      case "done":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  const moveNext = (task: Task) => {
    if (!onUpdateTaskStatus) return;
    const flow: Record<Task["status"], Task["status"]> = {
      todo: "in_progress",
      in_progress: "review",
      review: "done",
      done: "todo"
    };
    onUpdateTaskStatus(task.id, flow[task.status]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden p-1">
      {COLUMNS.map((col) => {
        const colTasks = getTasksByStatus(col.id);

        return (
          <div
            key={col.id}
            className={`flex flex-col h-full bg-slate-900/40 border border-slate-800/80 rounded-xl ${col.glow} shadow-xl overflow-hidden`}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <h3 className={`text-xs font-semibold tracking-wider uppercase ${col.color.split(" ")[0]}`}>
                  {col.label}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded-full text-slate-400 font-medium">
                {colTasks.length}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-none">
              {colTasks.length === 0 ? (
                <div className="h-28 border border-dashed border-slate-800/60 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-slate-600 font-medium tracking-wide">Empty Column</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={task.id.toString()}
                    className="p-4 bg-slate-950/60 border border-slate-850 hover:border-slate-700 rounded-lg shadow-md group transition-all duration-300 relative flex flex-col gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-cyan-400 transition-colors">
                          {task.title}
                        </h4>
                        <span className="mt-0.5 shrink-0">{getStatusIcon(task.status)}</span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-850 pt-3 mt-1">
                      {task.assignee_role ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400">
                          @{task.assignee_role}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Unassigned</span>
                      )}

                      {onUpdateTaskStatus && (
                        <button
                          onClick={() => moveNext(task)}
                          className="p-1 rounded bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-500 hover:text-cyan-400 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                        >
                          <span>Progress</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
