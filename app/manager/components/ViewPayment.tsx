"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ViewPayment({ manager }: any) {
  const [month, setMonth] = useState("");
  const [bills, setBills] = useState<any[]>([]);

  const fetchBills = async () => {
    if (!month) return;
    const { data, error } = await supabase
      .from("bills")
      .select("*, users(*)")
      .eq("month", month)
      .eq("hall_id", manager.hall_id);

    if (!error) setBills(data || []);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl text-black font-bold mb-6 text-gray-800">💰 View Payments</h2>

      <div className="flex space-x-2 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-black p-2 rounded-lg text-black"
        />
        <button
          onClick={fetchBills}
          className="bg-indigo-600 text-black px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Load
        </button>
      </div>

      <div className="bg-white text-black p-4 rounded-lg shadow">
        {bills.length === 0 ? (
          <p>No bills found.</p>
        ) : (
          bills.map((bill) => (
            <div key={bill.bill_id} className="flex justify-between border-b border-black py-2">
              <span>{bill.users.name} — ৳{bill.total_amount}</span>
              <span className={bill.status === "paid" ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                {bill.status.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
