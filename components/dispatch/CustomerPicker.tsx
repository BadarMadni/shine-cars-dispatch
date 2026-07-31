"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, Check } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Props {
  onSelect: (customer: { id?: string; name: string; phone: string; email: string }) => void;
}

export default function CustomerPicker({ onSelect }: Props) {
  const [mode, setMode] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });

  const search = useCallback(() => {
    if (!query.trim()) { setResults([]); return; }
    fetch(`/api/customers?search=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.customers || []))
      .catch(() => {});
  }, [query]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [search]);

  const pick = (c: Customer) => {
    setSelected(c.id);
    onSelect({ id: c.id, name: c.name, phone: c.phone, email: c.email });
  };

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy outline-none focus:border-crimson/50";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("search")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${mode === "search" ? "bg-crimson/10 text-crimson border border-crimson/30" : "bg-gray-50 text-navy/40 border border-gray-200"}`}>
          <Search className="w-3 h-3 inline mr-1" />Existing Customer
        </button>
        <button type="button" onClick={() => setMode("new")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${mode === "new" ? "bg-crimson/10 text-crimson border border-crimson/30" : "bg-gray-50 text-navy/40 border border-gray-200"}`}>
          <UserPlus className="w-3 h-3 inline mr-1" />New Customer
        </button>
      </div>

      {mode === "search" ? (
        <>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className={inputClass} />
          {results.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.map((c) => (
                <button type="button" key={c.id} onClick={() => pick(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-between ${selected === c.id ? "bg-green-50 border border-green-200" : "hover:bg-gray-50 border border-transparent"}`}>
                  <div>
                    <span className="font-medium text-navy">{c.name}</span>
                    <span className="text-navy/40 text-xs ml-2">{c.phone}</span>
                  </div>
                  {selected === c.id && <Check className="w-4 h-4 text-green-600" />}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <input type="text" placeholder="Full name" value={newCustomer.name}
            onChange={(e) => { const v = { ...newCustomer, name: e.target.value }; setNewCustomer(v); onSelect(v); }}
            className={inputClass} />
          <input type="text" placeholder="Phone number" value={newCustomer.phone}
            onChange={(e) => { const v = { ...newCustomer, phone: e.target.value }; setNewCustomer(v); onSelect(v); }}
            className={inputClass} />
          <input type="email" placeholder="Email address" value={newCustomer.email}
            onChange={(e) => { const v = { ...newCustomer, email: e.target.value }; setNewCustomer(v); onSelect(v); }}
            className={inputClass} />
        </div>
      )}
    </div>
  );
}
