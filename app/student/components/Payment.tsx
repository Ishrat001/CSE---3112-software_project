"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Payment({ user }: any) {
  const [month, setMonth] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const fetchBills = async () => {
    if (!month) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("bill_month", month)
      .eq("status", "unpaid"); // only unpaid bills

    if (!error && data) setBills(data);
    else setBills([]);
    setLoading(false);
  };

  const total = bills.reduce((sum, b) => sum + Number(b.total_amount), 0);

  const handlePay = async () => {
    if (bills.length === 0) {
      alert("❌ No unpaid bills to pay.");
      return;
    }

    try {
      setPaymentProcessing(true);

      // Simulate online payment delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update each bill to paid
      for (const bill of bills) {
        await supabase
          .from("bills")
          .update({ status: "paid" })
          .eq("bill_id", bill.bill_id);

        // Optional: record in payments table
        await supabase.from("payments").insert([
          {
            bill_id: bill.bill_id,
            amount: bill.total_amount,
            status: "success",
          },
        ]);
      }

      alert(`✅ Payment successful! Total paid: ৳${total}`);
      setBills([]);
      setMonth("");
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="text-black">
      <h2 className="text-xl font-semibold mb-4 text-black">💳 Payment</h2>

      <div className="flex space-x-2 mb-4 text-black">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2 rounded-md text-black"
        />
        <button
          onClick={fetchBills}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          View Unpaid Bills
        </button>
      </div>

      {loading ? (
        <p className="text-black">Loading bills...</p>
      ) : bills.length > 0 ? (
        <div className="bg-white p-4 rounded-md shadow text-black">
          {bills.map((b) => (
            <div key={b.bill_id} className="flex justify-between border-b py-2 text-black">
              <span>{b.generated_at.split("T")[0]}</span>
              <span>৳{b.total_amount}</span>
            </div>
          ))}

          <div className="flex justify-between mt-4 font-semibold text-black">
            <span>Total to Pay</span>
            <span>৳{total}</span>
          </div>

          <button
            onClick={handlePay}
            disabled={paymentProcessing}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {paymentProcessing ? "Processing Payment..." : "Pay Now"}
          </button>
        </div>
      ) : (
        <p className="text-black">No unpaid bills found for this month.</p>
      )}
    </div>
  );
}
