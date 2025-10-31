"use client";


import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] flex items-center justify-center text-center">
        {/* Background image */}
       <Image
              src="/logo.jpg"
              alt="logo"
              width={120}
              height={120}
              className="mb-6 rounded-full object-cover"
              priority
            />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 -z-0" />
        {/* Text */}
        <div className="relative z-10 px-6">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            Hall Meal Management System
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Manage meals, bills, and hall activities seamlessly
          </p>
        </div>
      </section>

      {/* Cards Section */}
      <main className="flex flex-1 items-center justify-center px-6 py-16 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-5xl w-full">
          {/* Student Card */}
          <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition text-center">
            <Image
              src="/Student.png"
              alt="Student"
              width={120}
              height={120}
              className="mb-6 rounded-full object-cover"
              priority
            />
            <h2 className="text-2xl font-bold mb-2">Student</h2>
            <p className="text-gray-600 mb-6">
              Access your dashboard, view meals, and manage your hall account.
            </p>
            <button
              onClick={() => router.push("/student/register")}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
            >
              Get Started
            </button>
          </div>

          {/* Manager Card */}
          <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition text-center">
            <Image
              src="/Manager.jpg"
              alt="Manager"
              width={120}
              height={120}
              className="mb-6 rounded-full object-cover"
              priority
            />
            <h2 className="text-2xl font-bold mb-2">Manager</h2>
            <p className="text-gray-600 mb-6">
              Manage menus, view tokens, handle payments, and oversee hall
              activities.
            </p>
            <button
              onClick={() => router.push("/manager/register")}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow"
            >
            Get Started
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto text-center py-6 text-gray-500 text-sm border-t">
        © 2025 Hall Management System
      </footer>
    </div>
  );
}
