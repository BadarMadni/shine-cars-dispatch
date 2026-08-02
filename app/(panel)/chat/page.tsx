"use client";

import { useState, useEffect } from "react";
import ChatSidebar from "@/components/dispatch/ChatSidebar";
import ChatWindow from "@/components/dispatch/ChatWindow";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");

  useEffect(() => {
    if (!selectedId) return;
    fetch("/api/chat/conversations")
      .then((r) => r.json())
      .then((d) => {
        const c = (d.conversations || []).find(
          (c: { driver: { id: string } }) => c.driver.id === selectedId
        );
        if (c) setDriverName(c.driver.name);
      })
      .catch(() => {});
  }, [selectedId]);

  return (
    <div className="h-[calc(100vh-0px)] flex">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div className={`w-full lg:w-80 lg:shrink-0 lg:block ${selectedId ? "hidden" : "block"}`}>
        <ChatSidebar selected={selectedId} onSelect={(id) => setSelectedId(id)} />
      </div>

      {/* Chat window */}
      <div className={`flex-1 lg:block ${selectedId ? "block" : "hidden"}`}>
        {selectedId ? (
          <ChatWindow
            driverId={selectedId}
            driverName={driverName}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-navy/20" />
              </div>
              <p className="text-navy/30 text-sm">Select a driver to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
