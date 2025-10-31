"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import GetToken from "../components/GetToken";
import ViewBill from "../components/ViewBill";
import Payment from "../components/Payment";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [selectedSection, setSelectedSection] = useState("getToken");
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/"); // Redirect if not logged in
        return;
      }

      // Fetch student profile
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("email", data.user.email)
        .single();

      setUserData(userProfile);
    };

    fetchUser();
  }, [router]);

  // ✅ Logout function
  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("❌ Logout failed: " + error.message);
    } else {
      alert("✅ Logged out successfully!");
      router.push("/"); // Redirect to login page
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <Sidebar
        selected={selectedSection}
        onSelect={setSelectedSection}
        role="student"
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50 text-black">
        <h1 className="text-2xl font-semibold mb-4 text-black">
          👋 Welcome, {userData?.name || "Student"}
        </h1>

        {selectedSection === "getToken" && <GetToken user={userData} />}
        {selectedSection === "viewBill" && <ViewBill user={userData} />}
        {selectedSection === "payment" && <Payment user={userData} />}
      </div>
    </div>
  );
}
