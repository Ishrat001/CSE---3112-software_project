"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type BillRow = {
  bill_id: number;
  user_id: number;
  name: string;
  email: string;
  total_amount: number;
  status: string;
};

interface BillWithUser {
  bill_id: number;
  user_id: number;
  total_amount: number;
  status: "paid" | "unpaid";
  users: {
    name: string;
    email: string;
  };
}

export default function BillsPage() {
  const [hallId, setHallId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(true);
  const [month, setMonth] = useState("");

  const [rows, setRows] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- GET MANAGER HALL ---------- */
  useEffect(() => {
    const getHall = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: dbUser } = await supabase
        .from("users")
        .select("hall_id")
        .eq("email", data.user.email)
        .single();

      if (dbUser) setHallId(dbUser.hall_id);
    };

    getHall();
  }, []);

  /* ---------- LOAD BILLS ---------- */

  interface User {
    name: string;
    email: string;
    hall_id: number;
  }

  interface BillFromSupabase {
    bill_id: number;
    user_id: number;
    total_amount: number;
    status: "paid" | "unpaid";
    users: User[];
  }

  interface BillRow {
    bill_id: number;
    user_id: number;
    name: string;
    email: string;
    total_amount: number;
    status: "paid" | "unpaid";
  }

  const loadBills = async () => {
    if (!hallId || !month) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bills")
        .select(`
          bill_id,
          user_id,
          total_amount,
          status,
          users!inner(name,email,hall_id)
        `)
        .eq("bill_month", month)
        .eq("users.hall_id", hallId);

      if (error) {
        console.error("Error loading bills:", error.message);
        setRows([]);
        return;
      }

      if (data && data.length > 0) {
        const formatted: BillRow[] = (data as BillFromSupabase[]).map((b) => {
          const user = b.users[0];
          return {
            bill_id: b.bill_id,
            user_id: b.user_id,
            name: user?.name || "",
            email: user?.email || "",
            total_amount: b.total_amount,
            status: b.status,
          };
        });

        setRows(formatted);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setRows([]);
    } finally {
      setShowModal(false);
      setLoading(false);
    }
  };

  /* ---------- SEND WARNING ---------- */
  const sendWarning = async (row: BillRow) => {
    const { data } = await supabase.auth.getUser();

    await supabase.from("warnings").insert({
      student_id: row.user_id,
      manager_id: data.user?.id,
      message: "Pay within 10 days or account will be blocked",
    });

    await fetch("/api/send-warning-mail", {
      method: "POST",
      body: JSON.stringify({
        email: row.email,
        name: row.name,
        amount: row.total_amount,
      }),
    });

    alert("Warning email sent ✅");
  };

  /* ================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-10">

      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">View Bills</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-md transition"
        >
          Select Month
        </button>
      </div>

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 animate-fadeIn">

            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Select Month
            </h2>

            <input
              type="month"
              className="border rounded-lg p-2 w-full mb-5 focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              onChange={(e) => setMonth(e.target.value)}
            />

            <button
              onClick={loadBills}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg transition"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* ---------- TABLE ---------- */}
      {!showModal && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Name</th>
                <th className="text-left px-6 py-4 font-semibold">Amount</th>
                <th className="text-left px-6 py-4 font-semibold">Status</th>
                <th className="text-left px-6 py-4 font-semibold">Warning</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.bill_id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {r.name}
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    {r.total_amount} ৳
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={
                        r.status === "paid"
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {r.status === "unpaid" && (
                      <button
                        onClick={() => sendWarning(r)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition shadow-sm"
                      >
                        Give Warning
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {/* ---------- LOADING ---------- */}
      {loading && (
        <p className="mt-6 text-indigo-600 font-medium animate-pulse">
          Loading bills...
        </p>
      )}
    </div>
  );
}
