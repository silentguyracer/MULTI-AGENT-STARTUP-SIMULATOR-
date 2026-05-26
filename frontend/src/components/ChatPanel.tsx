"use client";

import { useEffect, useRef, useState } from "react";
import { Message } from "@/lib/types";
import { Bot, Send, Mic, MicOff, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  activeSpeaker?: string;
}

const getAgentColor = (role: string) => {
  switch (role?.toUpperCase()) {
    case "CEO":
      return "text-rose-400 border-rose-500/30 bg-rose-500/10";
    case "CTO":
      return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
    case "PM":
      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "DESIGNER":
      return "text-violet-400 border-violet-500/30 bg-violet-500/10";
    case "MARKETER":
      return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "INVESTOR":
      return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
    case "USER":
      return "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10";
    default:
      return "text-slate-400 border-slate-500/30 bg-slate-500/10";
  }
};

export default function ChatPanel({ messages, onSendMessage, activeSpeaker }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSpeaker]);

  // Voice Interaction setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-200">
            Agent Command Channel
          </h2>
        </div>
        {activeSpeaker && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
            <span className="font-medium text-cyan-400 animate-pulse">{activeSpeaker}</span> is speaking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isUser = msg.sender_role.toLowerCase() === "user";
            const colorClass = getAgentColor(msg.sender_role);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 p-4 rounded-xl border ${
                  isUser ? "bg-slate-950/40 border-fuchsia-500/20" : "bg-slate-950/20 border-slate-800/60"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                      {msg.sender_name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-medium ${colorClass}`}>
                      {msg.sender_role}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-center ${
            isListening
              ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          type="text"
          placeholder={isListening ? "Listening..." : "Provide guidance to the startup agents..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
        />
        <button
          onClick={handleSend}
          className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-500/40 text-slate-100 transition-all duration-300 flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
