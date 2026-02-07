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
    },
    {
      title: "Set Menu",
      desc: "Add new menu items",
      icon: PencilSquareIcon,
      path: "/manager/setmenu",
    },
    {
      title: "Update Menu",
      desc: "Edit or delete menu",
      icon: CalendarDaysIcon,
      path: "/manager/updatemenu",
    },
    {
      title: "View Bills",
      desc: "Check hall bills",
      icon: ReceiptPercentIcon,
      path: "/manager/bills",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">

      {/* ---------- HEADER ---------- */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow">

        <h1 className="text-2xl font-bold text-indigo-600">
          Manager Dashboard
        </h1>

        <button
          onClick={() => setShowAccount(!showAccount)}
          className="flex items-center gap-2"
        >
          <UserCircleIcon className="h-9 w-9" />
          Account
        </button>
      </header>

      {/* ---------- ACCOUNT MODAL ---------- */}
      {showAccount && userDetails && (
        <div className="absolute top-16 right-8 bg-white shadow-xl rounded-xl p-5 w-72">

          <p className="font-bold mb-2">Manager Info</p>

          <p><b>Name:</b> {userDetails.name}</p>
          <p><b>Email:</b> {user?.email}</p>
          <p><b>Hall:</b> {hallDetails?.hall_name}</p>

          <button
            onClick={logout}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded"
          >
            Logout
          </button>
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-2">
          Welcome, {userDetails?.name}
        </h2>
        <p className="text-gray-600">
          Manage hall meals, tokens and bills easily
        </p>
      </section>

      {/* ---------- CARDS ---------- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-10 pb-12">

        {cards.map((card, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.04 }}
            onClick={() => router.push(card.path)}
            className="cursor-pointer bg-white p-8 rounded-2xl shadow-lg flex items-center gap-5"
          >
            <card.icon className="h-14 w-14 text-indigo-600" />

            <div>
              <h3 className="text-xl font-bold">{card.title}</h3>
              <p className="text-gray-500">{card.desc}</p>
            </div>
          </motion.div>
        ))}

      </section>
    </div>
  );
}
