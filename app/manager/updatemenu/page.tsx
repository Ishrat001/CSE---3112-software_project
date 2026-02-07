"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MenuItem = {
  menu_id?: number; // existing হলে থাকবে
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
      // NEW → INSERT
      if (item.isNew) {
        await supabase.from("menu").insert({
          hall_id: hallId,
          meal_type: selectedMeal,
          menu_date: selectedDate,
          item_name: item.item_name,
          price: item.price,
          available: item.available,
        });
      }

      // EXISTING → UPDATE
      else if (item.menu_id) {
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
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Update Menu</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Select Date & Meal
      </button>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl w-96">

            <input
              type="date"
              className="border p-2 w-full mb-3"
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <select
              className="border p-2 w-full mb-4"
              onChange={(e) => setSelectedMeal(e.target.value)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>

            <button
              onClick={loadMenu}
              className="bg-indigo-600 text-white w-full py-2 rounded"
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!showModal && !loading && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow">

          <table className="w-full">
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Available</th>
                <th>Delete</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b">

                  <td>
                    <input
                      value={item.item_name}
                      onChange={(e) =>
                        updateField(i, "item_name", e.target.value)
                      }
                      className="border p-2"
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateField(i, "price", Number(e.target.value))
                      }
                      className="border p-2"
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) =>
                        updateField(i, "available", e.target.checked)
                      }
                    />
                  </td>

                  <td>
                    <button
                      onClick={() => deleteRow(i)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-3 mt-4">
            <button
              onClick={addRow}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              + Add Item
            </button>

            <button
              onClick={saveChanges}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}
