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
    <div className="p-10 text-black bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold mb-6 text-black">Token List</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow"
      >
        Filter Tokens
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-8 rounded-2xl w-96 shadow-xl text-black"
          >
            <h2 className="text-xl font-bold mb-5 text-black">Select Filters</h2>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-3 text-black"
            />

            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 text-black"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={fetchTokens}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg shadow"
            >
              Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {loading && <p className="mt-6 text-black">Loading...</p>}

      {!loading && tokens.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl mt-6 text-black">

          <table className="w-full text-left text-black">

            <thead className="bg-indigo-100 text-black">
              <tr>
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">Reg No</th>
                <th className="p-4 font-semibold">Token</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {tokens.map((t) => (
                <tr
                  key={t.token_id}
                  className="border-t hover:bg-gray-50 transition"
                >

                  <td className="p-4 text-black">{t.users?.name}</td>
                  <td className="p-4 text-black">{t.users?.registration_no}</td>
                  <td className="p-4 font-semibold text-black">{t.token}</td>

                  <td className="p-4 text-black capitalize">{t.status}</td>

                  <td className="p-4">
                    <select
                      value={t.status}
                      onChange={(e) =>
                        updateStatus(t.token_id, e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 text-black"
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
        <p className="mt-6 text-black">No tokens found for this selection.</p>
      )}
    </div>
  );
}
