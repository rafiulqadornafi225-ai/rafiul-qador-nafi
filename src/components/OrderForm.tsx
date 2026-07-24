import React, { useState, useEffect } from 'react';
import { Send, FileCheck, Smartphone, ShoppingCart, Check, MessageSquare, Copy } from 'lucide-react';
import { Jersey, Order } from '../types';
import { JERSEYS } from '../data';

interface OrderFormProps {
  preselectedJersey: Jersey | null;
  preselectedSize: string;
  bKashNumber: string;
  nagadNumber: string;
  whatsappNumber?: string | null;
  bKashQR?: string | null;
  nagadQR?: string | null;
  onOrderSubmit: (order: Order) => void;
  onClose?: () => void;
  jerseysList: Jersey[]; // Let's support custom uploaded list
}

export default function OrderForm({
  preselectedJersey,
  preselectedSize,
  bKashNumber,
  nagadNumber,
  whatsappNumber = null,
  bKashQR = null,
  nagadQR = null,
  onOrderSubmit,
  onClose,
  jerseysList,
}: OrderFormProps) {
  // Use jerseysList from props, fallback to global list in data
  const activeJerseys = jerseysList && jerseysList.length > 0 ? jerseysList : JERSEYS;
  
  const [selectedJerseyId, setSelectedJerseyId] = useState(preselectedJersey?.id || activeJerseys[0].id);
  const [size, setSize] = useState(preselectedSize || 'M');
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash (bKash Personal)');
  const [transactionId, setTransactionId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [copiedInvoiceText, setCopiedInvoiceText] = useState(false);
  const [copiedType, setCopiedType] = useState<'bKash' | 'Nagad' | null>(null);

  const handleCopyAndPay = (type: 'bKash' | 'Nagad', mobileNum: string) => {
    navigator.clipboard.writeText(mobileNum.trim());
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 3000);
    const destination = type === 'bKash' ? 'https://www.bkash.com/app/' : 'https://www.nagad.com.bd';
    window.open(destination, '_blank');
  };

  useEffect(() => {
    if (preselectedJersey) {
      setSelectedJerseyId(preselectedJersey.id);
    }
  }, [preselectedJersey]);

  useEffect(() => {
    if (preselectedSize) {
      setSize(preselectedSize);
    }
  }, [preselectedSize]);

  // Adjust in case selected jersey is not in the active selection (e.g. deleted or changed)
  const activeJersey = activeJerseys.find((j) => j.id === selectedJerseyId) || activeJerseys[0] || JERSEYS[0];
  const totalPriceBDT = activeJersey.priceBDT * quantity;
  const totalPriceUSD = Number((activeJersey.priceUSD * quantity).toFixed(1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !transactionId || !shippingAddress) {
      alert('Please fill out all mandatory shipping & payment details');
      return;
    }

    setIsSubmitting(true);

    // Simulate validation ledger write delay
    setTimeout(() => {
      const newOrder: Order = {
        id: 'JB-' + Math.floor(100000 + Math.random() * 900000),
        jerseyId: activeJersey.id,
        jerseyName: activeJersey.name,
        countryName: activeJersey.country,
        size,
        quantity,
        customerName,
        customerPhone,
        paymentMethod,
        transactionId: transactionId.trim().toUpperCase(),
        amount: totalPriceBDT,
        timestamp: new Date().toLocaleString(),
        status: 'Pending Verification',
        customName: customName.trim().toUpperCase() || undefined,
        customNumber: customNumber.trim() || undefined,
      };

      onOrderSubmit(newOrder);
      setGeneratedOrder(newOrder);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const getWhatsAppText = () => {
    if (!generatedOrder) return '';
    let text = `🔔 *নতুন অর্ডার কনফার্মেশন - NAFI JERSEY HOUSE*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 *কাস্টমার নাম:* ${generatedOrder.customerName}\n`;
    text += `📞 *মোবাইল নম্বর:* ${generatedOrder.customerPhone}\n`;
    text += `👕 *জর্সি:* ${generatedOrder.jerseyName} (সাইজ: ${generatedOrder.size})\n`;
    if (generatedOrder.customName || generatedOrder.customNumber) {
      text += `✏️ *কাস্টম প্রিন্ট:* নাম "${generatedOrder.customName || 'N/A'}" | নম্বর "${generatedOrder.customNumber || 'N/A'}"\n`;
    }
    text += `🔢 *পরিমাণ:* ${generatedOrder.quantity} টি\n`;
    text += `💰 *মোট বিল:* BDT ${generatedOrder.amount}\n`;
    text += `💳 *পেমেন্ট মাধ্যম:* ${generatedOrder.paymentMethod}\n`;
    text += `⚡ *ট্রানজেকশন আইডি (TrxID):* ${generatedOrder.transactionId}\n`;
    text += `🏠 *ডেলিভারি ঠিকানা:* ${shippingAddress}\n`;
    text += `━━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━ ━━\n`;
    text += `*নোট:* কেউ কনফার্ম করেছে, টাকা পাঠানো হয়েছে। টাকা বিকাশের নম্বরের সাথে মিলছে কিনা, সেটা চেক করা হবে।`;
    return text;
  };

  const getFormattedWhatsAppUrl = () => {
    const rawNumber = (whatsappNumber || bKashNumber || '01402580064').trim();
    let cleaned = rawNumber.replace(/\D/g, '');
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '88' + cleaned;
    }
    const txt = getWhatsAppText();
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(txt)}`;
  };

  const getFBMessengerText = () => {
    if (!generatedOrder) return '';
    let text = `Assalamu Alaikum, I just submitted a transaction on Jersey Bazaar!\n\nOrder ID: ${generatedOrder.id}\nJersey: ${generatedOrder.jerseyName} (Size: ${generatedOrder.size})`;
    if (generatedOrder.customName || generatedOrder.customNumber) {
      text += `\nCustom Print: Name: "${generatedOrder.customName || 'N/A'}" | Number: "${generatedOrder.customNumber || 'N/A'}"`;
    }
    text += `\nQuantity: ${generatedOrder.quantity}\nPayment Method: ${generatedOrder.paymentMethod}\nTRX ID: ${generatedOrder.transactionId}\nAmount: BDT ${generatedOrder.amount}\nName: ${generatedOrder.customerName}\nPhone: ${generatedOrder.customerPhone}\nAddress: ${shippingAddress}`;
    return text;
  };

  const copyInvoiceDetails = () => {
    const text = getWhatsAppText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedInvoiceText(true);
      setTimeout(() => setCopiedInvoiceText(false), 2500);
    }
  };

  if (isSuccess && generatedOrder) {
    return (
      <div className="bg-[#141414] border border-emerald-500/20 p-6 md:p-8 rounded-xl relative text-center font-sans">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileCheck className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-white font-sans">Order Recorded Successfully!</h3>
        <p className="text-xs text-zinc-300 mt-2 max-w-md mx-auto leading-relaxed">
          আপনার অর্ডার আইডি: <span className="font-mono font-bold text-emerald-400">{generatedOrder.id}</span> | bKash TrxID: <span className="font-mono font-bold text-amber-400">{generatedOrder.transactionId}</span>
          <br />
          <span className="text-zinc-400 text-[11px] block mt-1">নিচের বাটনে ক্লিক করে ফেসবুক পেজে বা হোয়াটসঅ্যাপে মেসেজ দিয়ে দিন।</span>
        </p>

        {/* Invoice Summary Box */}
        <div className="my-6 bg-black/60 p-4 rounded-sm text-left border border-white/10 max-w-md mx-auto">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold">
            Order Invoice Details
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-zinc-400">Order Reference:</span>
              <span className="font-mono text-white font-bold">{generatedOrder.id}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-zinc-400">Jersey Selected:</span>
              <span className="text-white font-bold">{generatedOrder.jerseyName}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-zinc-400">Size & Count:</span>
              <span className="text-white font-mono font-bold">{generatedOrder.size} (Qty: {generatedOrder.quantity})</span>
            </div>
            {(generatedOrder.customName || generatedOrder.customNumber) && (
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-zinc-400">Custom Printing:</span>
                <span className="text-indigo-400 font-mono font-bold truncate">
                  {generatedOrder.customName || 'N/A'} | #{generatedOrder.customNumber || 'N/A'}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-zinc-400">Amount Transferred:</span>
              <span className="text-emerald-400 font-mono font-bold">BDT {generatedOrder.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Transaction ID:</span>
              <span className="text-amber-400 font-mono font-bold">{generatedOrder.transactionId}</span>
            </div>
          </div>
        </div>

        {/* Action button container */}
        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={copyInvoiceDetails}
            className="flex items-center justify-center gap-1.5 w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-bold py-3.5 rounded-sm transition-all"
          >
            {copiedInvoiceText ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-emerald-450">১. অর্ডার সামারি কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4.5 h-4.5" />
                <span>১. অর্ডার সামারি ক্লিক করে কপি করুন</span>
              </>
            )}
          </button>

          {/* Primary WhatsApp Direct Dispatch button */}
          <a
            id="whatsapp-direct-confirm-btn"
            href={getFormattedWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#25d366] hover:bg-[#20ba5a] text-zinc-950 text-xs font-black py-4 rounded-lg transition-all shadow-xl shadow-emerald-950/20 active:scale-95 uppercase tracking-wider"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping"></span>
            <span>২. WhatsApp এ অর্ডার কনফার্ম করুন (অটো মেসেজ)</span>
          </a>

          <a
            id="fb-messenger-launch-btn"
            href="https://www.facebook.com/share/1Bh4gYajWE/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#1877f2] hover:bg-[#155fc3] text-white text-xs font-bold py-3 rounded-sm transition-all shadow-sm active:scale-95 uppercase tracking-wider opacity-85 hover:opacity-100"
          >
            <MessageSquare className="w-4 h-4" />
            <span>অথবা, Facebook পেইজে কনফার্ম করুন</span>
          </a>

          <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-3">
            💡 <strong>নির্দেশনা:</strong> উপরের **১ম বাটনে** ক্লিক করে অর্ডার তথ্য ক্লিপবোর্ডে কপি করুন। এরপর **২য় বাটনে** ক্লিক করলে সরাসরি আপনার WhatsApp ওপেন হবে, সেখানে পেস্ট করে মেসেজ পাঠিয়ে দিন। আমাদের পেমেন্ট ভেরিফিকেশন টিম দ্রুত অর্ডারটি প্রোসেস করে ডেলিভারি শুরু করবে!
          </p>

          <button
            id="new-checkout-form-reset"
            onClick={() => {
              setIsSuccess(false);
              setCustomerName('');
              setCustomerPhone('');
              setTransactionId('');
              setShippingAddress('');
              setQuantity(1);
              setCustomName('');
              setCustomNumber('');
              if (onClose) onClose();
            }}
            className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 mt-2 transition-all cursor-pointer font-bold block mx-auto uppercase tracking-wider text-[10px]"
          >
            Submit Another Payment Transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#0c0f0e]/95 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl relative font-sans shadow-2xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-display font-extrabold text-white tracking-tighter uppercase">
            Order & Transaction Ledger Log
          </h3>
          <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest mt-1 font-bold">
            ⚡ Peer Manual Audited Settlement
          </p>
        </div>
        {onClose && (
          <button
            id="checkout-form-close"
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-mono text-xs hover:bg-white/5 px-2.5 py-1.5 rounded-sm transition-all"
          >
            Close
          </button>
        )}
      </div>

      {/* Select active products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
            1. Select Club/Country Jersey
          </label>
          <select
            id="order-jersey-select"
            value={selectedJerseyId}
            onChange={(e) => setSelectedJerseyId(e.target.value)}
            className="w-full bg-black text-zinc-250 text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
            required
          >
            {activeJerseys.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name} - BDT {j.priceBDT}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              2. Size
            </label>
            <select
              id="order-size-select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-black text-zinc-250 text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              required
            >
              {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              3. Qty
            </label>
            <input
              id="order-quantity"
              type="number"
              min="1"
              max="20"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-black text-zinc-250 font-mono text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500 transition-all"
              required
            />
          </div>
        </div>
      </div>      {/* Payment details instructions */}
      <div className="bg-[#0b0f0d] border border-emerald-500/20 rounded-2xl p-5 mb-5 space-y-4 text-xs text-zinc-300">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="w-full">
            <p className="font-display font-extrabold text-white uppercase text-[11px] tracking-wider mb-1.5 flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              মোবাইল ওয়ালেট পেমেন্ট নির্দেশিকা (Mobile Payment instructions)
            </p>
            <p className="leading-relaxed text-zinc-300">
              অর্ডারটি সম্পূর্ণ করতে অনুগ্রহ করে মোট <span className="text-emerald-400 font-extrabold">BDT {totalPriceBDT}</span> (~${totalPriceUSD}) আমাদের নিচের যেকোনো একটি সচল নাম্বারে Send Money করুন:
            </p>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              {/* bKash Area */}
              <div className="bg-zinc-950 p-3.5 border border-pink-500/15 rounded-xl text-center space-y-2.5 relative overflow-hidden flex flex-col items-center">
                <span className="text-pink-400 font-sans font-black text-[10px] tracking-wider uppercase">bKash Personal Info</span>
                <span className="text-white font-extrabold text-sm tracking-wide select-all bg-black px-2 py-0.5 rounded border border-white/5">{bKashNumber}</span>
                
                {/* 2026 Direct Payment CTA Deep Link */}
                <button
                  type="button"
                  onClick={() => handleCopyAndPay('bKash', bKashNumber)}
                  className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 bg-[#e2127a] hover:bg-[#c20e64] text-white text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-md active:scale-95 duration-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  {copiedType === 'bKash' ? '✓ নম্বর কপি করা হয়েছে...' : 'bKash পেমেন্ট করতে এখানে ক্লিক করুন'}
                </button>
              </div>

              {/* Nagad Area */}
              <div className="bg-zinc-950 p-3.5 border border-orange-500/15 rounded-xl text-center space-y-2.5 relative overflow-hidden flex flex-col items-center">
                <span className="text-orange-400 font-sans font-black text-[10px] tracking-wider uppercase">Nagad Personal Info</span>
                <span className="text-white font-extrabold text-sm tracking-wide select-all bg-black px-2 py-0.5 rounded border border-white/5">{nagadNumber}</span>
                
                <button
                  type="button"
                  onClick={() => handleCopyAndPay('Nagad', nagadNumber)}
                  className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 bg-[#f6921e] hover:bg-[#d57c13] text-white text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-md active:scale-95 duration-200"
                >
                  {copiedType === 'Nagad' ? '✓ নম্বর কপি করা হয়েছে...' : 'Nagad পেমেন্ট করতে এখানে ক্লিক করুন'}
                </button>
              </div>
            </div>

            <p className="mt-3.5 text-[10.5px] text-zinc-400 leading-relaxed bg-zinc-950/80 p-3 rounded-lg border border-white/5">
              💡 **পেমেন্ট করার পর:** আপনার পেমেন্ট সফলভাবে সম্পন্ন হলে বিকাশ/নগদ থেকে প্রাপ্ত <span className="text-emerald-400 font-bold">Transaction ID (Trx ID)</span> নিচে সঠিক জর্সি সাইজ সহ ইনপুট বক্সে প্রদান করে ওয়ান-ক্লিক সাবমিট করুন। পেমেন্ট তথ্যটি ডাটাবেজে চিরকালের জন্য সংরক্ষিত হয়ে যাবে।
            </p>
          </div>
        </div>
      </div>



      {/* Customer shipping details */}
      <div className="space-y-4">
        <div>
          <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
            4. Your Full Name
          </label>
          <input
            id="order-customer-name"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-black text-zinc-250 text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500"
            placeholder="e.g. Shakib Al Hasan"
            required
          />
        </div>

        <div>
          <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
            5. Your Active Mobile / Phone Number
          </label>
          <input
            id="order-customer-phone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-black text-zinc-250 text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500"
            placeholder="e.g. 01712-XXXXXX"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              6. Payment Method Used
            </label>
            <select
              id="order-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-black text-zinc-250 text-xs px-3 py-2.5 border border-white/15 rounded-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              required
            >
              <option value="Cash (bKash Personal)">Cash (bKash Send Money)</option>
              <option value="Cash (bKash Agent)">Cash (bKash Cash In)</option>
              <option value="Cash (bKash MerchantPayment)">Cash (bKash Payment)</option>
              <option value="Cash (Nagad Personal)">Cash (Nagad Send Money)</option>
              <option value="Cash (Nagad CashIn)">Cash (Nagad Cash In)</option>
              <option value="Cash (Handover)">Hand Cash / Pre-Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-extrabold mb-1.5 flex items-center gap-1">
              7. bKash / Nagad Transaction ID (TrxID) *
            </label>
            <input
              id="order-transaction-id"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full bg-black text-amber-400 font-mono text-xs font-bold px-3 py-2.5 border border-emerald-500/40 focus:outline-none focus:border-emerald-500 rounded-sm uppercase tracking-wide placeholder-zinc-600"
              placeholder="e.g. 9B7A2X18Y (or COD for Cash on Delivery)"
              required
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              বিকাশ/নগদে {bKashNumber} নম্বরে টাকা পাঠানোর পর প্রাপ্ত TrxID লিখুন। ক্যাশ অন ডেলিভারি হলে "COD" লিখুন।
            </p>
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 font-bold">
            8. Delivery Shipping Address
          </label>
          <textarea
            id="order-shipping-address"
            rows={2}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            className="w-full bg-black text-zinc-200 text-xs px-3 py-2.5 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 resize-none transition-all"
            placeholder="House, Street, Area, District (e.g., Block A, Mirpur, Dhaka)"
            required
          />
        </div>

        {/* Custom Jersey Name & Back Number Printing (Optional) */}
        <div className="p-3.5 bg-black/50 border border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>👕</span> Custom Back Name & Jersey Number (Optional)
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">Free Custom Print</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[8px] font-mono text-zinc-400 uppercase mb-1">
                Custom Name on Back
              </label>
              <input
                id="order-custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#111] text-white font-mono text-xs px-2.5 py-1.5 border border-white/10 rounded-sm focus:outline-none focus:border-emerald-500 uppercase"
                placeholder="e.g. MESSI or NAFI"
              />
            </div>
            <div>
              <label className="block text-[8px] font-mono text-zinc-400 uppercase mb-1">
                Custom Jersey Number
              </label>
              <input
                id="order-custom-number"
                type="text"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                className="w-full bg-[#111] text-amber-300 font-mono text-xs font-bold px-2.5 py-1.5 border border-white/10 rounded-sm focus:outline-none focus:border-emerald-500"
                placeholder="e.g. 10 or 7"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing feedback and submit button */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 font-sans">
        <div>
          <span className="text-[9px] text-zinc-550 font-mono uppercase tracking-widest block font-extrabold">Total dynamic bill</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-mono font-black text-white">BDT {totalPriceBDT}</span>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">/ ~${totalPriceUSD}</span>
          </div>
        </div>

        <button
          id="order-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-550 text-white text-[11px] font-black uppercase tracking-wider px-7 py-4 rounded-xl active:scale-95 transition-all duration-300 shadow-xl shadow-emerald-950/40 hover:shadow-emerald-500/10 hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Logging transaction...
            </span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>Submit & Register Order</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
