"use client";

import { useState, useEffect } from "react";
import { Search, MessageCircle, Circle } from "lucide-react";

interface Driver { id: string; name: string; phone: string; isAvailable: boolean }
interface LastMessage { message: string; sender: string; createdAt: string }
interface Conversation { driver: Driver; lastMessage: LastMessage | null; unreadCount: number }

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ChatSidebar({ selected, onSelect }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    fetch("/api/chat/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const filtered = conversations.filter((c) =>
    c.driver.name.toLowerCase().includes(search.toLowerCase()) ||
    c.driver.phone.includes(search)
  );

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-navy font-bold text-lg mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-crimson" /> Chats
        </h2>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <Search className="w-4 h-4 text-navy/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver..." className="bg-transparent text-navy text-sm outline-none w-full placeholder:text-navy/30" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-navy/30 text-sm text-center py-8">No conversations</p>
        ) : filtered.map((c) => (
          <button key={c.driver.id} onClick={() => onSelect(c.driver.id)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer border-b border-gray-50 ${
              selected === c.driver.id ? "bg-crimson/5" : "hover:bg-gray-50"
            }`}>
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                selected === c.driver.id ? "bg-crimson" : "bg-navy/70"
              }`}>
                {c.driver.name.charAt(0).toUpperCase()}
              </div>
              <Circle className={`w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-current ${
                c.driver.isAvailable ? "text-green-400" : "text-gray-300"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold truncate ${selected === c.driver.id ? "text-crimson" : "text-navy"}`}>
                  {c.driver.name}
                </p>
                {c.lastMessage && (
                  <span className="text-navy/30 text-[10px] shrink-0 ml-2">{timeAgo(c.lastMessage.createdAt)}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-navy/40 text-xs truncate">
                  {c.lastMessage
                    ? `${c.lastMessage.sender === "dispatcher" ? "You: " : ""}${c.lastMessage.message}`
                    : "No messages yet"}
                </p>
                {c.unreadCount > 0 && (
                  <span className="bg-crimson text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ml-2">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
