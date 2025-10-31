"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  user: any;
}

export default function GetToken({ user }: Props) {
  const [mealType, setMealType] = useState("");
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>({});
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    if (!date || !mealType) return;
    fetchMenu();
  }, [mealType, date]);

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .eq("hall_id", user.hall_id)
      .eq("meal_type", mealType)
      .eq("menu_date", date)
      .eq("available", true);

    if (!error && data) setMenu(data);
  };

  const toggleSelect = (menuId: number, price: number) => {
    setSelectedItems((prev) => {
      const newSelected = { ...prev };
      if (newSelected[menuId]) delete newSelected[menuId];
      else newSelected[menuId] = price;

      const t = Object.values(newSelected).reduce((a, b) => a + b, 0);
      setTotal(t);
      return newSelected;
    });
  };

  const handleToken = async () => {
    try {
      for (const menuId of Object.keys(selectedItems)) {
        await supabase.from("tokens").insert([
          {
            user_id: user.user_id,
            menu_id: Number(menuId),
            quantity: 1,
            status: "pending",
            token_date: date,
          },
        ]);
      }
      setShowOtpModal(true);
      setSelectedItems({});
      setTotal(0);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to request token.");
    }
  };

  return (
    <div className="text-black">
      <h2 className="text-xl font-semibold mb-4 text-black">🍴 Get Meal Token</h2>

      {/* Meal Type Buttons */}
      {!mealType && (
        <div className="space-x-4">
          {["breakfast", "lunch", "dinner"].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Date Picker */}
      {mealType && !date && (
        <div className="mt-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded-md text-black"
          />
        </div>
      )}

      {/* Menu Items */}
      {mealType && date && (
        <div>
          <div className="mt-4 bg-white rounded-lg shadow p-4 text-black">
            {menu.length === 0 ? (
              <p>No items found for this date.</p>
            ) : (
              menu.map((item) => (
                <div
                  key={item.menu_id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <span className="text-black">
                    {item.item_name} — ৳{item.price}
                  </span>
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item.menu_id]}
                    onChange={() => toggleSelect(item.menu_id, Number(item.price))}
                    className="accent-blue-600"
                  />
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-between text-black">
            <p className="font-semibold">Total: ৳{total}</p>
            <div className="space-x-3">
              <button
                onClick={handleToken}
                disabled={total === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Proceed for Token
              </button>
              <button
                onClick={() => {
                  setMealType("");
                  setDate("");
                  setSelectedItems({});
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black">
            <h3 className="text-lg font-semibold mb-2">
              OTP sent to your {user?.phone ? "mobile" : "email"} 📩
            </h3>
            <p>Please verify to confirm your token.</p>
            <button
              onClick={() => setShowOtpModal(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
