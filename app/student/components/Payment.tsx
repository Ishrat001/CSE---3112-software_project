"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PaymentPage({ user }: any) {
  const [month, setMonth] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ✅ Fetch unpaid bills for selected month
  const fetchUnpaidBills = async () => {
    if (!month) return alert("⚠️ Please select a month first!");
    if (!user?.user_id) return alert("⚠️ User not logged in properly!");

    setLoading(true);

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.user_id)
      .eq("bill_month", month)
      .eq("status", "unpaid");

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

  // ✅ Pay a single bill
  const handleSinglePayment = async (bill: any) => {
    setProcessingId(bill.bill_id);

    try {
      const paymentDate = new Date().toISOString();

      // 1. Update bill status
      const { error: billError } = await supabase
        .from("bills")
        .update({ status: "paid" })
        .eq("bill_id", bill.bill_id);

      if (billError) throw billError;

      // 2. Record payment
      const { error: payError } = await supabase.from("payments").insert([
        {
          bill_id: bill.bill_id,
          amount: bill.total_amount,
          status: "success",
          payment_date: paymentDate,
        },
      ]);

      if (payError) throw payError;

      setBills((prev) => prev.filter((b) => b.bill_id !== bill.bill_id));
      alert(`✅ Payment successful for Bill ID: ${bill.bill_id}`);
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ Pay all bills
  const handleAllPayments = async () => {
    if (bills.length === 0) return alert("❌ No unpaid bills to pay.");
    setProcessing(true);

    try {
      const paymentDate = new Date().toISOString();
      const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

      for (const bill of bills) {
        const { error: billError } = await supabase
          .from("bills")
          .update({ status: "paid" })
          .eq("bill_id", bill.bill_id);
        if (billError) throw billError;

        const { error: payError } = await supabase.from("payments").insert([
          {
            bill_id: bill.bill_id,
            amount: bill.total_amount,
            status: "success",
            payment_date: paymentDate,
          },
        ]);
        if (payError) throw payError;
      }

      alert(`✅ Payment successful! Total Paid: ৳${totalAmount}`);
      setBills([]);
      setMonth("");
      setHasFetched(false);
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  return (
    <div className="bg-white p-10 rounded-xl shadow-lg text-black max-w-lg mx-auto min-h-[700px]">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">💳 Payment</h2>

      {/* Month Selector */}
      <div className="flex gap-4 mb-8">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-3 text-black flex-1 text-lg"
        />
        <button
          onClick={fetchUnpaidBills}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Loading..." : "View Unpaid Bills"}
        </button>
      </div>

      {/* Bill List */}
      {loading ? (
        <p className="text-center text-lg">Fetching bills...</p>
      ) : hasFetched && bills.length === 0 ? (
        <div className="flex items-center justify-center gap-3 bg-red-100 text-red-700 rounded-lg p-6 text-3xl font-bold">
          <span>❌</span> No unpaid bills found for this month.
        </div>
      ) : bills.length > 0 ? (
        <div className="space-y-6">
          {bills.map((bill) => (
            <div
              key={bill.bill_id}
              className="flex justify-between items-center border p-8 rounded-xl shadow-md bg-green-50"
            >
              <div className="flex items-center gap-5">
                <span className="text-4xl">📄</span>
                <div>
                  <p className="text-2xl font-semibold">
                    {bill.generated_at.split("T")[0]}
                  </p>
                  <p className="text-lg text-gray-700">Bill ID: {bill.bill_id}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold mb-2">৳{bill.total_amount}</p>
                <button
                  onClick={() => handleSinglePayment(bill)}
                  disabled={processingId === bill.bill_id}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-lg font-semibold disabled:opacity-50"
                >
                  {processingId === bill.bill_id ? "Paying..." : "Pay Bill"}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-6 font-bold text-2xl p-6 border-t bg-gray-100 rounded-lg">
            <span>Total Amount</span>
            <span>৳{totalAmount}</span>
          </div>

          <button
            onClick={handleAllPayments}
            disabled={processing}
            className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white py-5 rounded-xl text-2xl font-bold disabled:opacity-50"
          >
            {processing ? "Processing Payment..." : "Pay All Bills"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
