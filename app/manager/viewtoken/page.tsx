"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

interface TokenRow {
  token_id: number;
  token: string;
  token_date: string;
  meal_type: string;
  status: string;
  users: {
    name: string;
    registration_no: string;
  };
}

export default function ManagerTokensPage() {
  const [hallId, setHallId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("breakfast");

  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH MANAGER HALL ---------------- */
  useEffect(() => {
    const fetchManagerHall = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) return;

      const { data: dbUser } = await supabase
        .from("users")
        .select("hall_id")
        .eq("email", data.user.email)
        .single();
    
      if (!dbUser) {
        console.error("User not found");
        return;
      }
      setHallId(dbUser.hall_id);
    };

    fetchManagerHall();
  }, []);

  /* ---------------- FETCH TOKENS ---------------- */
  const fetchTokens = async () => {
    if (!hallId || !selectedDate) return;

    setLoading(true);

    const { data } = await supabase
      .from("tokens")
      .select(`
        *,
        users(name, registration_no)
      `)
      .eq("hall_id", hallId)
      .eq("token_date", selectedDate)
      .eq("meal_type", selectedMeal)
      .order("token_id");

    setTokens(data || []);
    setLoading(false);
    setShowModal(false);
  };

  /* ---------------- UPDATE STATUS ---------------- */
  const updateStatus = async (id: number, newStatus: string) => {
    await supabase
      .from("tokens")
      .update({ status: newStatus })
      .eq("token_id", id);

    fetchTokens();
  };

  /* ===================================================== */

  return (
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">Token List</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded mb-6"
      >
        Filter Tokens
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-8 rounded-xl w-96"
          >
            <h2 className="text-xl font-bold mb-4">Select Filters</h2>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border p-2 mb-3"
            />

            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="w-full border p-2 mb-4"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={fetchTokens}
              className="w-full bg-indigo-600 text-white py-2 rounded"
            >
              Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {loading && <p>Loading...</p>}

      {!loading && tokens.length > 0 && (
        <div className="overflow-x-auto bg-white shadow rounded-xl">
          <table className="w-full text-left">

            <thead className="bg-indigo-100">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Reg No</th>
                <th className="p-3">Token</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {tokens.map((t) => (
                <tr key={t.token_id} className="border-t">

                  <td className="p-3">{t.users?.name}</td>
                  <td className="p-3">{t.users?.registration_no}</td>
                  <td className="p-3 font-semibold">{t.token}</td>

                  <td className="p-3">{t.status}</td>

                  <td className="p-3">
                    <select
                      value={t.status}
                      onChange={(e) =>
                        updateStatus(t.token_id, e.target.value)
                      }
                      className="border p-1 rounded"
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tokens.length === 0 && !showModal && (
        <p>No tokens found for this selection.</p>
      )}
    </div>
  );
}
