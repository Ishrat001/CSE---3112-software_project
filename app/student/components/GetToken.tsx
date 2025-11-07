"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  user: any;
}

export default function GetToken({ user }: Props) {
  const [mealType, setMealType] = useState("");
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(""); // For testing UI

  // Fetch menu items when date or mealType changes
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

    if (error) {
      console.error("❌ Error fetching menu:", error);
      alert("❌ Failed to fetch menu.");
    } else {
      setMenu(data || []);
    }
  };

  // Add/Remove items
  const addToCart = (itemId: number, price: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      newCart[itemId] = (newCart[itemId] || 0) + 1;
      calculateTotal(newCart);
      return newCart;
    });
  };

  const removeFromCart = (itemId: number, price: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId]) {
        newCart[itemId] -= 1;
        if (newCart[itemId] <= 0) delete newCart[itemId];
      }
      calculateTotal(newCart);
      return newCart;
    });
  };

  const calculateTotal = (cartObj: { [key: number]: number }) => {
    const totalAmount = Object.entries(cartObj).reduce((sum, [id, qty]) => {
      const item = menu.find((m) => m.menu_id === Number(id));
      return item ? sum + item.price * qty : sum;
    }, 0);
    setTotal(totalAmount);
  };

  // ✅ Generate random 6-digit OTP
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Send OTP (store in Supabase and simulate email)
  const sendOtp = async () => {
    const otpCode = generateOtp();
    setGeneratedOtp(otpCode); // just for testing UI

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // expires in 5 minutes

    const { error } = await supabase.from("user_otps").insert([
      {
        user_id: Number(user.user_id), // ensure correct type
        otp_code: otpCode,
        expires_at: expiresAt,
      },
    ]);

    if (error) {
      console.error("❌ Failed to store OTP:", error);
      alert("❌ Failed to send OTP.");
    } else {
      console.log("✅ OTP generated:", otpCode);
      // In production: integrate email/SMS sending here
      alert(`🔐 OTP for testing: ${otpCode}`);
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    console.log("🔍 Checking OTP:", otp, "for user:", user.user_id);

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_otps")
      .select("*")
      .eq("user_id", Number(user.user_id))
      .eq("otp_code", otp)
      .eq("verified", false)
      .gte("expires_at", nowIso)
      .maybeSingle();

    console.log("🧠 Supabase response:", { data, error });

    if (error) {
      console.error("❌ OTP check error:", error);
      alert("Something went wrong.");
      return;
    }

    if (!data) {
      alert("❌ Invalid or expired OTP.");
      return;
    }

    // Mark OTP as verified
    await supabase.from("user_otps").update({ verified: true }).eq("id", data.id);
    alert("✅ OTP verified successfully!");
    setShowOtpModal(false);

    await createTokenAndBill();
  };

  // ✅ Create tokens & bill after OTP verification
  const createTokenAndBill = async () => {
    try {
      console.log("🟢 Creating tokens and bill...");
      for (const [menuId, qty] of Object.entries(cart)) {
        const { error: tokenError } = await supabase.from("tokens").insert([
          {
            user_id: Number(user.user_id),
            menu_id: Number(menuId),
            quantity: qty,
            status: "pending",
            token_date: date,
          },
        ]);

        if (tokenError) {
          console.error("❌ Token insert error:", tokenError);
          alert("❌ Token insert failed.");
          return;
        }
      }

      const billMonth = date.slice(0, 7); // YYYY-MM
      const { error: billError } = await supabase.from("bills").insert([
        {
          user_id: Number(user.user_id),
          bill_month: billMonth,
          total_amount: total,
          status: "unpaid",
          generated_at: new Date().toISOString(),
        },
      ]);

      if (billError) {
        console.error("❌ Bill insert error:", billError);
        alert("❌ Failed to create bill.");
        return;
      }

      alert(`✅ Meal token & bill created successfully! Total: ৳${total}`);
      setCart({});
      setTotal(0);
      setMealType("");
      setDate("");
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("Something went wrong. Check console for details.");
    }
  };

  // ✅ Trigger OTP modal after pressing Proceed
  const handleToken = async () => {
    if (total <= 0) {
      alert("⚠️ Please select at least one item.");
      return;
    }

    await sendOtp();
    setShowOtpModal(true);
  };

  // ✅ UI
  return (
    <div className="text-black min-h-screen flex flex-col items-center justify-start p-4">
      <h2 className="text-5xl font-semibold mb-8 text-black">🍴 Get Meal Token</h2>

      {/* Step 1 — Meal Type */}
      {!mealType && (
        <div className="flex justify-center space-x-6 mt-10">
          {["breakfast", "lunch", "dinner"].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className="bg-blue-600 text-white px-8 py-4 rounded-md hover:bg-blue-700 text-xl font-semibold"
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — Date */}
      {mealType && !date && (
        <div className="mt-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-2 p-4 rounded-md text-black text-lg w-64"
          />
        </div>
      )}

      {/* Step 3 — Menu */}
      {mealType && date && (
        <div className="w-full max-w-xl mt-6">
          <div className="bg-white rounded-lg shadow p-4 text-black">
            {menu.length === 0 ? (
              <p>No items found for this date.</p>
            ) : (
              menu.map((item) => (
                <div
                  key={item.menu_id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <span className="font-medium">{item.item_name}</span> — ৳{item.price}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => removeFromCart(item.menu_id, item.price)}
                      className="bg-red-500 text-white px-2 rounded-md"
                    >
                      -
                    </button>
                    <span>{cart[item.menu_id] || 0}</span>
                    <button
                      onClick={() => addToCart(item.menu_id, item.price)}
                      className="bg-green-600 text-white px-2 rounded-md"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Step 4 — Total & Proceed */}
          <div className="mt-4 flex justify-between items-center text-black">
            <p className="font-semibold text-lg">Total: ৳{total}</p>
            <div className="space-x-3">
              <button
                onClick={handleToken}
                disabled={total === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                Proceed for Token
              </button>
              <button
                onClick={() => {
                  setMealType("");
                  setDate("");
                  setCart({});
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-black w-80">
            <h3 className="text-lg font-semibold mb-2">
              Enter the OTP sent to your {user?.email ? "email" : "account"} 📩
            </h3>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="Enter OTP"
              className="border-2 rounded-md w-full p-2 mt-2 text-center text-lg"
            />
            <div className="mt-4 flex justify-between">
              <button
                onClick={verifyOtp}
                className="bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Verify
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              (For testing: OTP is {generatedOtp})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
