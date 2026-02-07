// app/student/menu-view/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeftIcon, 
  CheckCircleIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon 
} from "@heroicons/react/24/outline";

interface MenuItem {
  menu_id: number;
  hall_id: number;
  meal_type: string;
  item_name: string;
  price: number;
  available: boolean;
  menu_date: string;
}

interface HallInfo {
  hall_id: number;
  hall_name: string;
}

interface UserInfo {
  user_id: number;
  hall_id: number;
  user_type: string;
  name: string;
  registration_no: string;
  hall_card_no: string;
  email: string;
  phone: string;
  created_at: string;
}

interface SelectedItem {
  menu_id: number;
  item_name: string;
  price: number;
  quantity: number;
}

export default function MenuViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const hallId = searchParams.get('hall');
  const mealType = searchParams.get('meal');
  const dateParam = searchParams.get('date');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: number]: boolean}>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [hallInfo, setHallInfo] = useState<HallInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
    
  useEffect(() => {
    if (hallId && mealType && dateParam) {
      fetchData();
    }
  }, [hallId, mealType, dateParam]);
  
  const convertToSupabaseFormat = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };
  
  const fetchData = async () => {
    setLoading(true);
    
    const supabaseDate = convertToSupabaseFormat(dateParam || '');
    
    try {
      // Fetch hall info
      const { data: hallData } = await supabase
        .from('halls')
        .select('*')
        .eq('hall_id', hallId)
        .single();
      
      if (hallData) {
        setHallInfo(hallData);
      }
      
      // Fetch current user info
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user?.email) {
        const { data: userInfoData } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.user.email)
          .single();
        
        if (userInfoData) {
          setUserInfo(userInfoData);
        }
      }
      
      // Fetch menu items
      const { data: menuData } = await supabase
        .from('menu')
        .select('*')
        .eq('hall_id', Number(hallId))
        .eq('meal_type', mealType)
        .eq('menu_date', supabaseDate)
        .eq('available', true);
      
      if (menuData) {
        setMenuItems(menuData || []);
      }
      
    } catch (error) {
      console.error("Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleItemSelect = (itemId: number, price: number) => {
    setSelectedItems(prev => {
      const updated = { ...prev, [itemId]: !prev[itemId] };
      
      let total = 0;
      Object.entries(updated).forEach(([id, isSelected]) => {
        if (isSelected) {
          const item = menuItems.find(m => m.menu_id === Number(id));
          if (item) total += item.price;
        }
      });
      setTotalPrice(total);
      
      return updated;
    });
  };
  
  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };
  
  const getSelectedItemsData = (): SelectedItem[] => {
    return menuItems
      .filter(item => selectedItems[item.menu_id])
      .map(item => ({
        menu_id: item.menu_id,
        item_name: item.item_name,
        price: item.price,
        quantity: 1
      }));
  };
  
 const generateToken = async () => {
  // Validation
  if (getSelectedCount() === 0) {
    alert("Please select at least one item!");
    return;
  }
  
  setIsGenerating(true);
  
  const supabaseDate = convertToSupabaseFormat(dateParam || '');
  const token = Math.floor(1000 + Math.random() * 9000).toString();
  const selectedItemsData = getSelectedItemsData();
  
  try {
    // Get current user from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      alert("Please login again.");
      return;
    }

    
    // Get user info
    const { data: currentUser } = await supabase
      .from('users')
      .select('user_id, hall_id')
      .eq('email', user.email)
      .single();
    
    if (!currentUser) {
      alert("User not found in database.");
      return;
    }
    
    // Insert token
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        user_id: currentUser.user_id,
        hall_id: currentUser.hall_id,
        token_date: supabaseDate,
        token: token,
        meal_type: mealType,
        status: 'pending'
      })
      .select()
      .single();
    
    if (tokenError) {
      console.error("Token error:", tokenError);
      throw tokenError;
    }
    
    // Insert items
    if (selectedItemsData.length > 0 && tokenData) {
      const tokenItems = selectedItemsData.map(item => ({
        token_id: tokenData.token_id,
        menu_id: item.menu_id,
        item_name: item.item_name,
        price: item.price,
        quantity: 1
      }));
      
      await supabase
        .from('token_items')
        .insert(tokenItems);
    }
    
    // Success
    alert(`✅ Token ${token} generated!\nAmount: ₹${totalPrice.toFixed(2)}`);
    router.push('/student/dashboard');
    
  } catch (error) {
    console.error('Error generating token:', error);
    alert('Failed to generate token. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    
    try {
      const supabaseDate = convertToSupabaseFormat(dateStr);
      const date = new Date(supabaseDate);
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };
  
  const getMealTypeLabel = (type: string | null) => {
    if (!type) return 'Meal';
    
    switch(type.toLowerCase()) {
      case 'breakfast': return 'Breakfast 🍳';
      case 'lunch': return 'Lunch 🍛';
      case 'dinner': return 'Dinner 🍽️';
      default: return type;
    }
  };
  
  // Order summary component
  const OrderSummary = () => {
    const selectedItemsData = getSelectedItemsData();
    
    if (selectedItemsData.length === 0) return null;
    
    return (
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Order Summary</h3>
        <div className="space-y-3">
          {selectedItemsData.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{item.item_name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="flex items-center">
                <p className="text-sm text-black">(tk)</p>
                <span className="font-semibold text-black">{item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="font-bold text-lg text-black">Total:</span>
            <div className="flex items-center">
              <p className="text-sm text-black">(tk)</p>
              <span className="text-xl font-bold text-indigo-700">{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (!hallId || !mealType || !dateParam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Parameters</h1>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">Select Your Meal</h1>
              <p className="text-sm text-gray-600">
                {hallInfo?.hall_name} • {getMealTypeLabel(mealType)} • {formatDate(dateParam)}
              </p>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Menu Not Available</h2>
            <p className="text-gray-500 mb-6">
              No menu items found for {getMealTypeLabel(mealType)} on {formatDate(dateParam)}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Choose Another Date
            </button>
          </div>
        ) : (
          <>
            <OrderSummary />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {menuItems.map((item) => (
                <motion.div
                  key={item.menu_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all ${
                    selectedItems[item.menu_id] 
                      ? 'border-indigo-500 bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleItemSelect(item.menu_id, item.price)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.item_name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {item.meal_type}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                          Hall: {hallInfo?.hall_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {selectedItems[item.menu_id] ? (
                        <CheckCircleIcon className="h-6 w-6 text-indigo-700" />
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-indigo-700 ml-1">
                        <p className="text-sm text-black">tk</p>
                        {item.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemSelect(item.menu_id, item.price);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedItems[item.menu_id]
                          ? 'bg-red-100 text-pink-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedItems[item.menu_id] ? 'Remove' : 'Select'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center">
                      <ShoppingCartIcon className="h-6 w-6 text-blue-600 mr-2" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {getSelectedCount()} item{getSelectedCount() !== 1 ? 's' : ''} selected
                        </p>
                        <p className="text-sm text-gray-600">
                          Student: {userInfo?.name} • {getMealTypeLabel(mealType)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="text-right mr-6">
                      <p className="text-sm text-black">Total Amount(tk)</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-indigo-700 ml-1">
                          {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-3 border border-indigo-700 text-indigo-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateToken}
                      disabled={getSelectedCount() === 0 || isGenerating}
                      className={`px-6 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center min-w-[150px] ${
                        getSelectedCount() === 0 || isGenerating
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-700 hover:bg-blue-600 text-white shadow-lg'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        'Generate Token'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-24"></div>
          </>
        )}
      </main>
    </div>
  );
}