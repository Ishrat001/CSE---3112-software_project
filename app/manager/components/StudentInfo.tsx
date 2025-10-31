"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StudentInfo({ manager }: any) {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("hall_id", manager.hall_id)
        .eq("user_type", "student");
      if (!error) setStudents(data || []);
    };
    fetchStudents();
  }, [manager.hall_id]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">👨‍🎓 Student Info</h2>

      <div className="bg-white p-4 rounded-lg text-black shadow">
        {students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          students.map((s) => (
            <div key={s.user_id} className="flex justify-between border-b border-black text-black  py-2">
              <span>{s.name}</span>
              <span>{s.email}</span>
              <span>{s.registration_no}</span>
              <span>{s.phone}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
