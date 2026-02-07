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

    // delete old first (simple way)
    await supabase
      .from("menu")
      .delete()
      .eq("hall_id", hallId)
      .eq("meal_type", selectedMeal)
      .eq("menu_date", selectedDate);

    // insert new
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
    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">Set Menu</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded mb-6"
      >
        Select Date & Meal
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white p-8 rounded-xl w-96"
          >
            <h2 className="text-xl font-bold mb-4">Choose Menu Slot</h2>

            <input
              type="date"
              className="w-full border p-2 mb-3"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <select
              className="w-full border p-2 mb-4"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={loadMenu}
              className="w-full bg-indigo-600 text-white py-2 rounded"
            >
              Proceed
            </button>
          </motion.div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!showModal && !loading && (
        <div className="bg-white rounded-xl shadow p-6">

          <table className="w-full mb-4">
            <thead>
              <tr className="border-b">
                <th>Item Name</th>
                <th>Price</th>
                <th>Available</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">

                  <td>
                    <input
                      value={row.item_name}
                      onChange={(e) =>
                        updateField(i, "item_name", e.target.value)
                      }
                      className="border p-2 w-full"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) =>
                        updateField(i, "price", Number(e.target.value))
                      }
                      className="border p-2 w-full"
                    />
                  </td>

                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.available}
                      onChange={(e) =>
                        updateField(i, "available", e.target.checked)
                      }
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              + Add Item
            </button>

            <button
              onClick={saveMenu}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Menu
            </button>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}
