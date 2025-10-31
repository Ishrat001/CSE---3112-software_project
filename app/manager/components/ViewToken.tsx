"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ViewToken({ manager }: any) {
  const [mealType, setMealType] = useState("");
  const [date, setDate] = useState("");
  const [tokens, setTokens] = useState<any[]>([]);

  const fetchTokens = async () => {
    if (!mealType || !date) return;
    const { data, error } = await supabase
      .from("tokens")
      .select(`*, user:user_id(name, registration_no), menu:menu_id(item_name, price)`)
      .eq("token_date", date)
      .eq("status", "pending")
      .order("user_id");

    if (!error) setTokens(data || []);
  };

  const approveToken = async (tokenId: number) => {
    await supabase.from("tokens").update({ status: "approved" }).eq("token_id", tokenId);
    fetchTokens();
  };

  return (
    <div>
      <h2 className="text-xl text-black font-semibold mb-4">📋 View Tokens</h2>

      <div className="flex space-x-2 mb-4">
        <select value={mealType} onChange={e => setMealType(e.target.value)} className="border-black text-black p-2 rounded-md">
          <option value="">Select Meal</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border-black text-black p-2 rounded-md" />
        <button onClick={fetchTokens} className="bg-blue-600 text-white px-4 py-2 rounded-md">Load</button>
      </div>

      <div className="bg-white text-black p-4 rounded-md shadow">
        {tokens.length === 0 ? (
          <p>No tokens found.</p>
        ) : (
          tokens.map(token => (
            <div key={token.token_id} className="flex justify-between border-b py-2">
              <span>{token.user.name} ({token.user.registration_no}) - {token.menu.item_name} - ৳{token.menu.price}</span>
              <button onClick={() => approveToken(token.token_id)} className="bg-green-600 text-black px-3 py-1 rounded-md">
                Approve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
