"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UserCircleIcon, CalendarDaysIcon, EnvelopeIcon, ReceiptPercentIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Menu Modal states
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [halls, setHalls] = useState<HallDetails[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // View Bill states
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Student Dashboard
          </h1>

          {/* Account Button */}
          <button
            onClick={() => setShowAccountModal(!showAccountModal)}
            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors group"
          >
            <div className="relative">
              <UserCircleIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
              {showAccountModal && (
                <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white"></span>
              )}
            </div>
            <span className="font-medium">Account</span>
          </button>
        </header>

        {/* Account Modal */}
        {showAccountModal && userDetails && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 right-6 bg-white rounded-xl shadow-xl p-5 w-80 z-50 border border-gray-200"
          >
            <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">Student Information</h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-gray-800 font-semibold">{userDetails.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-gray-800">{user?.email}</p>
                </div>
              </div>
              
              {userDetails.registration_no && (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Registration No</p>
                    <p className="text-gray-800">{userDetails.registration_no}</p>
                  </div>
                </div>
              )}
              
              {userDetails.hall_card_no && (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hall Card No</p>
                    <p className="text-gray-800">{userDetails.hall_card_no}</p>
                  </div>
                </div>
              )}
              
              {hallDetails && (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hall</p>
                    <p className="text-gray-800 font-semibold">{hallDetails.hall_name}</p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
            >
              Logout
            </button>
          </motion.div>
        )}

        {/* Hero Section with Student Info */}
        <section className="bg-gradient-to-r from-indigo-600 to-blue-600 py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-6 mb-6 md:mb-0">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-16 w-16 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      Welcome, {userDetails?.name || 'Student'}!
                    </h2>
                    <p className="text-gray-600">
                      {hallDetails && `Hall: ${hallDetails.hall_name}`}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Email: {user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="text-center md:text-right">
                  <div className="text-4xl font-bold text-blue-500 mb-2">
                    MealMate
                  </div>
                  <p className="text-gray-600">
                    Everything you need in one place
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="max-w-6xl mx-auto px-6 py-8">
            {/* Today's Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />
                Today&apos;s Date
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <p className="text-gray-500">Ready to select your meals!</p>
            </motion.div>
        </section>

        {/* Main Action Cards */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Manage Your Meals & Bills
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* View Menu Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="group cursor-pointer"
              onClick={handleViewMenu}
            >
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden transform transition-transform duration-300 group-hover:scale-[1.02]">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">View Menu</h3>
                      <p className="text-indigo-100">Select meals & get tokens</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Select from available halls</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Choose meal type & date</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Get 4-digit token via email</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">Click to Start</span>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* View Bill Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="group cursor-pointer"
              onClick={handleViewBill}
            >
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl overflow-hidden transform transition-transform duration-300 group-hover:scale-[1.02]">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <ReceiptPercentIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">View Bill</h3>
                      <p className="text-green-100">Check bills & make payments</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Select month to view bill</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>See daily consumption details</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Pay bills securely</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">Click to View</span>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Menu Modal */}
        {showMenuModal && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-blue-600 mb-6 text-center flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View your hall menu
              </h3>
              
              <div className="space-y-6">
                {/* Hall Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Hall Name
                  </label>
                  <select
                    value={selectedHallId}
                    onChange={(e) => setSelectedHallId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                  >
                    <option value="">Select a hall</option>
                    {halls.map((hall) => (
                      <option key={hall.hall_id} value={hall.hall_id}>
                        {hall.hall_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Meal Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Meal Type
                  </label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-black"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMenuSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  View Menu →
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bill Modal */}
        {showBillModal && (
          <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-blue-600 mb-6 text-center flex items-center justify-center gap-2">
                <ReceiptPercentIcon className="w-6 h-6 text-blue-600" />
                View Bill
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    Select Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-black"
                  >
                    <option value="">Select a month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month} {currentYear}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Note:</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    You will see daily consumption details and total monthly bill. 
                    You can also make payments for unpaid bills.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowBillModal(false)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBillSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  View Bill →
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}