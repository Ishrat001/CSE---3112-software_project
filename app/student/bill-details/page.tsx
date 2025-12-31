// app/student/bill-details/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";


interface TokenWithItems {
  token_id: number;
  user_id: number;
  hall_id: number;
  token_date: string;
  token: string;
  meal_type: string;
  status: string;
  created_at: string;
  token_items?: {
    item_name: string;
    price: number;
    quantity: number;
  }[];
}

interface DailyBill {
  date: string;
  total_amount: number;
  tokens: TokenWithItems[];
}

interface MonthlyBill {
  bill_id: number;
  user_id: number;
  bill_month: string;
  total_amount: number;
  status: string;
  generated_at: string;
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

interface HallInfo {
  hall_id: number;
  hall_name: string;
}
export default function BillDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const month = searchParams.get('month');
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  
  const [dailyBills, setDailyBills] = useState<DailyBill[]>([]);
  const [monthlyBill, setMonthlyBill] = useState<MonthlyBill | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [hallInfo, setHallInfo] = useState<HallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalMonthlyAmount, setTotalMonthlyAmount] = useState(0);
  
  useEffect(() => {
    if (month) {
      fetchUserInfo();
      fetchTokensAndCalculateBill();
      fetchMonthlyBill();
    }
  }, [month, year]);
  
  const fetchUserInfo = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email) {
      // Fetch user info from users table
      const { data: userInfoData } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.user.email)
        .single();
      
      if (userInfoData) {
        setUserInfo(userInfoData);
        
        // Fetch hall info
        const { data: hallData } = await supabase
          .from('halls')
          .select('*')
          .eq('hall_id', userInfoData.hall_id)
          .single();
        
        if (hallData) {
          setHallInfo(hallData);
        }
      }
    }
  };
  
  const fetchTokensAndCalculateBill = async () => {
    setLoading(true);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      setLoading(false);
      return;
    }
    
    try {
      // Get current user's user_id
      const { data: currentUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', userData.user.email)
        .single();
      
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      // Fetch tokens for the selected month and year
      const { data: tokensData } = await supabase
        .from('tokens')
        .select(`
          *,
          token_items (*)
        `)
        .eq('user_id', currentUser.user_id)
        .eq('status', 'approved') // শুধুমাত্র approved tokens
        .order('token_date', { ascending: true });
      
      if (tokensData) {
        // Filter tokens by month and year
        const filteredTokens = tokensData.filter(token => {
          const tokenDate = new Date(token.token_date);
          const tokenMonth = tokenDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
          const tokenYear = tokenDate.getFullYear();
          
          return tokenMonth === month?.toLowerCase() && tokenYear.toString() === year;
        });
        
        // Group tokens by date
        const tokensByDate: { [date: string]: TokenWithItems[] } = {};
        
        filteredTokens.forEach(token => {
          const dateStr = token.token_date.split('T')[0];
          
          if (!tokensByDate[dateStr]) {
            tokensByDate[dateStr] = [];
          }
          
          tokensByDate[dateStr].push(token);
        });
        
        // Calculate daily totals and create DailyBill array
        const dailyBillsArray: DailyBill[] = Object.entries(tokensByDate).map(([date, tokens]) => {
          const dailyTotal = tokens.reduce((sum, token) => {
            const tokenTotal = token.token_items?.reduce(
              (itemSum, item) => itemSum + (item.price * item.quantity), 
              0
            ) || 0;
            return sum + tokenTotal;
          }, 0);
          
          return {
            date,
            total_amount: dailyTotal,
            tokens
          };
        });
        
        // Sort by date
        dailyBillsArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setDailyBills(dailyBillsArray);
        
        // Calculate total monthly amount
        const monthlyTotal = dailyBillsArray.reduce((sum, day) => sum + day.total_amount, 0);
        setTotalMonthlyAmount(monthlyTotal);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthlyBill = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) return;
    
    try {
      // Get current user's user_id
      const { data: currentUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', userData.user.email)
        .single();
      
      if (!currentUser) return;
      
      // Check if monthly bill exists in bills table
      const { data: monthlyBillData } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', currentUser.user_id)
        .eq('bill_month', `${month}_${year}`)
        .single();
      
      if (monthlyBillData) {
        setMonthlyBill(monthlyBillData);
      }
    } catch (error) {
      console.error("Error fetching monthly bill:", error);
      // If no bill exists, monthlyBill will remain null
    }
  };
  
  const generateMonthlyBill = async () => {
    if (!userInfo) {
      alert("User information not found.");
      return;
    }
    
    if (totalMonthlyAmount === 0) {
      alert("No tokens found for this month.");
      return;
    }
    
    try {
      const billMonth = `${month}_${year}`;
      
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: userInfo.user_id,
          bill_month: billMonth,
          total_amount: totalMonthlyAmount,
          status: 'unpaid'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error generating bill:", error);
        alert("Failed to generate monthly bill.");
      } else {
        setMonthlyBill(data);
        alert("Monthly bill generated successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate monthly bill.");
    }
  };
    
    // Redirect to payment page
  const handlePaymentRedirect = () => {
    if (!monthlyBill) {
      alert("No monthly bill found.");
      return;
    }
    
    // Redirect to payment page with bill details
    router.push(`/student/payment?bill_id=${monthlyBill.bill_id}&amount=${totalMonthlyAmount}&month=${month}&year=${year}`);
  };

  // View payment receipt
  const viewReceipt = async () => {
    if (!monthlyBill) return;
    
    try {
      const { data: paymentData } = await supabase
        .from('payments')
        .select('*')
        .eq('bill_id', monthlyBill.bill_id)
        .eq('status', 'success')
        .order('payment_date', { ascending: false })
        .limit(1)
        .single();
      
      if (paymentData) {
        router.push(`/student/payment/receipt?payment_id=${paymentData.payment_id}`);
      } else {
        alert("No payment receipt found.");
      }
    } catch (error) {
      console.error("Error fetching receipt:", error);
      alert("Could not load receipt.");
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  const getMealTypeLabel = (type: string) => {
    switch(type) {
      case 'breakfast': return '🍳 Breakfast';
      case 'lunch': return '🍛 Lunch';
      case 'dinner': return '🍽️ Dinner';
      default: return type;
    }
  };
  
  if (!month) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Month not specified</h1>
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
          <p className="mt-4 text-gray-600">Loading bill details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Bill Details</h1>
              <p className="text-sm text-gray-600">
                {month.charAt(0).toUpperCase() + month.slice(1)} {year} • {hallInfo?.hall_name}
              </p>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{userInfo?.name}</h2>
              <p className="text-gray-600">{userInfo?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                  {userInfo?.registration_no}
                </span>
                <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                  {hallInfo?.hall_name}
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm text-gray-600">Monthly Total</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(totalMonthlyAmount)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Monthly Bill Summary - UPDATED */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Monthly Bill Summary
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {month?.charAt(0).toUpperCase() + month?.slice(1)} {year}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div>
              {monthlyBill ? (
                monthlyBill.status === 'unpaid' ? (
                  <button
                    onClick={handlePaymentRedirect}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    Pay Now
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Paid
                    </span>
                    <button
                      onClick={viewReceipt}
                      className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      View Receipt
                    </button>
                  </div>
                )
              ) : totalMonthlyAmount > 0 ? (
                <button
                  onClick={generateMonthlyBill}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Generate Monthly Bill
                </button>
              ) : (
                <p className="text-gray-500 italic">No billable amount for this month</p>
              )}
            </div>
          </div>
          
          {/* Bill Details */}
          {monthlyBill && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Bill ID</p>
                <p className="font-semibold text-gray-900">#{monthlyBill.bill_id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-green-700 flex items-center">
                  <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                  {monthlyBill.total_amount.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${
                  monthlyBill.status === 'paid' 
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                }`}>
                  {monthlyBill.status.toUpperCase()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Generated</p>
                <p className="font-semibold">
                  {new Date(monthlyBill.generated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Daily Bills Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Breakdown</h2>
          
          {dailyBills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tokens found for {month} {year}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyBills.map((dayBill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {formatDate(dayBill.date)}
                    </h3>
                    <p className="font-bold text-green-700">
                      {formatCurrency(dayBill.total_amount)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {dayBill.tokens.map((token, tokenIndex) => (
                      <div key={tokenIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="font-medium">{token.token}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {getMealTypeLabel(token.meal_type)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(
                              token.token_items?.reduce(
                                (sum, item) => sum + (item.price * item.quantity), 
                                0
                              ) || 0
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {token.token_items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}