// app/student/bill-details/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMonthlyAmount, setTotalMonthlyAmount] = useState(0);
  
  useEffect(() => {
    if (month) {
      fetchUserInfo();
      fetchTokensAndCalculateBill();
      fetchMonthlyBill();
    }
  }, [month, year]);
  
  // মাসের নাম থেকে নম্বরে কনভার্ট করার ফাংশন
  const getMonthNumber = (monthName: string): string => {
    const months: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12',
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'ma': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const normalizedMonth = monthName.toLowerCase();
    return months[normalizedMonth] || '01';
  };
  
  // YYYYMM ফরম্যাটে bill_month তৈরি করার ফাংশন
  const getFormattedBillMonth = (): string => {
    if (!month) return '';
    const monthNumber = getMonthNumber(month);
    return `${year}${monthNumber}`; // YYYYMM format (6 characters)
  };
  
  const fetchUserInfo = async () => {
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (userData.user?.email) {
        // Fetch user info from users table
        const { data: userInfoData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.user.email)
          .single();
        
        if (userError) throw userError;
        
        if (userInfoData) {
          setUserInfo(userInfoData);
          
          // Fetch hall info
          const { data: hallData, error: hallError } = await supabase
            .from('halls')
            .select('*')
            .eq('hall_id', userInfoData.hall_id)
            .single();
          
          if (hallError) throw hallError;
          
          if (hallData) {
            setHallInfo(hallData);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setError("Failed to load user information");
    }
  };
  
  const fetchTokensAndCalculateBill = async () => {
    setLoading(true);
    setError(null);
    
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user?.email) {
      setError("Authentication failed");
      setLoading(false);
      return;
    }
    
    try {
      // Get current user's user_id
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', userData.user.email)
        .single();
      
      if (userError || !currentUser) {
        setError("User not found");
        setLoading(false);
        return;
      }
      
      // Fetch tokens for the selected month and year
      const { data: tokensData, error: tokensError } = await supabase
        .from('tokens')
        .select(`
          *,
          token_items (*)
        `)
        .eq('user_id', currentUser.user_id)
        .eq('status', 'approved')
        .order('token_date', { ascending: true });
      
      if (tokensError) throw tokensError;
      
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
      setError("Failed to load token data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMonthlyBill = async () => {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user?.email) {
      setError("Authentication failed");
      return;
    }
    
    try {
      // Get current user's user_id
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', userData.user.email)
        .single();
      
      if (userError || !currentUser) return;
      
      // Check if monthly bill exists in bills table
      const billMonth = getFormattedBillMonth();
      const { data: monthlyBillData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', currentUser.user_id)
        .eq('bill_month', billMonth)
        .single();
      
      if (billError) {
        // If no bill found, that's okay - we'll create one later
        console.log("No existing bill found, will create new one");
        return;
      }
      
      if (monthlyBillData) {
        setMonthlyBill(monthlyBillData);
      }
    } catch (error) {
      console.error("Error fetching monthly bill:", error);
      // If no bill exists, monthlyBill will remain null
    }
  };
  
  // Handle payment redirect
  const handlePaymentRedirect = async () => {
    setPaymentLoading(true);
    setError(null);
    
    if (totalMonthlyAmount === 0) {
      setError("No billable amount for this month.");
      setPaymentLoading(false);
      return;
    }
    
    try {
      let billId = monthlyBill?.bill_id;
      
      // If no bill exists, create one
      if (!monthlyBill) {
        if (!userInfo) {
          throw new Error("User information not available");
        }
        
        const billMonth = getFormattedBillMonth();
        
        // Insert new monthly bill
        const { data: newBill, error: billError } = await supabase
          .from('bills')
          .insert({
            user_id: userInfo.user_id,
            hall_id: userInfo.hall_id,
            bill_month: billMonth, // YYYYMM format (6 characters)
            total_amount: Number(totalMonthlyAmount.toFixed(2)),
            status: 'unpaid',
            generated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (billError) {
          console.error("Bill creation error details:", {
            message: billError.message,
            details: billError.details,
            hint: billError.hint,
            code: billError.code
          });
          throw new Error(`Failed to create bill: ${billError.message}`);
        }
        
        if (!newBill) {
          throw new Error("No bill data returned");
        }
        
        billId = newBill.bill_id;
        setMonthlyBill(newBill);
      }
      
      // Validate billId
      if (!billId || billId <= 0) {
        throw new Error("Invalid bill ID");
      }
      
      // Validate amount
      if (totalMonthlyAmount <= 0) {
        throw new Error("Invalid payment amount");
      }
      
      // Prepare payment parameters
      const paymentParams = new URLSearchParams({
        bill_id: billId.toString(),
        amount: totalMonthlyAmount.toFixed(2),
        month: month!,
        year: year
      });
      
      console.log("Redirecting to payment with params:", paymentParams.toString());
      
      // Navigate to payment page
      router.push(`/student/payment?${paymentParams.toString()}`);
      
    } catch (error) {
      console.error("Payment redirect error:", error);
      setError("Failed to proceed with payment");
      setPaymentLoading(false);
    }
  };

  // View payment receipt
  const viewReceipt = async () => {
    if (!monthlyBill) return;
    
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('bill_id', monthlyBill.bill_id)
        .eq('status', 'success')
        .order('payment_date', { ascending: false })
        .limit(1)
        .single();
      
      if (paymentError) {
        alert("No payment receipt found.");
        return;
      }
      
      if (paymentData) {
        router.push(`/student/payment/receipt?payment_id=${paymentData.payment_id}`);
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
  
  const getMealTypeLabel = (type: string) => {
    switch(type) {
      case 'breakfast': return '🍳 Breakfast';
      case 'lunch': return '🍛 Lunch';
      case 'dinner': return '🍽️ Dinner';
      default: return type;
    }
  };
  
  // Display month name in title
  const getDisplayMonth = () => {
    if (!month) return '';
    return month.charAt(0).toUpperCase() + month.slice(1);
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
                {getDisplayMonth()} {year} • {hallInfo?.hall_name}
              </p>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}
        
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
                <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-indigo-800 rounded-full">
                  {hallInfo?.hall_name}
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm text-gray-600">Monthly Total</p>
              <p className="text-3xl font-bold text-indigo-600">
                tk{totalMonthlyAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Monthly Bill Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                Monthly Bill Summary
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {getDisplayMonth()} {year}
              </p>
            </div>
            
            {/* Payment Button */}
            <div>
              {monthlyBill ? (
                monthlyBill.status === 'unpaid' ? (
                  <button
                    onClick={handlePaymentRedirect}
                    disabled={paymentLoading || totalMonthlyAmount === 0}
                    className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                      paymentLoading || totalMonthlyAmount === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 text-white'
                    }`}
                  >
                    {paymentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="h-5 w-5" />
                        Pay Now
                      </>
                    )}
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
                  onClick={handlePaymentRedirect}
                  disabled={paymentLoading}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                    paymentLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white'
                  }`}
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Preparing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
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
                <p className="font-semibold text-indigo-700">
                  tk{monthlyBill.total_amount.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${
                  monthlyBill.status === 'paid' 
                    ? 'text-green-700' 
                    : 'text-indigo-700'
                }`}>
                  {monthlyBill.status.toUpperCase()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Generated</p>
                <p className="font-semibold text-black">
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
              <p className="text-gray-500">No tokens found for {getDisplayMonth()} {year}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyBills.map((dayBill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {formatDate(dayBill.date)}
                    </h3>
                    <p className="font-bold text-indigo-700">
                      tk{dayBill.total_amount.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {dayBill.tokens.map((token, tokenIndex) => (
                      <div key={tokenIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="text-black font-medium">{token.token}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {getMealTypeLabel(token.meal_type)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-black font-semibold">
                            tk{(
                              token.token_items?.reduce(
                                (sum, item) => sum + (item.price * item.quantity), 
                                0
                              ) || 0
                            ).toFixed(2)}
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