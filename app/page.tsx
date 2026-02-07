"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon,
  BellIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: <AcademicCapIcon className="h-8 w-8" />,
      title: "Smart Token System",
      description: "4-digit tokens for secure meal collection"
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Real-time Analytics",
      description: "Track consumption and spending patterns"
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Encrypted payment gateway integration"
    },
    {
      icon: <ClockIcon className="h-8 w-8" />,
      title: "24/7 Access",
      description: "Manage anytime from any device"
    }
  ];

  const stats = [
    { number: "500+", label: "Active Students" },
    { number: "10K+", label: "Meals Served Monthly" },
    { number: "99%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        ></div>
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-green-200 to-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`
          }}
        ></div>
      </div>

      {/* Header/Navigation */}
      <header className="relative z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <AcademicCapIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MealMate
                </h1>
                <p className="text-xs text-gray-500">Smart Hall Management</p>
              </div>
            </motion.div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-6">
              <SparklesIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-blue-700">Welcome to the future of hall management</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Revolutionizing
              </span>
              <br />
              <span className="text-gray-900">Campus Dining Experience</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              A complete digital solution for hostel meal management, token generation, 
              billing, and real-time monitoring. Built for modern campuses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/student/register")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3"
              >
                <UserGroupIcon className="h-6 w-6" />
                Start as Student
                <ArrowRightIcon className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/manager/register")}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center gap-3"
              >
                <ChartBarIcon className="h-6 w-6" />
                Start as Manager
                <ArrowRightIcon className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Cards Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Role
            </h2>
            <p className="text-gray-600 text-lg">
              Experience seamless hall management tailored to your needs
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Student Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all">
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                          <UserGroupIcon className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Student Portal</h3>
                          <p className="text-blue-600 font-medium">Access Smart Features</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {[
                      "View daily menus & select meals",
                      "Generate secure 4-digit tokens",
                      "Track consumption & billing",
                      "Make secure online payments",
                      "Download receipts & invoices"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push("/student/register")}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group/btn"
                  >
                    <span>Access Student Portal</span>
                    <ArrowRightIcon className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-50"></div>
              </div>
            </motion.div>

            {/* Manager Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all">
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-2xl flex items-center justify-center">
                          <ChartBarIcon className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Manager Dashboard</h3>
                          <p className="text-pink-600 font-medium">Complete Control Panel</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-pink-600 rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {[
                      "Create & manage daily menus",
                      "Monitor token generation & usage",
                      "Track payments & generate bills",
                      "Real-time hall occupancy analytics",
                      "Manage student profiles & permissions"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => router.push("/manager/register")}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group/btn"
                  >
                    <span>Access Manager Dashboard</span>
                    <ArrowRightIcon className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
                
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-green-100 to-teal-100 rounded-full opacity-50"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MealMate?
            </h2>
            <p className="text-gray-600 text-lg">
              Packed with features that make hall management effortless
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">MealMate</h3>
                  <p className="text-gray-400 text-sm">Intelligent Hall Management</p>
                </div>
              </div>
              <p className="text-gray-400 max-w-md">
                Transforming campus dining experiences with cutting-edge technology 
                and seamless management solutions.
              </p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">
                © {new Date().getFullYear()} MealMate. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Designed with for modern educational institutions
              </p>
            </div>
          </div>
          
          <div className="mt-10 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>
              Need help? Contact us: ishratcsedu29@gmail.com • sumitasmia39@gmail.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}