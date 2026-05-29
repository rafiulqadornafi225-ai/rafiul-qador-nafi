import React, { useState } from 'react';
import { History, Search, ShieldCheck, Key, RefreshCw, HelpCircle, AlertCircle, CheckCircle2, Clock, Trash2, Send, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

interface SecureOrdersPanelProps {
  isAdmin: boolean;
  orders: Order[];
  personalOrders: Order[];
  onOrderUpdate: (orders: Order[]) => void;
  onPersonalOrderDelete: (orderId: string) => void;
}

export default function SecureOrdersPanel({
  isAdmin,
  orders,
  personalOrders,
  onOrderUpdate,
  onPersonalOrderDelete,
}: SecureOrdersPanelProps) {
  const [activeTab, setActiveTab] = useState<'my-orders' | 'lookup' | 'admin-ledger'>(isAdmin ? 'admin-ledger' : 'my-orders');
  
  // Lookup states
  const [lookupId, setLookupId] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  // Auto-validation state for admin mode
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);

  // Force Tab alignment on admin changes
  if (isAdmin && activeTab === 'my-orders' && orders.length > 0 && activeTab !== 'admin-ledger') {
    setActiveTab('admin-ledger');
  }

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim() || !lookupPhone.trim()) {
      setLookupError('Please enter both Order ID/Receipt code and phone number.');
      setLookupResult(null);
      return;
    }

    setLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const resp = await fetch(`/api/orders/lookup?id=${encodeURIComponent(lookupId.trim())}&phone=${encodeURIComponent(lookupPhone.trim())}`);
      if (resp.ok) {
        const data = await resp.json();
        setLookupResult(data.order);
      } else {
        const errData = await resp.json();
        setLookupError(errData.error || 'Invoice not found. Please double check details.');
      }
    } catch (err) {
      setLookupError('Network synchronization error. Please check your internet connection.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleAdminDelete = (orderId: string) => {
    if (confirm('Are you authorized to entirely delete this transaction details from the database?')) {
      const updated = orders.filter((o) => o.id !== orderId);
      onOrderUpdate(updated);
    }
  };

  const simulateAdminAutoVerification = (orderId: string) => {
    setVerifyingOrderId(orderId);
    
    setTimeout(() => {
      const updated = orders.map((o) => {
        if (o.id === orderId) {
          return { ...o, status: 'Verified' as const };
        }
        return o;
      });
      onOrderUpdate(updated);
      setVerifyingOrderId(null);
    }, 1200);
  };

  // Safe phone number mocker to mask customer numbers
  const maskPhone = (phone: string) => {
    const clean = phone.trim();
    if (clean.length < 7) return '***';
    return clean.slice(0, 4) + ' ••••• ' + clean.slice(-3);
  };

  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl font-sans">
      {/* Header Panel Tabs */}
      <div className="bg-black/40 border-b border-white/10 p-4">
        <span className="font-mono text-[9px] text-emerald-400 font-extrabold tracking-widest uppercase block mb-2">
          ✙ Store Security Ledger
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'my-orders'
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Orders ({personalOrders.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'lookup'
                ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Secure Lookup</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin-ledger')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeTab === 'admin-ledger'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Console ({orders.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Render Window */}
      <div className="p-5 min-h-[290px]">
        <AnimatePresence mode="wait">
          {activeTab === 'my-orders' && (
            <motion.div
              key="my-orders"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Your Active Session Log</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Only transactions made from this specific browser/device are stored locally inside cache files.
                </p>
              </div>

              {personalOrders.length === 0 ? (
                <div className="bg-black/35 border border-white/5 p-6 rounded-lg text-center">
                  <History className="w-8 h-8 text-zinc-650 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-zinc-400 font-bold">No Recent Local Purchases</p>
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                    Fill out the transaction form on the left to submit a cash token and start tracking status locally on your device!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {personalOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-black/40 border border-white/5 rounded-lg p-3.5 flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-sm border border-emerald-500/10 uppercase tracking-widest">
                          {order.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-wider ${
                            order.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {order.status === 'Verified' ? (
                            <>
                              <CheckCircle2 className="w-3 text-emerald-400" /> Settled
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 text-amber-400 animate-spin" /> Pending
                            </>
                          )}
                        </span>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-xs text-zinc-200 uppercase tracking-wide truncate">{order.jerseyName}</h5>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-zinc-400 mt-1">
                          <span>Phone: {maskPhone(order.customerPhone)}</span>
                          <span>•</span>
                          <span>Size: <strong className="text-white bg-white/5 px-1 font-mono rounded">{order.size}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold font-mono">BDT {order.amount}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5 text-[9px] text-zinc-500">
                        <span>Submitted {order.timestamp}</span>
                        <button
                          onClick={() => onPersonalOrderDelete(order.id)}
                          className="text-zinc-650 hover:text-red-400 flex items-center gap-0.5 transition-colors uppercase tracking-widest font-mono font-bold"
                          title="Remove from local monitor list"
                        >
                          <Trash2 className="w-3" /> Hide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'lookup' && (
            <motion.div
              key="lookup"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Highly Secure Invoice Query</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  To protect your privacy, you MUST provide BOTH your unique Order ID and the exact phone number registered at transaction submit time.
                </p>
              </div>

              <form onSubmit={handleLookupSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1.5 font-bold">
                      Order ID (eg: JB-774174)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="JB-XXXXXX"
                      value={lookupId}
                      onChange={(e) => setLookupId(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 focus:border-emerald-500 text-white placeholder-zinc-700 text-xs px-3 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/20 tracking-wider font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-500 mb-1.5 font-bold">
                      Customer Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="017XXXXXXXX"
                      value={lookupPhone}
                      onChange={(e) => setLookupPhone(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 focus:border-emerald-500 text-white placeholder-zinc-700 text-xs px-3 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={lookingUp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 font-sans"
                >
                  {lookingUp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Contacting Store Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      <span>Verify My Invoice Details</span>
                    </>
                  )}
                </button>
              </form>

              {/* Lookup results display */}
              <AnimatePresence mode="popLayout">
                {lookupError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-3 bg-red-500/5 border border-red-500/10 rounded-sm text-[10px] text-red-400 flex items-start gap-2 max-w-md mx-auto"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider font-mono">Lookup Blocked •</span> {lookupError}
                    </div>
                  </motion.div>
                )}

                {lookupResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#141414] border border-[#0d4e30] p-4.5 rounded-xl shadow-lg font-sans text-xs relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold border border-emerald-500/20">
                          {lookupResult.id}
                        </span>
                        <ChevronRight className="w-3 h-3 text-zinc-650" />
                        <span className="text-zinc-500 font-mono text-[9px]">{lookupResult.timestamp}</span>
                      </div>
                      
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                        lookupResult.status === 'Verified' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {lookupResult.status === 'Verified' ? '✓ SETTLED BY STORE' : '⏱ ORDER PENDING'}
                      </span>
                    </div>

                    <h5 className="font-bold text-white uppercase text-xs tracking-wider">{lookupResult.jerseyName}</h5>
                    <div className="mt-2 text-[11px] text-zinc-400 space-y-1">
                      <p>Customer: <span className="text-white font-medium">{lookupResult.customerName}</span> ({lookupResult.customerPhone})</p>
                      <p>Size: <span className="text-white font-mono font-bold bg-[#222] border border-white/5 px-1 py-0.5 rounded">{lookupResult.size}</span> | Qty: {lookupResult.quantity}</p>
                    </div>

                    <div className="mt-3.5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 bg-black/40 border border-white/5 px-2.5 py-1.5 rounded-sm text-[10px] font-mono">
                      <span className="text-zinc-600 font-semibold uppercase text-[8px] tracking-wider">Method:</span>
                      <span className="text-white font-bold">{lookupResult.paymentMethod}</span>
                      <span className="text-zinc-600 font-semibold uppercase text-[8px] tracking-wider">Tx ID:</span>
                      <span className="text-amber-500 font-bold">{lookupResult.transactionId}</span>
                      <span className="text-zinc-650">•</span>
                      <span className="text-emerald-400 font-bold">BDT {lookupResult.amount}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'admin-ledger' && isAdmin && (
            <motion.div
              key="admin-ledger"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Master Audited Log Ledger</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Full database visibility is actively permitted in admin session.</p>
                </div>
                <span className="bg-indigo-500/10 font-mono text-[9px] text-indigo-400 font-extrabold border border-indigo-500/20 rounded-sm px-2 py-0.5 uppercase">
                  RECORDS: {orders.length}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="bg-black/35 border border-white/5 p-8 rounded-xl text-center">
                  <History className="w-10 h-10 text-zinc-650 mx-auto mb-3 animate-pulse" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Active Transactions logged</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-sm mx-auto">
                    Wait for customers to place orders or submit custom token entries.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {orders.map((order) => {
                    const isVerifying = verifyingOrderId === order.id;
                    return (
                      <div
                        key={order.id}
                        className="bg-black/40 border border-white/5 hover:border-indigo-500/20 p-4 rounded-xl flex flex-col gap-3 transition-colors text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-white bg-black border border-white/10 px-2 py-0.5 rounded-sm uppercase">
                              {order.id}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600">{order.timestamp}</span>
                          </div>
                          
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-wider ${
                              order.status === 'Verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {order.status === 'Verified' ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-white text-xs truncate uppercase tracking-wider">{order.jerseyName}</h5>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            Buyer: <span className="text-white font-semibold font-sans">{order.customerName}</span> ({order.customerPhone}) <br />
                            Size: <span className="text-white font-bold bg-[#1a1a1a] px-1 border border-white/5 font-mono">{order.size}</span> x{order.quantity} | BDT {order.amount}
                          </p>
                          
                          {/* Payment codes */}
                          <div className="mt-2.5 inline-flex flex-wrap items-center gap-2.5 bg-black/60 border border-white/10 p-2 rounded text-[10px] font-mono">
                            <span className="text-zinc-500 text-[8px] uppercase">WALLET:</span>
                            <span className="text-zinc-200 font-semibold">{order.paymentMethod}</span>
                            <span className="text-zinc-700 font-bold">|</span>
                            <span className="text-zinc-500 text-[8px] uppercase">TRX ID:</span>
                            <span className="text-amber-500 font-extrabold">{order.transactionId}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-end gap-1.5 border-t border-white/5 pt-2">
                          {order.status !== 'Verified' && (
                            <button
                              onClick={() => simulateAdminAutoVerification(order.id)}
                              disabled={isVerifying}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-sm flex items-center gap-1 transition-all"
                            >
                              {isVerifying ? (
                                <Clock className="w-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-3" />
                              )}
                              <span>Validate</span>
                            </button>
                          )}

                          <a
                            href="https://www.facebook.com/share/1Bh4gYajWE/"
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 border border-white/5 text-zinc-400 hover:text-white rounded-sm hover:bg-zinc-800 transition-all"
                            title="Chat with direct link"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleAdminDelete(order.id)}
                            className="p-1.5 border border-white/5 text-zinc-500 hover:text-red-500 hover:border-red-500/10 rounded-sm hover:bg-red-500/5 transition-all"
                            title="Delete transaction entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
