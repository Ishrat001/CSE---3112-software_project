"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthModal() {
  const router = useRouter();

  // Common states
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register fields
  const [name, setName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [hallCardNo, setHallCardNo] = useState("");
  const [phone, setPhone] = useState("");
  const [hallId, setHallId] = useState("");
  const [userType] = useState("student");

  // Login fields
  const [loginRegistrationNo, setLoginRegistrationNo] = useState("");

  // Hall list
  interface Hall {
    hall_id: number;
    hall_name: string;
  }

  const [halls, setHalls] = useState<Hall[]>([]);
  const [loadingHalls, setLoadingHalls] = useState(true);

  useEffect(() => {
    const fetchHalls = async () => {
      const { data, error } = await supabase
        .from("halls")
        .select("hall_id, hall_name")
        .order("hall_name");
      if (!error && data) {
        setHalls(data);
      }
      setLoadingHalls(false);
    };
    fetchHalls();
  }, []);

  // ---- Login ----
  const handleLogin = async () => {
    if (!email || !password || !loginRegistrationNo) {
      alert("❌ Please fill all login fields");
      return;
    }

    setIsLoading(true);

    try {
      // First verify user exists in users table with matching credentials
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("registration_no", loginRegistrationNo)
        .single();

      if (userError || !userData) {
        alert("❌ Invalid email or registration number");
        setIsLoading(false);
        return;
      }

      // Now authenticate with Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        alert("❌ Login failed: " + authError.message);
        return;
      }

      alert("✅ Login successful!");
      
      if (userData.user_type === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/manager/dashboard");
      }
    } catch (error) {
      alert("❌ Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Register ----
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !registrationNo || !hallCardNo || !hallId) {
      alert("❌ Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("❌ Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Check if email or registration number already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("email, registration_no")
        .or(`email.eq.${email},registration_no.eq.${registrationNo}`)
        .single();

      if (existingUser) {
        if (existingUser.email === email) {
          alert("❌ Email already registered");
        } else {
          alert("❌ Registration number already exists");
        }
        setIsLoading(false);
        return;
      }

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);

      const user = authData.user;
      if (!user) throw new Error("User creation failed");

      // Step 2: Insert into users table
      const { error: insertError } = await supabase.from("users").insert([
        {
          hall_id: Number(hallId),
          user_type: userType,
          name: name.trim(),
          registration_no: registrationNo.trim(),
          hall_card_no: hallCardNo.trim(),
          email: email.toLowerCase(),
          password, // Note: Hash in production
          phone: phone.trim() || null,
        },
      ]);

      if (insertError) throw new Error(insertError.message);

      alert("✅ Account created successfully! You can now login.");
      setIsRegister(false);
      resetForm();
    } catch (error) {
      alert("❌ Registration failed: "+error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRegistrationNo("");
    setHallCardNo("");
    setPhone("");
    setHallId("");
    setLoginRegistrationNo("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Mess Management</h1>
          <p className="text-blue-100 mt-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="space-y-4">
            {isRegister ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-black-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number *
                  </label>
                  <input
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="Enter registration number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hall Card Number *
                  </label>
                  <input
                    value={hallCardNo}
                    onChange={(e) => setHallCardNo(e.target.value)}
                    placeholder="Enter hall card number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hall *
                  </label>
                  <select
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="" style={{ color: "#000000" }}>Select your hall</option>
                    {loadingHalls ? (
                      <option disabled>Loading halls...</option>
                    ) : (
                      halls.map((hall) => (
                        <option key={hall.hall_id} value={hall.hall_id} style={{ color: "#000000" }}>
                          {hall.hall_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min. 6 characters)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number *
                  </label>
                  <input
                    value={loginRegistrationNo}
                    onChange={(e) => setLoginRegistrationNo(e.target.value)}
                    placeholder="Enter registration number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    suppressHydrationWarning
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold mt-6 hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                {isRegister ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              <>{isRegister ? "Create Account" : "Sign In"}</>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  resetForm();
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 transition"
                disabled={isLoading}
                suppressHydrationWarning
              >
                {isRegister ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}