"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Building2, UserRound, Mail, Phone, Calendar, Car } from "lucide-react";
import CustomerDetail from "@/components/dispatch/CustomerDetail";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: string;
  companyName?: string;
  totalRides: number;
  createdAt: string;
}

const PER_PAGE = 5;

export default function CustomersTable({ filter }: { filter: string }) {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("type", filter);
    if (search) params.set("search", search);
    fetch(`/api/customers?${params}`)
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers || []); setPage(1); })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || selected) return;
    fetch(`/api/customers?search=`)
      .then((r) => r.json())
      .then((d) => {
        const c = (d.customers || []).find((c: Customer) => c.id === openId);
        if (c) setSelected(c);
      })
      .catch(() => {});
  }, [searchParams, selected]);

  const total = customers.length;
  const pages = Math.ceil(total / PER_PAGE);
  const visible = customers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
          <Search className="w-4 h-4 text-navy/30" />
          <input type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone..."
            className="bg-transparent text-navy text-sm outline-none w-full placeholder:text-navy/30" />
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium">Name</th>
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium hidden sm:table-cell">Phone</th>
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium">Type</th>
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium">Rides</th>
              <th className="text-left px-2 sm:px-4 py-3 text-navy/40 font-medium hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-navy/30">Loading...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-navy/30">No customers found</td></tr>
            ) : visible.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-2 sm:px-4 py-3">
                  <p className="text-navy font-medium">{c.name}</p>
                  {c.companyName && <p className="text-navy/40 text-xs">{c.companyName}</p>}
                </td>
                <td className="px-2 sm:px-4 py-3 text-navy/60 hidden md:table-cell">{c.email}</td>
                <td className="px-2 sm:px-4 py-3 text-navy/60 hidden sm:table-cell">{c.phone}</td>
                <td className="px-2 sm:px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.accountType === "company"
                      ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {c.accountType === "company" ? "Company" : "Individual"}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {c.totalRides}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 text-navy/40 text-xs hidden sm:table-cell">
                  {new Date(c.createdAt).toLocaleDateString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
          <span className="text-navy/30 text-xs">{total} customer{total !== 1 ? "s" : ""}</span>
          <div className="flex gap-1">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-medium cursor-pointer ${
                  page === i + 1 ? "bg-crimson/10 text-crimson" : "text-navy/40 hover:text-navy hover:bg-gray-100"
                }`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <CustomerDetail customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
