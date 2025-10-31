"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GiveWarning({ manager }: any) {
  const [studentEmail, setStudentEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendWarning = async () => {
    if (!studentEmail || !message) return alert("Please fill all fields");

    try {
      await supabase.from("warnings").insert([
        { student_id: studentEmail, manager_id: manager.user_id, message }
      ]);
      alert("Warning sent successfully!");
      setStudentEmail(""); setMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to send warning");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">⚠️ Give Warning</h2>

      <div className="bg-white p-4 rounded-lg shadow max-w-md">
        <div className="mb-4">
          <label className="block text-black font-medium mb-1">Student Email</label>
          <input
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            className="border text-black border-black p-2 rounded-lg w-full"
            placeholder="Enter student email"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border text-black border-black p-2 rounded-lg w-full"
            placeholder="Enter warning message"
            rows={4}
          />
        </div>
        <div className="flex space-x-2">
          <button onClick={sendWarning} className="bg-red-500 text-black px-4 py-2 rounded-lg hover:bg-red-600 transition">
            Send
          </button>
          <button onClick={() => { setStudentEmail(""); setMessage(""); }} className="bg-gray-400 text-black px-4 py-2 rounded-lg hover:bg-gray-500 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
