"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type MenuRow = {
  item_name: string;
  price: number;
  available: boolean;
};

export default function ManagerMenuPage() {
  const [hallId, setHallId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("breakfast");

  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- GET MANAGER HALL ---------------- */
  useEffect(() => {
    const getHall = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: dbUser } = await supabase
        .from("users")
        .select("hall_id")
        .eq("email", data.user.email)
        .single();

      if (!dbUser) return;

      setHallId(dbUser.hall_id);
    };

    getHall();
  }, []);

  /* ---------------- LOAD EXISTING MENU ---------------- */
  const loadMenu = async () => {
    if (!hallId) return;

    setLoading(true);

    const { data } = await supabase
      .from("menu")
      .select("*")
      .eq("hall_id", hallId)
      .eq("meal_type", selectedMeal)
      .eq("menu_date", selectedDate);

    if (data && data.length > 0) {
      setRows(data);
    } else {
      setRows([{ item_name: "", price: 0, available: true }]);
    }

    setShowModal(false);
    setLoading(false);
  };

  /* ---------------- ADD ROW ---------------- */
  const addRow = () => {
    setRows([...rows, { item_name: "", price: 0, available: true }]);
  };

  /* ---------------- UPDATE FIELD ---------------- */
  const updateField = <K extends keyof MenuRow>(
    index: number,
    field: K,
    value: MenuRow[K]
  ) => {
    const copy = [...rows];
    copy[index][field] = value;
    setRows(copy);
  };

  /* ---------------- SAVE MENU ---------------- */
  const saveMenu = async () => {
    if (!hallId) return;

    setLoading(true);

    await supabase
      .from("menu")
      .delete()
      .eq("hall_id", hallId)
      .eq("meal_type", selectedMeal)
      .eq("menu_date", selectedDate);

    const payload = rows.map((r) => ({
      ...r,
      hall_id: hallId,
      meal_type: selectedMeal,
      menu_date: selectedDate,
    }));

    await supabase.from("menu").insert(payload);

    setLoading(false);
    alert("Menu saved successfully ✅");
  };

  /* ================================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-10">

      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Set Menu</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl shadow-md transition"
        >
          Select Date & Meal
        </button>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-96"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
              Choose Menu Slot
            </h2>

            <input
              type="date"
              className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <select
              className="w-full border rounded-lg p-2 mb-5 focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={loadMenu}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
            >
              Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!showModal && !loading && (
        <div className="bg-white rounded-2xl shadow-lg p-8">

          <table className="w-full mb-6 text-sm">

            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="text-left px-4 py-3">Item Name</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-center px-4 py-3">Available</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <input
                      value={row.item_name}
                      onChange={(e) =>
                        updateField(i, "item_name", e.target.value)
                      }
                      className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) =>
                        updateField(i, "price", Number(e.target.value))
                      }
                      className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                    />
                  </td>

                  <td className="text-center px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.available}
                      onChange={(e) =>
                        updateField(i, "available", e.target.checked)
                      }
                      className="h-5 w-5 accent-indigo-600 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4">
            <button
              onClick={addRow}
              className="bg-indigo-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition shadow"
            >
              + Add Item
            </button>

            <button
              onClick={saveMenu}
              className="bg-pink-700 hover:bg-pink-500 text-white px-5 py-2 rounded-lg transition shadow"
            >
              Save Menu
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="mt-6 text-indigo-600 font-medium animate-pulse">
          Loading menu...
        </p>
      )}
    </div>
  );
}
