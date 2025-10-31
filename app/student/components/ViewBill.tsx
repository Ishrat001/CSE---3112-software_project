"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ViewBill({ user }: any) {
  const [month, setMonth] = useState("");
  const [bills, setBills] = useState<any[]>([]);

  const fetchBills = async () => {
    if (!month) return;

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("bill_month", month);

    if (!error && data) setBills(data);
  };

  const total = bills.reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="text-black">
      <h2 className="text-xl font-semibold mb-4 text-black">
        📄 View Monthly Bill
      </h2>

      <div className="flex space-x-2 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2 rounded-md text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={fetchBills}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          View
        </button>
      </div>

      {bills.length > 0 ? (
        <div className="bg-white p-4 rounded-md shadow text-black">
          {bills.map((b) => (
            <div
              key={b.bill_id}
              className="flex justify-between border-b py-2 text-black"
            >
              <span>{b.generated_at.split("T")[0]}</span>
              <span>৳{b.total_amount}</span>
            </div>
          ))}

          <div className="flex justify-between mt-4 font-semibold text-black">
            <span>Total</span>
            <span>৳{total}</span>
          </div>

          <p className="mt-2 text-gray-700">
            Status:{" "}
            <span
              className={`font-bold ${
                bills[0].status === "paid" ? "text-green-600" : "text-red-500"
              }`}
            >
              {bills[0].status.toUpperCase()}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-black">No bills found for this month.</p>
      )}
    </div>
  );
}
