"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MenuItem = {
  menu_id?: number;
  item_name: string;
  price: number;
  available: boolean;
  isNew?: boolean;
};

export default function UpdateMenu() {
  const [hallId, setHallId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("breakfast");

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- GET MANAGER HALL ---------------- */
  useEffect(() => {
    const fetchHall = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: dbUser } = await supabase
        .from("users")
        .select("hall_id")
        .eq("email", data.user.email)
        .single();

      if (dbUser) setHallId(dbUser.hall_id);
    };

    fetchHall();
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

    if (data) setItems(data);

    setShowModal(false);
    setLoading(false);
  };

  /* ---------------- GENERIC UPDATE FIELD ---------------- */
  const updateField = <K extends keyof MenuItem>(
    index: number,
    field: K,
    value: MenuItem[K]
  ) => {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  };

  /* ---------------- ADD NEW ROW ---------------- */
  const addRow = () => {
    setItems([
      ...items,
      { item_name: "", price: 0, available: true, isNew: true },
    ]);
  };

  /* ---------------- DELETE ROW ---------------- */
  const deleteRow = async (index: number) => {
    const row = items[index];

    if (row.menu_id) {
      await supabase.from("menu").delete().eq("menu_id", row.menu_id);
    }

    setItems(items.filter((_, i) => i !== index));
  };

  /* ---------------- SAVE CHANGES ---------------- */
  const saveChanges = async () => {
    if (!hallId) return;

    setLoading(true);

    for (const item of items) {
      if (item.isNew) {
        await supabase.from("menu").insert({
          hall_id: hallId,
          meal_type: selectedMeal,
          menu_date: selectedDate,
          item_name: item.item_name,
          price: item.price,
          available: item.available,
        });
      } else if (item.menu_id) {
        await supabase
          .from("menu")
          .update({
            item_name: item.item_name,
            price: item.price,
            available: item.available,
          })
          .eq("menu_id", item.menu_id);
      }
    }

    alert("Menu updated successfully ✅");
    setLoading(false);
  };

  /* ================================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-10">

      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Update Menu</h1>

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

          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">

            <h2 className="text-lg font-semibold mb-5 text-gray-800">
              Choose Menu Slot
            </h2>

            <input
              type="date"
              className="border rounded-lg p-2 w-full mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <select
              className="border rounded-lg p-2 w-full mb-5 focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={loadMenu}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-lg transition"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!showModal && !loading && (
        <div className="bg-white rounded-2xl shadow-lg p-8">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-center">Available</th>
                <th className="px-4 py-3 text-center">Delete</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">

                  <td className="px-4 py-3">
                    <input
                      value={item.item_name}
                      onChange={(e) =>
                        updateField(i, "item_name", e.target.value)
                      }
                      className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateField(i, "price", Number(e.target.value))
                      }
                      className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                    />
                  </td>

                  <td className="text-center px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) =>
                        updateField(i, "available", e.target.checked)
                      }
                      className="h-5 w-5 accent-indigo-600 cursor-pointer"
                    />
                  </td>

                  <td className="text-center px-4 py-3">
                    <button
                      onClick={() => deleteRow(i)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={addRow}
              className="bg-indigo-700 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
            >
              + Add Item
            </button>

            <button
              onClick={saveChanges}
              className="bg-pink-700 hover:bg-pink-500 text-white px-5 py-2 rounded-lg shadow transition"
            >
              Save Changes
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
