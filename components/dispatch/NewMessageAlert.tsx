"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ArrowRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { playNotificationSound } from "@/components/dispatch/NotificationSound";

interface DriverMessage {
  driverName: string;
  driverId: string;
  message: string;
  unreadCount: number;
}

export default function NewMessageAlert() {
  const [alert, setAlert] = useState<DriverMessage | null>(null);
  const [visible, setVisible] = useState(false);
  const lastUnreadMapRef = useRef<Record<string, number>>({});
  const initializedRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const checkNewMessages = useCallback(async () => {
    // Don't alert if already on chat page
    if (pathname === "/chat") {
      initializedRef.current = false;
      lastUnreadMapRef.current = {};
      return;
    }

    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      const conversations = data.conversations || [];

      const currentMap: Record<string, number> = {};
      conversations.forEach((c: { driver: { id: string }; unreadCount: number }) => {
        currentMap[c.driver.id] = c.unreadCount;
      });

      if (!initializedRef.current) {
        lastUnreadMapRef.current = currentMap;
        initializedRef.current = true;
        return;
      }

      // Find driver with NEW unread messages (count increased)
      for (const c of conversations) {
        const prevCount = lastUnreadMapRef.current[c.driver.id] || 0;
        if (c.unreadCount > prevCount && c.unreadCount > 0) {
          setAlert({
            driverName: c.driver.name,
            driverId: c.driver.id,
            message: c.lastMessage?.message || "New message",
            unreadCount: c.unreadCount,
          });
          setVisible(true);
          playNotificationSound();
          break;
        }
      }

      lastUnreadMapRef.current = currentMap;
    } catch {}
  }, [pathname]);

  useEffect(() => {
    // Reset when navigating to/from chat
    initializedRef.current = false;
    lastUnreadMapRef.current = {};
  }, [pathname]);

  useEffect(() => {
    checkNewMessages();
    const iv = setInterval(checkNewMessages, 5000);
    return () => clearInterval(iv);
  }, [checkNewMessages]);

  const dismiss = () => setVisible(false);

  const goToChat = () => {
    setVisible(false);
    router.push("/chat");
  };

  return (
    <AnimatePresence>
      {visible && alert && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={dismiss}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <motion.div
              initial={{ height: 0 }} animate={{ height: "auto" }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, delay: 0.3, repeat: 2 }}
                className="inline-block"
              >
                <MessageCircle className="w-10 h-10 mx-auto mb-2" />
              </motion.div>
              <h3 className="text-xl font-bold">New Message!</h3>
              <p className="text-white/70 text-sm mt-1">You have a new message from a driver</p>
            </motion.div>

            {/* Message details */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {alert.driverName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-navy font-bold text-sm">{alert.driverName}</p>
                  <p className="text-navy/40 text-xs">Driver</p>
                </div>
                {alert.unreadCount > 1 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {alert.unreadCount} unread
                  </span>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
              >
                <p className="text-navy text-sm leading-relaxed line-clamp-3">{alert.message}</p>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={dismiss}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-navy/60 font-medium text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Dismiss
              </button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={goToChat}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4" /> Open Chat
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
