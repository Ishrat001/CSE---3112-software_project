"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  UserCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ReceiptPercentIcon
} from "@heroicons/react/24/outline";

import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface UserDetails {
  user_id: number;
  hall_id: number;
  name: string;
  email: string;
  user_type: string;
}

interface HallDetails {
  hall_id: number;
  hall_name: string;
}

export default function ManagerDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [hallDetails, setHallDetails] = useState<HallDetails | null>(null);
  const [showAccount, setShowAccount] = useState(false);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) return router.push("/login");

      setUser(data.user);

      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", data.user.email)
        .single();

      // 🔥 role protection
      if (dbUser.user_type !== "manager") {
        router.push("/login");
        return;
      }

      setUserDetails(dbUser);

      const { data: hall } = await supabase
        .from("halls")
        .select("*")
        .eq("hall_id", dbUser.hall_id)
        .single();

      setHallDetails(hall);
    };

    getUser();
  }, []);

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  /* ---------------- CARD NAVIGATION ---------------- */
  const cards = [
    {
      title: "View Tokens",
      desc: "See student meal tokens",
      icon: ClipboardDocumentListIcon,
      path: "/manager/viewtoken",
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Set Menu",
      desc: "Add new menu items",
      icon: PencilSquareIcon,
      path: "/manager/setmenu",
      color: "from-green-400 to-teal-500"
    },
    {
      title: "Update Menu",
      desc: "Edit or delete menu",
      icon: CalendarDaysIcon,
      path: "/manager/updatemenu",
      color: "from-yellow-400 to-orange-500"
    },
    {
      title: "View Bills",
      desc: "Check hall bills",
      icon: ReceiptPercentIcon,
      path: "/manager/bills",
      color: "from-red-400 to-pink-500"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">

      {/* ---------- HEADER ---------- */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-md sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-indigo-600">
          Manager Dashboard
        </h1>

        <button
          onClick={() => setShowAccount(!showAccount)}
          className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 px-3 py-2 rounded-full transition"
        >
          <UserCircleIcon className="h-9 w-9 text-indigo-600"/>
          <p className="text-black"><b>Account</b></p>
        </button>
      </header>

      {/* ---------- ACCOUNT MODAL ---------- */}
      {showAccount && userDetails && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 w-80 relative">
            <button
              onClick={() => setShowAccount(false)}
              className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 text-lg font-bold"
            >
              ✕
            </button>

            <p className="font-bold mb-3 text-lg text-black">Manager Info</p>
            <p className="text-black"><b>Name:</b> {userDetails.name}</p>
            <p className="text-black"><b>Email:</b> {user?.email}</p>
            <p className="text-black"><b>Hall:</b> {hallDetails?.hall_name}</p>

            <button
              onClick={logout}
              className="mt-5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section className="text-center py-12 px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">
          Welcome, {userDetails?.name}
        </h2>
        <p className="text-gray-600 text-lg md:text-xl">
          Manage hall meals, tokens and bills with ease
        </p>
      </section>

      {/* ---------- CARDS ---------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 pb-12">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push(card.path)}
            className={`cursor-pointer p-8 rounded-2xl shadow-lg text-white bg-gradient-to-r ${card.color} flex items-center gap-5 transition-transform duration-300`}
          >
            <card.icon className="h-14 w-14" />

            <div>
              <h3 className="text-xl font-bold">{card.title}</h3>
              <p className="text-white/80">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
