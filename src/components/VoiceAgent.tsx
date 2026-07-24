import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  ShoppingBag, 
  Radio, 
  ShieldCheck,
  Globe,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Jersey, Order } from '../types';

interface VoiceAgentProps {
  jerseysList: Jersey[];
  bKashNumber: string;
  nagadNumber: string;
  onOrderConfirmed?: (order: Order) => void;
  selectedJersey?: Jersey | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  speechText?: string;
  speechTextBanglish?: string;
  language?: string;
  timestamp: string;
  action?: string;
  orderDetails?: any;
  trackResult?: any;
}

export default function VoiceAgent({ 
  jerseysList, 
  bKashNumber, 
  nagadNumber, 
  onOrderConfirmed,
  selectedJersey 
}: VoiceAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Selected Speech Language: 'bn-BD' (Bangla) or 'en-US' (English)
  const [voiceLang, setVoiceLang] = useState<'bn-BD' | 'en-US'>('bn-BD');

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'আসসালামু আলাইকুম! নাফী জার্সি হাউজের AI ভয়েস এজেন্টে স্বাগতম। বাংলা বা ইংরেজিতে কথা বলে সরাসরি অর্ডার কনফার্ম করুন!',
      speechText: 'আসসালামু আলাইকুম! নাফী জার্সি হাউজের এআই ভয়েস এজেন্টে স্বাগতম। কথা বলে সরাসরি আপনার অর্ডার করুন।',
      speechTextBanglish: 'Assalamu Alaikum! Nafi Jersey House e apnake shagotom. Kotha bole order konfarm korun.',
      language: 'bn',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [activeVoiceOrder, setActiveVoiceOrder] = useState<any>(null);
  const [voiceOrderPlaced, setVoiceOrderPlaced] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Form override fields for active voice order
  const [formName, setFormName] = useState('Voice Customer');
  const [formPhone, setFormPhone] = useState('');
  const [formSize, setFormSize] = useState('L');
  const [formPayMethod, setFormPayMethod] = useState('bKash');
  const [formTrxId, setFormTrxId] = useState('');
  const [formCustomName, setFormCustomName] = useState('');
  const [formCustomNumber, setFormCustomNumber] = useState('');

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing, activeVoiceOrder]);

  // Load Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Initialize Speech Recognition when voiceLang changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceLang;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.log('Speech recognition event:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [voiceLang]);

  // Helper to sanitize text for speech synthesis (strips markdown, symbols, emojis, parenthetical notes)
  const cleanTTSString = (str: string) => {
    if (!str) return '';
    return str
      .replace(/[\*\#\_`~]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // High Quality Clear Female Text To Speech
  const speakText = (text: string, langCode: string = 'bn', banglishText?: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      
      const sanitizedText = cleanTTSString(text);
      const sanitizedBanglish = cleanTTSString(banglishText || text);

      if (!sanitizedText && !sanitizedBanglish) return;

      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      
      let preferredVoice: SpeechSynthesisVoice | undefined;
      let targetText = sanitizedText;

      // 1. Look for native Bengali Female Voice
      const bnVoices = voices.filter(v => 
        v.lang.toLowerCase().includes('bn') || 
        v.lang.toLowerCase().includes('bangla') || 
        v.lang.toLowerCase().includes('bengali')
      );

      if ((langCode === 'bn' || voiceLang === 'bn-BD') && bnVoices.length > 0) {
        preferredVoice = bnVoices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('google') || 
          v.name.toLowerCase().includes('damayanti') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('natural')
        ) || bnVoices[0];
      }

      // 2. Fallback to English/Indian Female Voice with phonetic Banglish if native Bengali TTS is missing
      if (!preferredVoice) {
        if (langCode === 'bn' && sanitizedBanglish) {
          targetText = sanitizedBanglish;
        }

        const candidateVoices = voices.filter(v => 
          v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.includes('en')
        );

        preferredVoice = candidateVoices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('zira') || 
          v.name.toLowerCase().includes('heera') || 
          v.name.toLowerCase().includes('samantha') || 
          v.name.toLowerCase().includes('victoria') || 
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('siri') ||
          v.name.toLowerCase().includes('natural')
        ) || candidateVoices[0] || voices[0];
      }

      const utterance = new SpeechSynthesisUtterance(targetText);
      utterance.rate = 0.95; // Unhurried, clear articulation
      utterance.pitch = 1.12; // Warm, natural female pitch cadence
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  };

  const handleTestVoice = () => {
    if (voiceLang === 'bn-BD') {
      const sampleText = 'আসসালামু আলাইকুম! আমি নাফী জার্সি হাউজের এআই নারী প্রতিনিধি। আমি বাংলায় খুব সুন্দর ও স্পষ্ট করে কথা বলতে পারি।';
      const sampleBanglish = 'Assalamu Alaikum! Ami Nafi Jersey House er AI Nari Protinidhi. Ami Bangla e spaghto kotha bolte pari.';
      speakText(sampleText, 'bn', sampleBanglish);
    } else {
      const sampleEn = 'Hello! I am your AI female sales representative from Nafi Jersey House. How may I help you with your order today?';
      speakText(sampleEn, 'en', sampleEn);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Your browser does not support Web Speech API. You can type or use fallback quick prompts.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        recognitionRef.current.start();
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isProcessing) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai-voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: query,
          activeJerseyId: selectedJersey?.id,
          userLang: voiceLang
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.replyText || 'আমি শুনতে পাচ্ছি। আপনি কোন জার্সিটি চান বলুন!',
          speechText: data.speechText || data.replyText,
          speechTextBanglish: data.speechTextBanglish,
          language: data.language || 'bn',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: data.action,
          orderDetails: data.orderDetails,
          trackResult: data.trackResult
        };

        setMessages(prev => [...prev, aiMsg]);

        // Speak back via female/male speech synthesizer
        speakText(data.speechText || data.replyText, data.language || 'bn', data.speechTextBanglish);

        // Handle Order Confirmation payload from AI
        if (data.action === 'CONFIRM_ORDER') {
          if (data.order) {
            setVoiceOrderPlaced(data.order);
            if (onOrderConfirmed) {
              onOrderConfirmed(data.order);
            }
          }

          if (data.orderDetails) {
            const details = data.orderDetails;
            const targetJersey = jerseysList.find(j => j.id === details.jerseyId) || selectedJersey || jerseysList[0];
            
            setActiveVoiceOrder({
              jersey: targetJersey,
              size: details.size || 'L',
              quantity: details.quantity || 1,
              customerName: details.customerName || 'Voice Customer',
              customerPhone: details.customerPhone || '',
              paymentMethod: details.paymentMethod || 'bKash',
              transactionId: (details.transactionId && details.transactionId.trim()) ? details.transactionId.trim() : (details.paymentMethod === 'Cash on Delivery' ? 'COD' : 'Pending bKash TrxID'),
              totalAmount: targetJersey ? targetJersey.priceBDT * (details.quantity || 1) : 1350
            });

            setFormSize(details.size || 'L');
            setFormPayMethod(details.paymentMethod || 'bKash');
            if (details.customerName) setFormName(details.customerName);
            if (details.customerPhone) setFormPhone(details.customerPhone);
            if (details.transactionId) setFormTrxId(details.transactionId);
            if (details.customName) setFormCustomName(details.customName);
            if (details.customNumber) setFormCustomNumber(details.customNumber);
          }
        }
      } else {
        throw new Error('Server returned error response');
      }
    } catch (err) {
      console.error('Error contacting AI Voice Agent server endpoint:', err);
      const isEn = voiceLang === 'en-US';
      const qLower = query.toLowerCase();
      
      let fallbackReply = "";
      let fallbackBanglish = "";

      // Smart client fallback
      if (qLower.includes("track") || qLower.includes("ট্র্যাক") || qLower.includes("status") || qLower.includes("স্ট্যাটাস")) {
        fallbackReply = isEn 
          ? "Please provide your 11-digit phone number or Order ID (e.g. NJH-123456) to retrieve your order status."
          : "আপনার অর্ডার ট্র্যাক করতে অনুগ্রহ করে ১১ ডিজিটের ফোন নম্বর বা অর্ডার আইডিটি (যেমন: NJH-123456) প্রদান করুন।";
        fallbackBanglish = "Apnar order track korte phone number ba Order ID bolun.";
      } else if (qLower.includes("delivery") || qLower.includes("ডেলিভারি") || qLower.includes("চার্জ")) {
        fallbackReply = isEn 
          ? "Delivery charge is BDT 80 nationwide. Home delivery takes 1-3 days across Bangladesh."
          : "সারা বাংলাদেশে ডেলিভারি চার্জ মাত্র ৮০ টাকা। ১-৩ দিনের মধ্যে হোম ডেলিভারি পেয়ে যাবেন।";
        fallbackBanglish = "Delivery charge 80 taka. 1 thake 3 diner moddhe home delivery paben.";
      } else if (qLower.includes("price") || qLower.includes("দাম") || qLower.includes("কত")) {
        fallbackReply = isEn 
          ? "All our official player version national team jerseys are priced at 1,350 BDT only."
          : "আমাদের সকল অফিশিয়াল প্লেয়ার ভার্সন জার্সির দাম মাত্র ১,৩৫০ টাকা।";
        fallbackBanglish = "Amader sob jersey 1350 taka.";
      } else if (qLower.includes("brazil") || qLower.includes("ব্রাজিল") || qLower.includes("argentina") || qLower.includes("আর্জেন্টিনা") || qLower.includes("portugal") || qLower.includes("পর্তুগাল") || qLower.includes("france") || qLower.includes("ফ্রান্স")) {
        fallbackReply = isEn 
          ? "Got it! Preparing your requested jersey order. Please click Confirm Order below to finalize!"
          : "ধন্যবাদ! আপনার জার্সি ও সাইজ অনুযায়ী অর্ডার প্রস্তুত করা হয়েছে। অর্ডার ফাইনাল করতে নিচে কনফার্ম করুন!";
        fallbackBanglish = "Dhonnobad! Apnar order toiri hoyeche. Niche confirm korin.";
      } else {
        fallbackReply = isEn 
          ? "Thank you for contacting Nafi Jersey House! How can I assist you with your order or questions today?"
          : "আসসালামু আলাইকুম! নাফী জার্সি হাউজে স্বাগতম। আপনার অর্ডার বা জার্সি সংক্রান্ত কোনো প্রশ্ন থাকলে বলুন!";
        fallbackBanglish = "Assalamu Alaikum! Nafi Jersey House e swagotom. Ki bhabe shahajjo korte pari?";
      }

      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: fallbackReply,
        speechText: fallbackReply,
        speechTextBanglish: fallbackBanglish,
        language: isEn ? 'en' : 'bn',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      speakText(fallbackReply, isEn ? 'en' : 'bn', fallbackBanglish);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmVoiceOrderSubmit = async () => {
    if (!activeVoiceOrder) return;
    setIsSubmittingOrder(true);

    try {
      const response = await fetch('/api/ai-voice/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jerseyId: activeVoiceOrder.jersey.id,
          size: formSize,
          quantity: activeVoiceOrder.quantity || 1,
          customerName: formName || 'Voice Customer',
          customerPhone: formPhone || '01700000000',
          paymentMethod: formPayMethod,
          transactionId: (formTrxId && formTrxId.trim()) ? formTrxId.trim() : (formPayMethod === 'Cash on Delivery' ? 'COD' : 'Pending bKash TrxID'),
          customName: formCustomName || '',
          customNumber: formCustomNumber || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVoiceOrderPlaced(data.order);
        
        // Notify parent app
        if (onOrderConfirmed) {
          onOrderConfirmed(data.order);
        }

        const isEn = voiceLang === 'en-US';
        const successText = isEn
          ? `Thank you! Your order for ${data.order.jerseyName} (Size: ${data.order.size}) is confirmed. Order ID: ${data.order.id}.`
          : `ধন্যবাদ! আপনার ${data.order.jerseyName} (সাইজ: ${data.order.size}) অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। অর্ডার আইডি: ${data.order.id}।`;
        
        setMessages(prev => [...prev, {
          id: `ai-conf-${Date.now()}`,
          sender: 'ai',
          text: successText,
          speechText: successText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        speakText(successText, isEn ? 'en' : 'bn');
        setActiveVoiceOrder(null);
      } else {
        alert('Could not process voice order placement. Please try again.');
      }
    } catch (err) {
      console.error('Voice order placement failed:', err);
      alert('Network error placing voice order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const quickPrompts = voiceLang === 'bn-BD' ? [
    "অর্ডার কনফার্ম করো",
    "আজকের সেরা জার্সি কোনটি?",
    "ব্রাজিল জার্সি L সাইজ লাগবে",
    "আর্জেন্টিনা জার্সির দাম কত?",
    "আমার অর্ডার ট্র্যাক করো"
  ] : [
    "I want to confirm order",
    "Brazil jersey size L please",
    "How much is Argentina jersey?",
    "What sizes are available?",
    "Track my order status"
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white p-3.5 pr-5 rounded-full shadow-2xl shadow-emerald-500/30 border border-emerald-400/40 cursor-pointer overflow-hidden backdrop-blur-md"
        >
          {/* Animated Background Pulse */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping duration-1000 pointer-events-none" />

          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-950/40 border border-emerald-300/30 shadow-inner">
            <Bot className="w-5 h-5 text-emerald-300 animate-pulse" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
          </div>

          <div className="text-left font-sans">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI Voice Agent (বাংলা/EN)
            </div>
            <div className="text-xs font-semibold text-zinc-100">
              কথা বলে অর্ডার করুন
            </div>
          </div>
        </motion.button>
      </div>

      {/* Voice Agent Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl h-[92vh] sm:h-[85vh] bg-zinc-900 border border-emerald-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-emerald-950/50 flex flex-col overflow-hidden"
            >
              {/* Header Bar */}
              <div className="p-4 sm:p-5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                    <Bot className="w-6 h-6" />
                    {(isListening || isSpeaking) && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-zinc-900"></span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        NAFI AI Voice Representative
                      </h3>
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Bilingual
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      {isListening 
                        ? `শুনছি... (${voiceLang === 'bn-BD' ? 'বাংলা' : 'English'})` 
                        : isSpeaking 
                        ? 'কথা বলছি... (AI Speaking)' 
                        : 'প্রস্তুত আছেন (Ready)'}
                    </p>
                  </div>
                </div>

                {/* Header Controls & Language Toggle */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  {/* Language Selector Pill */}
                  <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-750">
                    <button
                      onClick={() => setVoiceLang('bn-BD')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        voiceLang === 'bn-BD'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🇧🇩 বাংলা
                    </button>
                    <button
                      onClick={() => setVoiceLang('en-US')}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        voiceLang === 'en-US'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                  </div>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isMuted 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' 
                        : 'bg-zinc-800 text-emerald-400 border-zinc-700 hover:bg-zinc-750'
                    }`}
                    title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-750 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Soundwave Visualizer Bar & Test Voice Action */}
              <div className="bg-zinc-950/60 px-4 sm:px-6 py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 h-6">
                  {[40, 75, 100, 60, 90, 45, 80, 55, 95, 30, 70].map((h, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: isListening || isSpeaking ? [`20%`, `${h}%`, `20%`] : `20%`
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6 + (idx % 3) * 0.2,
                        ease: 'easeInOut'
                      }}
                      className={`w-1 rounded-full ${
                        isListening 
                          ? 'bg-amber-400' 
                          : isSpeaking 
                          ? 'bg-emerald-400' 
                          : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestVoice}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ভয়েস টেস্ট (Test Voice)</span>
                  </button>

                  <span className="hidden sm:inline-flex text-[11px] font-mono text-zinc-400 items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    {voiceLang === 'bn-BD' ? 'দ্বিমুখী বাংলা ও ইংরেজি' : 'Bilingual 2-Way Speech'}
                  </span>
                </div>
              </div>

              {/* Conversation Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none border border-emerald-500/30'
                        : 'bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-zinc-700/60'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="text-[11px] font-bold tracking-wider uppercase opacity-75 flex items-center gap-1">
                          {msg.sender === 'user' ? 'You' : 'Nafi AI Voice Agent'}
                        </span>
                        <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
                        {msg.text}
                      </p>

                      {msg.trackResult && (
                        <div className="mt-3 p-3 bg-zinc-900/90 rounded-xl border border-emerald-500/40 text-xs text-zinc-200 space-y-1.5 font-sans shadow-inner">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              অর্ডার নম্বর: {msg.trackResult.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {msg.trackResult.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 text-zinc-300">
                            <div><span className="text-zinc-400">জার্সি:</span> {msg.trackResult.jerseyName}</div>
                            <div><span className="text-zinc-400">সাইজ:</span> {msg.trackResult.size}</div>
                            <div><span className="text-zinc-400">ফোন:</span> {msg.trackResult.customerPhone}</div>
                            <div><span className="text-zinc-400">মূল্য:</span> ৳{msg.trackResult.amount}</div>
                            {msg.trackResult.transactionId && (
                              <div className="col-span-2 text-zinc-400 font-mono text-[11px]">
                                TRX ID: <span className="text-emerald-300">{msg.trackResult.transactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => speakText(msg.speechText || msg.text, msg.language || (voiceLang === 'en-US' ? 'en' : 'bn'), msg.speechTextBanglish)}
                          className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> আবার শোনান (Replay Voice)
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Processing Spinner */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800/80 rounded-2xl p-4 border border-zinc-700/50 flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono text-zinc-300">
                        {voiceLang === 'bn-BD' ? 'AI উত্তর তৈরি করছে...' : 'AI processing response...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Voice Order Confirmation Preview Card */}
                {activeVoiceOrder && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="my-4 p-5 rounded-2xl bg-zinc-950 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/40"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          ভয়েস অর্ডার রিভিউ (Voice Order Review)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-400 block mb-0.5">Jersey Name:</span>
                        <strong className="text-emerald-300 font-bold text-sm block">
                          {activeVoiceOrder.jersey.name}
                        </strong>
                        <span className="text-zinc-400">Price: BDT {activeVoiceOrder.totalAmount}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                        <div>
                          <label className="text-zinc-400 block mb-1">Select Size:</label>
                          <div className="flex gap-1.5">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                              <button
                                key={s}
                                onClick={() => setFormSize(s)}
                                className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                                  formSize === s 
                                    ? 'bg-emerald-500 text-zinc-950' 
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <label className="text-zinc-400 block mb-1">Customer Name:</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <label className="text-zinc-400 block mb-1">Phone Number (11 digits):</label>
                        <input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="017xxxxxxxx"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <label className="text-zinc-400 block mb-1">Payment Method:</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFormPayMethod('bKash')}
                            className={`flex-1 py-1.5 rounded font-bold text-xs cursor-pointer ${
                              formPayMethod === 'bKash' ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            bKash ({bKashNumber})
                          </button>
                          <button
                            onClick={() => setFormPayMethod('Nagad')}
                            className={`flex-1 py-1.5 rounded font-bold text-xs cursor-pointer ${
                              formPayMethod === 'Nagad' ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            Nagad ({nagadNumber})
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                        <label className="text-zinc-400 block mb-1">Transaction ID (TrxID):</label>
                        <input
                          type="text"
                          value={formTrxId}
                          onChange={(e) => setFormTrxId(e.target.value)}
                          placeholder="e.g. 9M87X2P1"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs uppercase font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/30">
                        <label className="text-emerald-400 font-bold block mb-1 text-[11px] uppercase tracking-wider">
                          👕 Custom Back Name & Jersey Number (Optional):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={formCustomName}
                            onChange={(e) => setFormCustomName(e.target.value)}
                            placeholder="Custom Name (e.g. MESSI)"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs uppercase focus:outline-none focus:border-emerald-400"
                          />
                          <input
                            type="text"
                            value={formCustomNumber}
                            onChange={(e) => setFormCustomNumber(e.target.value)}
                            placeholder="Jersey Number (e.g. 10)"
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-amber-300 font-bold text-xs focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleConfirmVoiceOrderSubmit}
                        disabled={isSubmittingOrder}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingOrder ? (
                          <>
                            <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-zinc-950" />
                            {voiceLang === 'bn-BD' ? 'অর্ডার ফাইনাল কনফার্ম করুন' : 'Confirm Voice Order Now'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveVoiceOrder(null)}
                        className="py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Confirmed Order Card Badge */}
                {voiceOrderPlaced && (
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <strong className="block text-white text-sm">অর্ডার সফলভাবে জমা হয়েছে!</strong>
                        <span>Order ID: {voiceOrderPlaced.id} ({voiceOrderPlaced.jerseyName})</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-700/80 transition-all cursor-pointer hover:border-emerald-500/50"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    {p}
                  </button>
                ))}
              </div>

              {/* Input Control Bar */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
                <button
                  onClick={toggleListening}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-600/20'
                  }`}
                  title={isListening ? 'Stop Mic' : 'Start Mic'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      isListening 
                        ? (voiceLang === 'bn-BD' ? 'কথা বলুন (Listening Bangla)...' : 'Speak now (Listening English)...')
                        : (voiceLang === 'bn-BD' ? 'কথা বলুন বা টাইপ করুন...' : 'Speak or type in English or Bangla...')
                    }
                    className="w-full bg-zinc-900 border border-zinc-750 text-white text-sm rounded-2xl px-4 py-3.5 focus:outline-none focus:border-emerald-500/80 font-sans"
                  />
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isProcessing}
                  className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold cursor-pointer transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
