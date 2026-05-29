import React, { useState, useEffect } from 'react';
import { Send, Smartphone, ShieldCheck, CheckCircle, ArrowRight, MapPin, QrCode, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface RulesCardProps {
  bKashNumber: string;
  nagadNumber: string;
  bKashQR: string | null;
  nagadQR: string | null;
  isAdmin: boolean;
  onUpdateQR: (type: 'bKash' | 'Nagad', data: string | null) => void;
}

export default function RulesCard({ bKashNumber, nagadNumber, bKashQR, nagadQR, isAdmin, onUpdateQR }: RulesCardProps) {

  const [copiedType, setCopiedType] = useState<'bKash' | 'Nagad' | null>(null);

  const handleCopyAndRedirect = (type: 'bKash' | 'Nagad', num: string) => {
    navigator.clipboard.writeText(num.trim());
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 3000);
    
    // Redirect to app portals for seamless conversion
    const targetUrl = type === 'bKash' ? 'https://www.bkash.com/app/' : 'https://www.nagad.com.bd';
    window.open(targetUrl, '_blank');
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bKash' | 'Nagad') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      onUpdateQR(type, base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleClearQR = (type: 'bKash' | 'Nagad') => {
    onUpdateQR(type, null);
  };

  // Safe encoding for bKash/Nagad scan payload text - STRICTLY raw number for direct wallet app support!
  const bKashGeneratedURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=230-22-115&data=${encodeURIComponent(bKashNumber.trim())}`;
  const nagadGeneratedURL = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=242-121-32&data=${encodeURIComponent(nagadNumber.trim())}`;

  const steps = [
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      title: "1. Make Payment via Cash (bKash / Nagad)",
      description: `Send the total price amount of your desired jerseys to our active personal wallets: bKash (${bKashNumber}) or Nagad (${nagadNumber}) shown in the store top bar.`
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-300" />,
      title: "2. Copy & Provide Your TRX ID Here",
      description: "Once your transfer completes, copy your Transaction ID (TRX ID). Select your desired jersey, size, and submit this validation code inside our verification box."
    },
    {
      icon: <Send className="w-6 h-6 text-emerald-400" />,
      title: "3. Notify Facebook Page immediately",
      description: "Crucial Step: After logging the TRX ID on this webpage, click the Chat button and instantly message our official Facebook Page with your transaction summary to dispatch the package."
    }
  ];

  return (
    <div className="relative overflow-hidden bg-[#111111]/90 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl font-sans">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 relative z-10">
        <div className="lg:col-span-8">
          <span className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded font-extrabold">
            TERMS & HOW TO ORDER
          </span>
          <h3 className="text-2xl md:text-4xl font-display font-black text-white mt-4 tracking-tighter uppercase">
            Official Order Guidelines
          </h3>
          <p className="text-xs text-zinc-400 mt-2.5 max-w-2xl leading-relaxed">
            Follow these elite streamlined guidelines to guarantee your soccer jersey order gets processed and dispatched immediately. All submissions undergo manual bKash/Nagad validation checks.
          </p>
        </div>

        {/* Store Location Section - Added Location elegant details */}
        <div className="lg:col-span-4 bg-zinc-950/70 border border-white/10 rounded-xl p-4 flex gap-3.5 text-xs shadow-inner backdrop-blur animate-pulse">
          <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-[9px] text-indigo-400 tracking-widest uppercase font-bold block mb-1">
              Store Dispatch Headquarters
            </span>
            <p className="font-bold text-white uppercase text-[10px]">NAFI JERSEY HOUSE Hub</p>
            <p className="text-zinc-400 mt-1 leading-relaxed">
              Mirpur, Dhaka, Bangladesh.
            </p>
            <span className="text-[10px] text-emerald-400 font-bold tracking-wide mt-2 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Open Daily: 10:00 AM – 8:00 PM
            </span>
          </div>
        </div>
      </div>

      {/* Grid of steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            className="bg-[#141414] border border-white/5 hover:border-emerald-500/35 p-6 rounded-xl flex flex-col justify-between transition-all duration-300 shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center mb-5 shadow-inner">
                {step.icon}
              </div>
              <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">{step.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                Process Flow 0{index + 1}
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment details notice */}
      <div className="bg-emerald-950/10 border border-emerald-500/20 p-5 rounded-xl my-6 text-xs leading-relaxed text-zinc-350 shadow-inner">
        <h5 className="font-bold text-emerald-400 uppercase tracking-wider mb-2 text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block text-emerald-400"></span>
          Payment Notice & Wallets
        </h5>
         For bKash or Nagad transfers, our active mobile payment numbers are fully set up for direct peer-to-peer personal transfers. You can securely transfer your dues via manual send money. Please double-check transaction information before confirmation.
      </div>

      {/* Warning Rule Alert Box */}
      <div className="mt-8 bg-zinc-950/70 border-l-2 border-emerald-500 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="flex-1 relative z-10">
          <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            ⚠️ MANDATORY POLICY: Transaction Verification
          </h5>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            Do not lose your transfer confirmation receipt or copy of details. If you pay via Cash (bKash / Nagad) or Hand-over, you **MUST** submit the exact Transaction ID (TRX ID) on our web ledger tool. Unregistered transactions will result in systematic verification delays.
          </p>
        </div>
        <a
          id="fb-official-page-rules-cta"
          href="https://www.facebook.com/share/1Bh4gYajWE/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-bold px-5 py-3 rounded active:scale-95 transition-all w-full md:w-auto justify-center uppercase tracking-wider shadow-lg shrink-0 relative z-10 h-11"
        >
          <span>Official Facebook Page</span>
          <ArrowRight className="w-4 h-4 animate-bounce-right" />
        </a>
      </div>
    </div>
  );
}
