"use client";

import { useEffect, useState } from "react";
import { Document } from "@/lib/types";
import { FileText, Code, BarChart, Presentation, Calendar } from "lucide-react";

interface PitchDeckViewerProps {
  documents: Document[];
}

export default function PitchDeckViewer({ documents }: PitchDeckViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDocIcon = (type: Document["type"]) => {
    switch (type) {
      case "pitch_deck":
        return <Presentation className="w-4 h-4 text-rose-400" />;
      case "market_research":
        return <BarChart className="w-4 h-4 text-emerald-400" />;
      case "code":
        return <Code className="w-4 h-4 text-cyan-400" />;
      case "design":
        return <FileText className="w-4 h-4 text-violet-400" />;
    }
  };

  const activeDoc = selectedDoc || documents[0];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-xl overflow-hidden">
      {/* Sidebar List + Reader Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document list */}
        <div className="w-72 border-r border-slate-800/80 bg-slate-950/20 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold tracking-wider text-slate-550 uppercase px-2 mb-3">
            Startup Artifacts
          </h3>
          {documents.length === 0 ? (
            <div className="text-xs text-slate-650 px-2 py-4 italic">
              No artifacts generated yet.
            </div>
          ) : (
            documents.map((doc) => {
              const isActive = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-300 ${
                    isActive
                      ? "bg-slate-900 border-slate-700 text-slate-200"
                      : "bg-transparent border-transparent hover:bg-slate-900/30 text-slate-400 hover:text-slate-350"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">{getDocIcon(doc.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium truncate">{doc.title}</h4>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-550 block mt-1">
                      {doc.type.replace("_", " ")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Reader pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/10">
          {activeDoc ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Doc header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">{activeDoc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {mounted && activeDoc.created_at ? new Date(activeDoc.created_at).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doc content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <pre className="text-xs font-mono leading-relaxed text-slate-300 bg-slate-950/40 p-4 border border-slate-850 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {activeDoc.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-slate-600 gap-2 p-6">
              <FileText className="w-12 h-12 text-slate-800 animate-pulse" />
              <span className="text-xs font-medium tracking-wide">Select an artifact to view details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
