"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { UserCircleIcon, Bars3Icon, XMarkIcon, ShoppingCartIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface MenuItem {
  menu_id: number;
  item_name: string;
  price: number;
  available: boolean;
}

interface SelectedItem {
  menu_id: number;
  item_name: string;
  price: number;
  quantity: number;
}

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

export default function BreakfastTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealType = searchParams.get('type') || 'breakfast';
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // User / UI states
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [hallDetails, setHallDetails] = useState<HallDetails | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Menu and selection states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  // Fetch logged-in user - FIXED USEEFFECT
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
        
        // Check if email exists before calling fetchUserDetails
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


  // Fetch user details from users table
  const fetchUserDetails = async (email: string) => {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error fetching user details:', error);
    } else {
      setUserDetails(userData);
      // Fetch hall details
      await fetchHallDetails(userData.hall_id);
    }
    return userData;
  };

  // Fetch hall details
  const fetchHallDetails = async (hallId: number) => {
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
  };

  // Fetch menu items for the selected date, meal type, and user's specific hall
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedDate || !userDetails) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .eq('menu_date', selectedDate)
          .eq('meal_type', mealType)
          .eq('hall_id', userDetails.hall_id) // Only show items from student's hall
          .eq('available', true)
          .order('item_name');

        if (error) {
          console.error('Error fetching menu items:', error);
        } else {
          setMenuItems(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedDate, mealType, userDetails]);

  // Calculate total price
  const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Handle item selection
  const handleItemSelect = (item: MenuItem) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(i => i.menu_id === item.menu_id);
      if (existingItem) {
        return prev.map(i =>
          i.menu_id === item.menu_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Handle quantity change
  const handleQuantityChange = (menuId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedItems(prev => prev.filter(item => item.menu_id !== menuId));
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.menu_id === menuId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  // Remove item from selection
  const handleRemoveItem = (menuId: number) => {
    setSelectedItems(prev => prev.filter(item => item.menu_id !== menuId));
  };

  // Generate random 4-digit token
  const generateToken = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Handle proceed to token
  const handleProceedToToken = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    setProcessing(true);
    try {
      // Generate token
      const token = generateToken();
      setGeneratedToken(token);

      // Insert token into tokens table
      const { error: tokenError } = await supabase
        .from('tokens')
        .insert({
          user_id: userDetails?.user_id,
          token_date: selectedDate,
          status: 'pending',
          token: token,
          meal_type: mealType
        });

      if (tokenError) {
        console.error('Error creating token:', tokenError);
        alert('Error creating token. Please try again.');
        return;
      }

      // Send email with token (you would integrate with your email service here)
      await sendTokenEmail(token);

      // Show success modal
      setShowTokenModal(true);

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Mock function to send email (replace with actual email service)
  const sendTokenEmail = async (token: string) => {
    console.log(`Sending token ${token} to ${userDetails?.email}`);
    // In a real application, you would integrate with an email service
  };

  // Handle cancel
  const handleCancel = () => {
    router.back();
  };

  // Handle close token modal
  const handleCloseTokenModal = () => {
    setShowTokenModal(false);
    router.push('/customer/dashboard');
  };

  // Format date for display
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out bg-gradient-to-b from-black to-gray-900 shadow-xl w-64 z-50`}
      >
        <div className="flex justify-between items-center p-5 border-b border-indigo-700">
          <h2 className="text-xl font-bold text-white">Navigation</h2>
          <XMarkIcon
            className="h-6 w-6 cursor-pointer text-white"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <nav className="flex flex-col p-4 space-y-3 mt-4">
          <button
            onClick={() => router.push("/customer/dashboard")}
            className="text-left px-4 py-3 text-white hover:bg-indigo-700 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-40">
          <Bars3Icon 
            className="h-8 w-8 text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
          />

          <h1 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Token Selection
          </h1>

          <button
            onClick={() => setShowAccountModal(!showAccountModal)}
            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors group"
          >
            <UserCircleIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Account</span>
          </button>
        </header>

        {/* Account Modal */}
        {showAccountModal && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 right-6 bg-white rounded-xl shadow-xl p-5 w-72 z-50 border border-gray-200"
          >
            <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">Account Information</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium text-gray-600">Email:</span> 
                <span className="text-gray-800">{user?.email}</span>
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium text-gray-600">Name:</span> 
                <span className="text-gray-800">{userDetails?.name}</span>
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium text-gray-600">Hall:</span> 
                <span className="text-gray-800">{hallDetails?.hall_name}</span>
              </p>
            </div>
            <button
              onClick={() => {
                supabase.auth.signOut();
                router.push('/login');
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
            >
              Logout
            </button>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Select Your {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Items
                </h2>
                <p className="text-gray-600 text-lg">
                  For {formattedDate}
                </p>
                {hallDetails && (
                  <div className="flex items-center gap-2 mt-2">
                    <BuildingLibraryIcon className="h-5 w-5 text-indigo-600" />
                    <span className="text-gray-700 font-medium">
                      {hallDetails.hall_name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      (Hall ID: {hallDetails.hall_id})
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                  <ShoppingCartIcon className="h-6 w-6 text-indigo-600" />
                  <span>Selected Items: {selectedItems.length}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu Items Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BuildingLibraryIcon className="h-6 w-6 text-indigo-600" />
                    Available Items for {hallDetails?.hall_name}
                  </h3>
                  {loading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <BuildingLibraryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      No {mealType} items available for {hallDetails?.hall_name}
                    </p>
                    <p className="text-gray-400">
                      on {formattedDate}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.map((item, index) => (
                      <motion.div
                        key={item.menu_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => handleItemSelect(item)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">
                            {item.item_name}
                          </h4>
                          <span className="font-bold text-green-600">
                            ৳{item.price}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            item.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Available' : 'Not Available'}
                          </span>
                          <button className="text-indigo-600 hover:text-indigo-800 font-semibold">
                            Add +
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Selected Items Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24"
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <ShoppingCartIcon className="h-6 w-6 text-indigo-600" />
                  Selected Items
                </h3>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No items selected yet</p>
                    <p className="text-sm text-gray-400 mt-2">Click on items from the menu to add them</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.menu_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{item.item_name}</h4>
                            <button
                              onClick={() => handleRemoveItem(item.menu_id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-green-600">৳{item.price}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.menu_id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="font-semibold w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.menu_id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-right text-sm text-gray-600">
                            Subtotal: ৳{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Price */}
                    <div className="border-t border-gray-200 mt-6 pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Price:</span>
                        <span className="text-green-600">৳{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={handleProceedToToken}
                        disabled={processing || selectedItems.length === 0}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          processing || selectedItems.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
                        }`}
                      >
                        {processing ? 'Processing...' : 'Proceed for Token'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Token Success Modal */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Token Generated Successfully!
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Your {mealType} token for {formattedDate}</p>
                  <div className="text-3xl font-bold text-indigo-600 tracking-wider">
                    {generatedToken}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Hall: {hallDetails?.hall_name}
                  </p>
                </div>

                <p className="text-gray-600 mb-2">
                  A confirmation email with your token has been sent to:
                </p>
                <p className="font-semibold text-gray-800 mb-6">
                  {userDetails?.email}
                </p>

                <button
                  onClick={handleCloseTokenModal}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}