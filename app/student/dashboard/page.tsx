"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  UserCircleIcon, 
  CalendarDaysIcon, 
  EnvelopeIcon, 
  ReceiptPercentIcon, 
  CreditCardIcon,
  ChartBarIcon,
  BellIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  CakeIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import Image from "next/image";

interface UserDetails {
  user_id: number;
  hall_id: number;
  name: string;
  email: string;
  user_type: string;
  registration_no?: string;
  hall_card_no?: string;
  phone?: string;
}

interface HallDetails {
  hall_id: number;
  hall_name: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  // User / UI states
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [hallDetails, setHallDetails] = useState<HallDetails | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  // Menu Modal states
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [halls, setHalls] = useState<HallDetails[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // View Bill states
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  // Stats states
  const [stats, setStats] = useState({
    mealsThisMonth: 0,
    pendingBills: 0,
    totalSpent: 0,
    upcomingMeals: 3
  });

  // Fetch user details function
  const fetchUserDetails = async (email: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching user details:', error);
        return null;
      } else {
        setUserDetails(userData);
        await fetchHallDetails(userData.hall_id);
        return userData;
      }
    } catch (error) {
      console.error('Error in fetchUserDetails:', error);
      return null;
    }
  };

  // Fetch hall details
  const fetchHallDetails = async (hallId: number) => {
    try {
      const { data: hallData, error } = await supabase
        .from('halls')
        .select('*')
        .eq('hall_id', hallId)
        .single();
      
      if (error) {
        console.error('Error fetching hall details:', error);
      } else {
        setHallDetails(hallData);
      }
    } catch (error) {
      console.error('Error in fetchHallDetails:', error);
    }
  };

  // Fetch all halls for menu modal
  const fetchAllHalls = async () => {
    try {
      const { data, error } = await supabase
        .from('halls')
        .select('*')
        .order('hall_name');
      
      if (error) {
        console.error('Error fetching halls:', error);
      } else {
        setHalls(data || []);
        // Set default hall to student's hall
        if (userDetails && data) {
          const userHall = data.find(h => h.hall_id === userDetails.hall_id);
          if (userHall) {
            setSelectedHallId(userHall.hall_id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching halls:', error);
    }
  };

  // Fetch logged-in user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          router.push("/login");
          return;
        }

        if (!data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);
        
        if (data.user.email) {
          await fetchUserDetails(data.user.email);
        } else {
          console.error('User email is null');
          router.push("/login");
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        router.push("/login");
      }
    };
    
    getUser();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserDetails(null);
    setShowAccountModal(false);
    router.push("/login");
  };

  // Handle View Menu
  const handleViewMenu = () => {
    setShowMenuModal(true);
    if (halls.length === 0) {
      fetchAllHalls();
    }
  };

  // Handle Menu Modal Submit
  const handleMenuSubmit = () => {
    if (!selectedHallId || !selectedMealType || !selectedDate) {
      alert("Please fill all fields");
      return;
    }
    
    const selectedHall = halls.find(h => h.hall_id.toString() === selectedHallId);
    router.push(`/student/menu-view?hall=${selectedHallId}&meal=${selectedMealType}&date=${selectedDate}&hallName=${selectedHall?.hall_name}`);
    setShowMenuModal(false);
  };

  // Handle View Bill
  const handleViewBill = () => {
    setShowBillModal(true);
  };

  // Handle Bill Submit
  const handleBillSubmit = () => {
    if (!selectedMonth) {
      alert("Please select a month");
      return;
    }
    
    router.push(`/student/bill-details?month=${selectedMonth}&year=${new Date().getFullYear()}`);
    setShowBillModal(false);
  };

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get current year
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  MealMate
                </h1>
                <p className="text-xs text-gray-500">Student Dashboard</p>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowAccountModal(!showAccountModal)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="font-semibold text-gray-800 text-sm">{userDetails?.name || 'Student'}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                  </div>
                </button>

                {/* Account Dropdown */}
                {showAccountModal && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <UserCircleIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{userDetails?.name}</h3>
                          <p className="text-sm text-black">{user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        {userDetails?.registration_no && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-black">Registration No</p>
                              <p className="text-black">{userDetails.registration_no}</p>
                            </div>
                          </div>
                        )}
                        
                        {userDetails?.hall_card_no && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                              <CreditCardIcon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-black">Hall Card No</p>
                              <p className="text-black">{userDetails.hall_card_no}</p>
                            </div>
                          </div>
                        )}
                        
                        {hallDetails && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <p className=" font-semibold text-black">Hall</p>
                              <p className="text-black">{hallDetails.hall_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
                      >
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="text-white mb-6 md:mb-0">
                <div className="flex items-center gap-3 mb-3">
                  <SparklesIcon className="h-8 w-8 text-yellow-300" />
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Welcome back, {userDetails?.name?.split(' ')[0] || 'Student'}! 👋
                  </h2>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Ready to manage your meals and payments for today
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    📍 {hallDetails?.hall_name || 'Your Hall'}
                  </span>
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                    🎓 {userDetails?.registration_no || 'Student'}
                  </span>
                </div>
              </div>
              
              <div className="w-40 h-40 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <CakeIcon className="h-20 w-20 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </h3>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBagIcon className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                This Month
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {stats.mealsThisMonth}
            </h3>
            <p className="text-gray-500 text-sm">Meals Consumed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                tk{stats.totalSpent}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {stats.pendingBills}
            </h3>
            <p className="text-gray-500 text-sm">Pending Bills</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Soon
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {stats.upcomingMeals}
            </h3>
            <p className="text-gray-500 text-sm">Upcoming Meals</p>
          </motion.div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* View Menu Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
            onClick={handleViewMenu}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">View Menu</h3>
                    <p className="text-blue-100">Select meals & get tokens instantly</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-medium">Available Halls</p>
                    <p className="text-white/80 text-xs">Select from multiple</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-medium">Meal Types</p>
                    <p className="text-white/80 text-xs">Breakfast, Lunch, Dinner</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-green-300" />
                    <span className="text-white/90 text-sm">Secure Token System</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform group-hover:translate-x-2 transition-transform duration-300">
                    <ArrowRightIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* View Bill Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
            onClick={handleViewBill}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 -translate-x-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 translate-x-12"></div>
              
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <ReceiptPercentIcon className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">View Bill</h3>
                    <p className="text-purple-100">Check bills & make payments</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-medium">Monthly Overview</p>
                    <p className="text-white/80 text-xs">Daily consumption details</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-white text-sm font-medium">Secure Payments</p>
                    <p className="text-white/80 text-xs">Multiple payment options</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-yellow-300" />
                    <span className="text-white/90 text-sm">SSL Encrypted</span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transform group-hover:translate-x-2 transition-transform duration-300">
                    <ArrowRightIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Today's Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-lg p-8 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6 text-blue-500" />
              Today&apos;s Highlights
            </h3>
            <span className="text-sm text-gray-500">Last updated: Just now</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🍳</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Breakfast</p>
                  <p className="font-semibold text-gray-800">Available until 10 AM</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🍛</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lunch</p>
                  <p className="font-semibold text-gray-800">Serving: 12 PM - 2 PM</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🍽️</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dinner</p>
                  <p className="font-semibold text-gray-800">Serving: 7 PM - 9 PM</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBagIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">View Hall Menu</h3>
                  <p className="text-blue-100 text-sm">Select your preferences</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hall Selection
                  </label>
                  <select
                    value={selectedHallId}
                    onChange={(e) => setSelectedHallId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                  >
                    <option value="">Select a hall</option>
                    {halls.map((hall) => (
                      <option key={hall.hall_id} value={hall.hall_id}>
                        {hall.hall_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['breakfast', 'lunch', 'dinner'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedMealType(type)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedMealType === type
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400 text-black'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {type === 'breakfast' ? '🍳' : type === 'lunch' ? '🍛' : '🍽️'}
                          </div>
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <CalendarDaysIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMenuSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  View Menu
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ReceiptPercentIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">View Monthly Bill</h3>
                  <p className="text-purple-100 text-sm">Select month to view details</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-blue-500 bg-white text-gray-800"
                  >
                    <option value="">Select a month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month} {currentYear}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-800 mb-1">What you&apos;ll see:</p>
                      <ul className="text-sm text-indigo-700 space-y-1">
                        <li>• Daily consumption breakdown</li>
                        <li>• Total monthly bill amount</li>
                        <li>• Payment status & options</li>
                        <li>• Receipt download option</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBillSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  View Bill
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <AcademicCapIcon className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">MealMate</span>
              </div>
              <p className="text-gray-400 text-sm">Simplified hostel meal management</p>
            </div>
            <div className="text-sm text-gray-400">
              <p>© {new Date().getFullYear()} MealMate. All rights reserved.</p>
              <p className="mt-1">Secure & reliable meal management system</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}