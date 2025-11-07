"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BillPage({ user }: any) {
  const [month, setMonth] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchBills = async () => {
    if (!month) return alert("⚠️ Please select a month first!");
    if (!user?.user_id) return alert("⚠️ User not logged in properly!");

    setLoading(true);

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("bill_month", month)
      .order("generated_at", { ascending: false });

    if (error) {
      console.error("Error fetching bills:", error);
      alert("❌ Failed to fetch bills!");
      setBills([]);
    } else {
      setBills(data || []);
    }

    setLoading(false);
    setHasFetched(true);
  };

  const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  return (
    <div className="bg-white p-10 rounded-xl shadow-lg text-black max-w-3xl mx-auto min-h-[700px]">
      <h2 className="text-4xl font-bold mb-8 flex items-center gap-2">📅 View Monthly Bills</h2>

      {/* Month Selector */}
      <div className="flex gap-4 mb-8">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-3 text-black flex-1 text-lg"
        />
        <button
          onClick={fetchBills}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Loading..." : "View Bills"}
        </button>
      </div>

      {/* Bill List */}
      {loading ? (
        <p className="text-center text-lg">Fetching bills...</p>
      ) : hasFetched && bills.length === 0 ? (
        <div className="flex items-center justify-center gap-3 bg-red-100 text-red-700 rounded-lg p-6 text-3xl font-bold">
          <span>❌</span> No bills found for this month.
        </div>
      ) : bills.length > 0 ? (
        <div className="space-y-6">
          {bills.map((bill) => (
            <div
              key={bill.bill_id}
              className={`flex justify-between items-center border p-6 rounded-xl shadow-md ${
                bill.status === "paid" ? "bg-green-50" : "bg-yellow-50"
              }`}
            >
              <div>
                <p className="text-xl font-semibold">Month: {bill.bill_month}</p>
                <p className="text-gray-700">Bill ID: {bill.bill_id}</p>
                <p className="text-gray-700">
                  Status:{" "}
                  <span
                    className={`font-bold ${
                      bill.status === "paid" ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {bill.status.toUpperCase()}
                  </span>
                </p>
                <p className="text-gray-600 text-sm">
                  Generated at: {new Date(bill.generated_at).toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold">৳{bill.total_amount}</p>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between mt-6 font-bold text-2xl p-6 border-t bg-gray-100 rounded-lg">
            <span>Total Amount</span>
            <span>৳{totalAmount}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
