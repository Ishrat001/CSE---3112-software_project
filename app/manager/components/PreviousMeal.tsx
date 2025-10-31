"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  manager: any;
}

interface Meal {
  menu_id: number;
  item_name: string;
  meal_type: string;
  menu_date: string;
  price: number;
  available: boolean;
}

export default function PreviousMeal({ manager }: Props) {
  const [date, setDate] = useState("");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date) fetchPreviousMeals();
  }, [date]);

  const fetchPreviousMeals = async () => {
    if (!manager) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .eq("hall_id", manager.hall_id)
      .eq("menu_date", date)
      .order("meal_type", { ascending: true });

    if (!error && data) setMeals(data as Meal[]);
    else setMeals([]);

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-black">📅 Previous Meals</h2>

      {/* Date Picker */}
      <div className="mb-4">
        <label className="block text-black font-medium mb-1">Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded-md text-black"
        />
      </div>

      {/* Loading */}
      {loading && <p className="text-black">Loading meals...</p>}

      {/* Meals Table */}
      {meals.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
          <table className="w-full text-black border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left">Meal Type</th>
                <th className="py-2 px-4 text-left">Item Name</th>
                <th className="py-2 px-4 text-left">Price (৳)</th>
                <th className="py-2 px-4 text-left">Available</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.menu_id} className="border-b">
                  <td className="py-2 px-4">{meal.meal_type}</td>
                  <td className="py-2 px-4">{meal.item_name}</td>
                  <td className="py-2 px-4">{meal.price}</td>
                  <td className="py-2 px-4">{meal.available ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        date && !loading && <p className="text-black">No meals found for this date.</p>
      )}
    </div>
  );
}
