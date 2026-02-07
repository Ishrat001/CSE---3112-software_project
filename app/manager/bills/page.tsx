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
  users: User[]; // array because Supabase always returns array for joins
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
      // Map each bill to table-friendly format
      const formatted: BillRow[] = (data as BillFromSupabase[]).map((b) => {
        const user = b.users[0]; // <-- take first element
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
    // 1️⃣ insert into warnings table
    const { data } = await supabase.auth.getUser();

    await supabase.from("warnings").insert({
      student_id: row.user_id,
      manager_id: data.user?.id, // or store manager user_id
      message: "Pay within 10 days or account will be blocked",
    });

    // 2️⃣ call API to send email
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
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">View Bills</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Select Month
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80">

            <input
              type="month"
              className="border p-2 w-full mb-4"
              onChange={(e) => setMonth(e.target.value)}
            />

            <button
              onClick={loadBills}
              className="bg-indigo-600 text-white w-full py-2 rounded"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {!showModal && (
        <table className="w-full mt-6 border">

          <thead>
            <tr className="bg-gray-100">
              <th>Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Warning</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.bill_id} className="border-b">

                <td>{r.name}</td>
                <td>{r.total_amount} ৳</td>

                <td>
                  <span
                    className={
                      r.status === "paid"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {r.status}
                  </span>
                </td>

                <td>
                  {r.status === "unpaid" && (
                    <button
                      onClick={() => sendWarning(r)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Give Warning
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}
