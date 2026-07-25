"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-gold/40 transition-colors";

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo-dark.png" alt="Shine Cars" width={60} height={60}
            className="mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-white">Dispatch Panel</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to manage bookings</p>
        </div>

        <form onSubmit={handleLogin}
          className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-white/60 text-xs font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input id="login-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shinecars.co.uk" className={`${inputCls} pl-11`} />
            </div>
          </div>

          <div>
            <label htmlFor="login-pass" className="block text-white/60 text-xs font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input id="login-pass" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password" className={`${inputCls} pl-11`} />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-crimson to-crimson-dark text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
