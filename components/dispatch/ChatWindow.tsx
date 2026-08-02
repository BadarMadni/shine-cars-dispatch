"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft } from "lucide-react";

interface Message {
  id: string; message: string; sender: string; createdAt: string;
}

interface Props {
  driverId: string;
  driverName: string;
  onBack?: () => void;
}

export default function ChatWindow({ driverId, driverName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const load = () => {
    fetch(`/api/chat/messages?driverId=${driverId}`)
      .then((r) => r.json())
      .then((d) => {
        const msgs = d.messages || [];
        setMessages(msgs);
        if (msgs.length !== prevCountRef.current) {
          prevCountRef.current = msgs.length;
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    prevCountRef.current = 0;
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [driverId]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, message: input.trim() }),
    });
    setInput("");
    setSending(false);
    load();
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  let lastDate = "";

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        {onBack && (
          <button onClick={onBack} className="lg:hidden text-navy/40 hover:text-navy cursor-pointer p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-crimson flex items-center justify-center text-white text-sm font-bold">
          {driverName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-navy font-bold text-sm">{driverName}</p>
          <p className="text-navy/30 text-[11px]">Driver</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-navy/20 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : messages.map((m) => {
          const isDispatcher = m.sender === "dispatcher";
          const msgDate = formatDate(m.createdAt);
          let showDate = false;
          if (msgDate !== lastDate) { showDate = true; lastDate = msgDate; }

          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="bg-navy/5 text-navy/30 text-[10px] font-medium px-3 py-1 rounded-full">{msgDate}</span>
                </div>
              )}
              <div className={`flex ${isDispatcher ? "justify-end" : "justify-start"} mb-1`}>
                <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  isDispatcher
                    ? "bg-crimson text-white rounded-br-md"
                    : "bg-white text-navy border border-gray-100 rounded-bl-md shadow-sm"
                }`}>
                  <p>{m.message}</p>
                  <p className={`text-[10px] mt-1 text-right ${isDispatcher ? "text-white/50" : "text-navy/25"}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white px-4 py-3 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <input type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 text-navy text-sm px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-crimson/30 placeholder:text-navy/30" />
          <button onClick={send} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-crimson text-white flex items-center justify-center cursor-pointer hover:bg-crimson/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
