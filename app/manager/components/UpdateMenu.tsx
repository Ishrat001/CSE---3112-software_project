"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UpdateMenu({ manager }: any) {
  const [mealType, setMealType] = useState("");
  const [date, setDate] = useState("");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const fetchMenu = async () => {
    if (!mealType || !date) return;
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .eq("meal_type", mealType)
      .eq("menu_date", date)
      .eq("hall_id", manager.hall_id);

    if (!error) setMenuItems(data || []);
  };

  const addMenuItem = async () => {
    if (!newItemName || !newItemPrice) return;
    const { error } = await supabase.from("menu").insert([{
      hall_id: manager.hall_id,
      meal_type: mealType,
      menu_date: date,
      item_name: newItemName,
      price: Number(newItemPrice),
      available: true,
    }]);
    if (!error) {
      setNewItemName(""); setNewItemPrice("");
      fetchMenu();
    }
  };

  const toggleAvailability = async (id: number, available: boolean) => {
    await supabase.from("menu").update({ available: !available }).eq("menu_id", id);
    fetchMenu();
  };

  const deleteItem = async (id: number) => {
    await supabase.from("menu").delete().eq("menu_id", id);
    fetchMenu();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📝 Update Menu</h2>

      <div className="flex space-x-2 mb-4">
        <select 
          value={mealType} 
          onChange={e => setMealType(e.target.value)} 
          className="border border-black p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="">Select Meal</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="border border-black p-2 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <button 
          onClick={fetchMenu} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-black hover:bg-indigo-700 transition"
        >
          Load
        </button>
      </div>

      <div className="mb-4 flex space-x-2">
        <input 
          placeholder="Item Name" 
          value={newItemName} 
          onChange={e => setNewItemName(e.target.value)} 
          className="border border-black p-2 rounded-lg text-black"
        />
        <input 
          placeholder="Price" 
          value={newItemPrice} 
          onChange={e => setNewItemPrice(e.target.value)} 
          className="border border-black p-2 rounded-lg text-black"
        />
        <button onClick={addMenuItem} className="bg-green-600 text-black px-4 py-2 rounded-lg hover:bg-green-700 transition">
          Add Item
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg  text-black shadow">
        {menuItems.map(item => (
          <div key={item.menu_id} className="flex justify-between border-b border-black py-2">
            <span>{item.item_name} — ৳{item.price}</span>
            <div className="space-x-2">
              <button 
                onClick={() => toggleAvailability(item.menu_id, item.available)} 
                className={`px-2 py-1 rounded-lg ${item.available ? "bg-yellow-400" : "bg-gray-400"}`}
              >
                {item.available ? "In Stock" : "Out of Stock"}
              </button>
              <button onClick={() => deleteItem(item.menu_id)} className="px-2 py-1 rounded-lg bg-red-500 text-white">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
