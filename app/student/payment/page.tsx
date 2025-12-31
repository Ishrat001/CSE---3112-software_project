// app/student/payments/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, JSX } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeftIcon, 
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  ReceiptRefundIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";

interface MonthlyBill {
  bill_id: number;
  user_id: number;
  bill_month: string;
  total_amount: number;
  status: 'paid' | 'unpaid';
  generated_at: string;
  due_date?: string;
  late_fee?: number;
}

interface StudentInfo {
  user_id: number;
  hall_id: number;
  user_type: string;
  name: string;
  registration_no: string;
  hall_card_no: string;
  email: string;
  phone?: string;
  hall_name?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
}

interface PaymentDetails {
  payment_id: number;
  bill_id: number;
  amount: number;
  payment_date: string;
  status: 'success' | 'failed' | 'pending';
  method?: string;
  transaction_id?: string;
}

interface TokenItem {
  token_item_id: number;
  token_id: number;
  menu_id: number;
  item_name: string;
  price: number;
  quantity: number;
  created_at: string;
}

interface TokenWithItems {
  token_id: number;
  user_id: number;
  token_date: string;
  token: string | null;
  status: 'pending' | 'approved' | 'cancelled';
  meal_type: string | null;
  hall_id: number | null;
  token_items: TokenItem[];
}

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const month = searchParams.get('month');
  const currentYear = new Date().getFullYear();
  
  const [monthlyBill, setMonthlyBill] = useState<MonthlyBill | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  
  useEffect(() => {
    if (month) {
      fetchData();
    }
  }, [month]);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        router.push('/login');
        return;
      }
      
      // Fetch student info with hall details
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select(`
          *,
          halls:hall_id (
            hall_name
          )
        `)
        .eq('email', userData.user.email)
        .single();
      
      if (studentError || !studentData) {
        console.error('Error fetching student data:', studentError);
        setLoading(false);
        return;
      }
      
      // Format student info
      const formattedStudentInfo: StudentInfo = {
        user_id: studentData.user_id,
        hall_id: studentData.hall_id,
        user_type: studentData.user_type,
        name: studentData.name,
        registration_no: studentData.registration_no,
        hall_card_no: studentData.hall_card_no,
        email: studentData.email,
        phone: studentData.phone,
        hall_name: studentData.halls?.hall_name
      };
      
      setStudentInfo(formattedStudentInfo);
      
      // Fetch monthly bill for the selected month and current year
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', studentData.user_id)
        .eq('bill_month', `${month}-${currentYear}`)
        .maybeSingle();
      
      if (billError) {
        console.error('Error fetching bill:', billError);
      }
      
      if (billData) {
        setMonthlyBill(billData);
        
        // If bill is paid, fetch payment details
        if (billData.status === 'paid') {
          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('bill_id', billData.bill_id)
            .single();
          
          setPaymentDetails(paymentData);
        }
      } else {
        // If no bill exists, calculate from tokens and create one
        await createMonthlyBill(studentData.user_id);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createMonthlyBill = async (userId: number) => {
    try {
      const monthIndex = getMonthIndex(month!);
      
      // Calculate total from tokens for this month
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      const { data: tokensData, error: tokensError } = await supabase
        .from('tokens')
        .select(`
          *,
          token_items (
            price,
            quantity
          )
        `)
        .eq('user_id', userId)
        .gte('token_date', startDate.toISOString().split('T')[0])
        .lte('token_date', endDate.toISOString().split('T')[0]);
      
      if (tokensError) {
        console.error('Error fetching tokens:', tokensError);
        return;
      }
      
      // Calculate total amount from tokens
      let totalAmount = 0;
      if (tokensData) {
        tokensData.forEach((token: TokenWithItems) => {
          if (token.token_items) {
            token.token_items.forEach((item: TokenItem) => {
              totalAmount += (item.price * item.quantity);
            });
          }
        });
      }
      
      // Create new bill in database
      const newBillData = {
        user_id: userId,
        bill_month: `${month}-${currentYear}`,
        total_amount: totalAmount,
        status: 'unpaid' as const,
        due_date: new Date(currentYear, monthIndex, 15).toISOString(),
        generated_at: new Date().toISOString()
      };
      
      const { data: newBill, error: insertError } = await supabase
        .from('bills')
        .insert(newBillData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating bill:', insertError);
        return;
      }
      
      if (newBill) {
        setMonthlyBill(newBill);
      }
    } catch (error) {
      console.error('Error in createMonthlyBill:', error);
    }
  };

  // Helper function to check if bill is paid
const isBillPaid = (bill: MonthlyBill | null): boolean => {
  return bill?.status === 'paid';
};
  
  const getMonthIndex = (monthName: string): number => {
    const months = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    return months.indexOf(monthName.toLowerCase());
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const calculateDueStatus = () => {
    if (!monthlyBill?.due_date) return { status: 'unknown', days: 0 };
    
    const dueDate = new Date(monthlyBill.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays) };
    } else if (diffDays === 0) {
      return { status: 'today', days: 0 };
    } else {
      return { status: 'pending', days: diffDays };
    }
  };
  
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bkash',
      name: 'bKash',
      icon: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">bK</div>,
      description: 'Pay using bKash mobile banking'
    },
    {
      id: 'nagad',
      name: 'Nagad',
      icon: <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">N</div>,
      description: 'Pay using Nagad mobile banking'
    },
    {
      id: 'rocket',
      name: 'Rocket',
      icon: <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">R</div>,
      description: 'Pay using DBBL Rocket'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCardIcon className="w-8 h-8 text-blue-600" />,
      description: 'Pay using Visa/MasterCard'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <BanknotesIcon className="w-8 h-8 text-green-600" />,
      description: 'Direct bank transfer'
    }
  ];
  
  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    if (!monthlyBill || monthlyBill.status === 'paid') {
      alert('This bill is already paid or invalid');
      return;
    }
    
    setPaymentProcessing(true);
    
    // Generate transaction ID
    const generatedTransactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setTransactionId(generatedTransactionId);
    
    try {
      const billId = monthlyBill.bill_id;
      
      // Update bill status to paid
      const { data: updatedBill, error: billError } = await supabase
        .from('bills')
        .update({
          status: 'paid'
        })
        .eq('bill_id', billId)
        .select()
        .single();
      
      if (billError) {
        console.error('Error updating bill:', billError);
        throw billError;
      }
      
      // Create payment record
      const paymentData = {
        bill_id: billId,
        amount: monthlyBill.total_amount + (monthlyBill.late_fee || 0),
        status: 'success' as const,
        method: selectedPaymentMethod,
        transaction_id: generatedTransactionId,
        payment_date: new Date().toISOString()
      };
      
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();
      
      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw paymentError;
      }
      
      // Update local state
      setMonthlyBill(updatedBill);
      setPaymentDetails(newPayment);
      setPaymentSuccess(true);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  const dueStatus = calculateDueStatus();
  
  if (!month) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Month Selected</h1>
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
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }
  
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          
          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-green-700 text-lg">
                  ₹{monthlyBill?.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold capitalize">{selectedPaymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-8">
            A payment confirmation has been sent to your email at <span className="font-semibold">{studentInfo?.email}</span>
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 border border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              Download Receipt
            </button>
          </div>
        </motion.div>
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
              <h1 className="text-xl font-bold text-gray-900">Make Payment</h1>
              <p className="text-sm text-gray-600">
                {month} {currentYear} • {studentInfo?.hall_name || 'Hostel'}
              </p>
            </div>
            
            <div className="w-10"></div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bill Summary */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Bill Summary Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bill Summary</h2>
                    <p className="text-gray-600">Review your bill before payment</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{month} {currentYear}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-semibold">{studentInfo?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration No</p>
                      <p className="font-semibold">{studentInfo?.registration_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hall</p>
                      <p className="font-semibold">{studentInfo?.hall_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hall Card No</p>
                      <p className="font-semibold">{studentInfo?.hall_card_no}</p>
                    </div>
                  </div>
                  
                  {/* Bill Details */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Base Amount</span>
                        <span className="font-medium">₹{monthlyBill?.total_amount.toFixed(2)}</span>
                      </div>
                      
                      {monthlyBill?.late_fee && monthlyBill.late_fee > 0 && (
                        <div className="flex justify-between items-center text-red-600">
                          <span>Late Fee</span>
                          <span className="font-medium">+ ₹{monthlyBill.late_fee.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                          <div className="flex items-center">
                            <CurrencyRupeeIcon className="h-6 w-6 text-green-600 mr-1" />
                            <span className="text-2xl font-bold text-green-700">
                              ₹{(monthlyBill ? monthlyBill.total_amount + (monthlyBill.late_fee || 0) : 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Due Status */}
                  <div className={`rounded-lg p-4 ${
                    dueStatus.status === 'overdue' ? 'bg-red-50 border border-red-200' :
                    dueStatus.status === 'today' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarDaysIcon className={`h-5 w-5 mr-2 ${
                          dueStatus.status === 'overdue' ? 'text-red-600' :
                          dueStatus.status === 'today' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {dueStatus.status === 'overdue' ? 'Overdue' :
                             dueStatus.status === 'today' ? 'Due Today' :
                             'Due Date'}
                          </p>
                          <p className="text-sm">
                            {monthlyBill?.due_date ? formatDate(monthlyBill.due_date) : 'Not set'}
                            {dueStatus.status === 'overdue' && ` (${dueStatus.days} days overdue)`}
                            {dueStatus.status === 'pending' && ` (${dueStatus.days} days remaining)`}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dueStatus.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        dueStatus.status === 'today' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {dueStatus.status === 'overdue' ? 'URGENT' :
                         dueStatus.status === 'today' ? 'TODAY' :
                         'PENDING'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Status - Show if bill is already paid */}
              {monthlyBill?.status === 'paid' && paymentDetails && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-600 mr-4" />
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">Bill Already Paid</h3>
                      <p className="text-green-700">
                        This bill was paid on {formatDate(paymentDetails.payment_date)} via {paymentDetails.method}.
                      </p>
                      {paymentDetails.transaction_id && (
                        <p className="text-sm text-green-600 mt-2">
                          Transaction ID: <span className="font-mono">{paymentDetails.transaction_id}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Right Column - Payment */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 space-y-6"
            >
              {/* Payment Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <LockClosedIcon className="h-6 w-6 text-green-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
                </div>
                
                {monthlyBill?.status === 'paid' ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="font-semibold text-green-700 mb-2">Payment Completed</p>
                    <p className="text-gray-600">No payment required for this month</p>
                  </div>
                ) : (
                  <>
                    {/* Payment Methods */}
                    {showPaymentMethods ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <h4 className="font-semibold text-gray-800 mb-4">Select Payment Method</h4>
                        
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedPaymentMethod === method.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className="mr-3">
                                {method.icon}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{method.name}</p>
                                <p className="text-sm text-gray-600">{method.description}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPaymentMethod === method.id
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedPaymentMethod === method.id && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={() => setShowPaymentMethods(false)}
                            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Back
                          </button>
                          <button
                            onClick={handlePayment}
                            disabled={!selectedPaymentMethod || paymentProcessing}
                            className={`flex-1 py-2.5 rounded-lg font-semibold ${
                              selectedPaymentMethod && !paymentProcessing
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {paymentProcessing ? 'Processing...' : 'Confirm Payment'}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Amount to Pay</span>
                            <div className="flex items-center">
                              <CurrencyRupeeIcon className="h-5 w-5 text-green-600 mr-1" />
                              <span className="text-2xl font-bold text-green-700">
                                ₹{(monthlyBill ? monthlyBill.total_amount + (monthlyBill.late_fee || 0) : 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: '100%' }}
                            ></div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setShowPaymentMethods(true)}
                          disabled={!monthlyBill || isBillPaid(monthlyBill)}
                          className={`w-full py-3.5 rounded-lg font-semibold flex items-center justify-center ${
                            monthlyBill && !isBillPaid(monthlyBill)
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <CreditCardIcon className="h-5 w-5 mr-2" />
                          {isBillPaid(monthlyBill) ? 'Already Paid' : 'Make Payment'}
                        </button>
                        
                        <p className="text-sm text-gray-500 text-center mt-4">
                          <LockClosedIcon className="h-4 w-4 inline mr-1" />
                          128-bit SSL secured payment
                        </p>
                      </>
                    )}
                    
                    {paymentProcessing && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                          <div>
                            <p className="font-medium text-blue-800">Processing Payment</p>
                            <p className="text-sm text-blue-600">Please don&apos;t close this window</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Help Card */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                <h4 className="font-semibold text-blue-800 mb-3">Need Help?</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <ReceiptRefundIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Payment issues? Contact hostel office: +880 XXXXXXXX</span>
                  </li>
                  <li className="flex items-start">
                    <BanknotesIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Keep transaction ID for future reference</span>
                  </li>
                  <li className="flex items-start">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Payments are processed within 24 hours</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Payment Instructions */}
        {monthlyBill?.status !== 'paid' && selectedPaymentMethod && !showPaymentMethods && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6"
          >
            <h4 className="font-bold text-yellow-800 mb-3 flex items-center">
              <LockClosedIcon className="h-5 w-5 mr-2" />
              Payment Instructions for {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
            </h4>
            {selectedPaymentMethod === 'bkash' && (
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Dial *247# from your bKash registered number</li>
                <li>Choose &quot;Send Money&quot; option</li>
                <li>Enter Merchant Number: <strong>017XXXXXXXX</strong></li>
                <li>Enter Amount: <strong>₹{monthlyBill?.total_amount.toFixed(2)}</strong></li>
                <li>Enter Reference: <strong>STD{studentInfo?.registration_no}</strong></li>
                <li>Enter your bKash PIN to complete</li>
              </ol>
            )}
            {selectedPaymentMethod === 'nagad' && (
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Dial *167# from your Nagad registered number</li>
                <li>Choose &quot;Send Money&quot; option</li>
                <li>Enter Merchant Number: <strong>017XXXXXXXX</strong></li>
                <li>Enter Amount: <strong>₹{monthlyBill?.total_amount.toFixed(2)}</strong></li>
                <li>Enter Reference: <strong>STD{studentInfo?.registration_no}</strong></li>
              </ol>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}