"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import UpdateMenu from "../components/UpdateMenu";
import ViewToken from "../components/ViewToken";
import ViewPayment from "../components/ViewPayment";
import GiveWarning from "../components/GiveWarning";
import PreviousMeal from "../components/PreviousMeal";
import StudentInfo from "../components/StudentInfo";

import { useRouter } from "next/navigation";

export default function ManagerDashboard() {
  const [selectedSection, setSelectedSection] = useState("updateMenu");
  const [managerData, setManagerData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchManager = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/manager/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("email", data.user.email)
        .eq("user_type", "manager")
        .single();

      setManagerData(profile);
    };

    fetchManager();
  }, [router]);

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("❌ Logout failed: " + error.message);
    } else {
      alert("✅ Logged out successfully!");
      router.push("/"); // redirect to login page
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar
        selected={selectedSection}
        onSelect={setSelectedSection}
        role="manager"
        onLogout={onLogout}
      />
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-2xl text-black font-semibold mb-4">
          Welcome, {managerData?.name || "Manager"}
        </h1>

        {selectedSection === "updateMenu" && <UpdateMenu manager={managerData} />}
        {selectedSection === "viewToken" && <ViewToken manager={managerData} />}
        {selectedSection === "viewPayment" && <ViewPayment manager={managerData} />}
        {selectedSection === "giveWarning" && <GiveWarning manager={managerData} />}
        {selectedSection === "previousMeals" && <PreviousMeal manager={managerData} />}
        {selectedSection === "studentInfo" && <StudentInfo manager={managerData} />}
      </main>
    </div>
  );
}
