import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return genAIClient;
}

// Definitions matching type system on client
interface Jersey {
  id: string;
  country: string;
  name: string;
  priceBDT: number;
  priceUSD: number;
  image: string;
  description: string;
  rating: number;
  reviewsCount: number;
  badgeColor: string;
  accentColor: string;
  bgGradient: string;
}

interface Order {
  id: string;
  jerseyId: string;
  jerseyName: string;
  countryName: string;
  size: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  timestamp: string;
  status: 'Pending Verification' | 'Verified' | 'Shipped' | 'Delivered';
  customNumber?: string;
  customName?: string;
}

interface VisitorLog {
  id: string;
  name: string;
  location: string;
  device: string;
  action: string;
  timestamp: string;
  ip: string;
  isReal?: boolean;
}

interface DBState {
  bKashNumber: string;
  nagadNumber: string;
  bKashQR?: string | null;
  nagadQR?: string | null;
  jerseys: Jersey[];
  orders: Order[];
  viewsCount: number;
  visitorLogs: VisitorLog[];
  webhookUrl?: string | null;
  whatsappNumber?: string | null;
}

interface IntegrationLog {
  id: string;
  orderId: string;
  timestamp: string;
  webhookUrl: string;
  success: boolean;
  statusText: string;
  payload: any;
}

let integrationLogs: IntegrationLog[] = [];

const DEFAULT_JERSEYS: Jersey[] = [
  {
    id: 'brazil-2026',
    country: 'Brazil',
    name: 'Brazil Authentic Master Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/brazil_jersey_2026_1779474536112.png',
    description: 'Embrace the soul of Joga Bonito. Features an organic canvas pattern embodying Brazil’s rainforest layers, completed with a performance-driven flat-knit green collar and elastic sleeves.',
    rating: 4.9,
    reviewsCount: 142,
    badgeColor: 'bg-[#009b3a] text-white',
    accentColor: 'text-yellow-450',
    bgGradient: 'from-amber-500/10 via-green-600/5 to-slate-950',
  },
  {
    id: 'argentina-2026',
    country: 'Argentina',
    name: 'Argentina Three-Star Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/argentina_jersey_2026_1779474551194.png',
    description: 'Rich in history, designed for champions. Crafted with Argentine sky blue and alabaster vertical stripes, integrated with championship gold borders, and crowned by the iconic three golden stars crest.',
    rating: 4.8,
    reviewsCount: 198,
    badgeColor: 'bg-[#74acdf] text-white',
    accentColor: 'text-[#74acdf]',
    bgGradient: 'from-[#74acdf]/10 via-amber-400/5 to-slate-950',
  },
  {
    id: 'bangladesh-2026',
    country: 'Bangladesh',
    name: 'Bangladesh Gold Edition Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/input_file_3.png',
    description: 'Celebrate the pride of the Bengal Tigers. This premium edition features a dynamic red and green abstract canvas with geometric lines, completed with a solid crimson collar and high-definition Bangladesh football federation crest.',
    rating: 4.9,
    reviewsCount: 224,
    badgeColor: 'bg-[#006a4e] text-white',
    accentColor: 'text-red-500',
    bgGradient: 'from-emerald-600/10 via-red-650/5 to-slate-950',
  },
  {
    id: 'japan-2026',
    country: 'Japan',
    name: 'Japan Special Edition Anime Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/input_file_3.png',
    description: 'Where anime fantasy meets elite pitch performance. Engineered with custom dark ink patterns, featuring a highly-detailed Itachi and Akatsuki-crossover manga character illustration integrated right into the knit paneling.',
    rating: 5.0,
    reviewsCount: 312,
    badgeColor: 'bg-red-650 text-white',
    accentColor: 'text-red-500',
    bgGradient: 'from-red-600/10 via-zinc-850/5 to-slate-950',
  },
  {
    id: 'france-2026',
    country: 'France',
    name: 'France Royal Crest Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/france_jersey_2026_1779474568262.png',
    description: 'Sleek French elegance meets high-performance engineering. Featuring a majestic metallic royal blue base, textured honeycomb details, and an imposing gilded oversized cockerel crest.',
    rating: 4.9,
    reviewsCount: 125,
    badgeColor: 'bg-[#002395] text-white',
    accentColor: 'text-blue-400',
    bgGradient: 'from-blue-600/10 via-red-600/5 to-slate-950',
  },
  {
    id: 'spain-2026',
    country: 'Spain',
    name: 'Spain La Furia Roja Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/spain_jersey_2026_1779474593933.png',
    description: 'Feel the heat of La Furia Roja. Imbued with a striking scarlet red hue and fluid gold side piping, complete with Spain’s newly minted coat-of-arms in minimalist monochrome finish.',
    rating: 4.7,
    reviewsCount: 94,
    badgeColor: 'bg-[#c60b1e] text-white',
    accentColor: 'text-red-500',
    bgGradient: 'from-red-600/10 via-yellow-500/5 to-slate-950',
  },
  {
    id: 'portugal-2026',
    country: 'Portugal',
    name: 'Portugal Navigator Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/portugal_jersey_2026_1779474611877.png',
    description: 'Honoring the legacy of Portuguese maritime discoverers. Clad in luxurious dark burgundy red, with high-definition deep pine-green borders and elegant gold nautical motifs.',
    rating: 4.9,
    reviewsCount: 167,
    badgeColor: 'bg-[#046a38] text-white',
    accentColor: 'text-[#d01c1f]',
    bgGradient: 'from-emerald-600/10 via-red-600/5 to-slate-950',
  },
  {
    id: 'germany-2026',
    country: 'Germany',
    name: 'Germany Modernist Home Jersey',
    priceBDT: 1350,
    priceUSD: 13.5,
    image: '/src/assets/images/germany_jersey_2026_1779474631424.png',
    description: 'Architectural precision in athletic wear. Features a stark clean white background accented by premium deep-black mesh trims and a subtle gradient of sovereign gold and red across the knit lines.',
    rating: 4.8,
    reviewsCount: 110,
    badgeColor: 'bg-black text-white',
    accentColor: 'text-slate-400',
    bgGradient: 'from-slate-600/10 via-amber-500/5 to-slate-950',
  },
];

const SEED_LOGS: VisitorLog[] = [
  { id: 'v-103', name: 'Zeeshan Ahmed', location: 'Mirpur, Dhaka', device: 'Android Mobile', action: 'Purchased Argentina Three-Star Jersey', timestamp: 'Recent', ip: '103.114.172.5' },
  { id: 'v-104', name: 'Subho Chowdhury', location: 'Sylhet', device: 'iPhone Mobile', action: 'Viewed Bangladesh Gold Edition Home Jersey', timestamp: 'Recent', ip: '103.199.155.12' },
  { id: 'v-105', name: 'Imran Khan', location: 'Uttara, Dhaka', device: 'Windows PC', action: 'Began order checkout for Japan Special Jersey', timestamp: 'Recent', ip: '113.11.144.17' },
  { id: 'v-106', name: 'Tanzim Rony', location: 'Banani, Dhaka', device: 'Android Mobile', action: 'Copied bKash Active Number', timestamp: 'Recent', ip: '119.30.22.84' },
  { id: 'v-107', name: 'Mashrafe Alom', location: 'Chittagong', device: 'Mac PC', action: 'Viewed Brazil Authentic Master Home Jersey', timestamp: 'Recent', ip: '37.111.201.2' },
  { id: 'v-108', name: 'Nabila Karim', location: 'Dhanmondi, Dhaka', device: 'iPhone Mobile', action: 'Verified payment transaction submission', timestamp: 'Recent', ip: '103.144.200.54' },
  { id: 'v-109', name: 'Zahid Hasan', location: 'Mirpur, Dhaka', device: 'Android Mobile', action: 'Browsing active Selection Gallery', timestamp: 'Recent', ip: '103.111.18.99' },
  { id: 'v-110', name: 'Fahim Anwar', location: 'Rajshahi', device: 'Windows PC', action: 'Selected Portugal Navigator Home Jersey', timestamp: 'Recent', ip: '116.58.204.1' }
];

const DB_FILE = path.join(process.cwd(), "db.json");

// Define in-memory state loaded from file
let state: DBState = {
  bKashNumber: '01402580064',
  nagadNumber: '01402580064',
  bKashQR: null,
  nagadQR: null,
  jerseys: DEFAULT_JERSEYS,
  orders: [],
  viewsCount: 147,
  visitorLogs: SEED_LOGS,
  webhookUrl: null,
  whatsappNumber: '01402580064'
};

// Helper load/save database state asynchronously
async function loadState() {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    state = { ...state, ...parsed };
    console.log("Database state loaded successfully.");
  } catch (err) {
    console.log("Database file doesn't exist or is corrupt. Initializing default state...");
    await saveState();
  }
}

async function saveState() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write state on disk", err);
  }
}

async function startServer() {
  // Pre-load current state
  await loadState();

  const app = express();
  const PORT = 3000;

  // JSON middleware with expanded capacity for large base64 image loads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Directly serve image assets in both development and production under their asset paths
  app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));

  const isAdminAuthorized = (req: express.Request): boolean => {
    return req.headers["x-admin-passcode"] === "admin2026";
  };

  // API 1: Fetch store configuration (Censored for public visitors to protect user privacy)
  app.get("/api/config", (req, res) => {
    const isAuthorized = isAdminAuthorized(req);
    res.json({
      bKashNumber: state.bKashNumber,
      nagadNumber: state.nagadNumber,
      bKashQR: state.bKashQR,
      nagadQR: state.nagadQR,
      whatsappNumber: state.whatsappNumber,
      jerseys: state.jerseys,
      viewsCount: state.viewsCount,
      // Private/Sensitive properties returned ONLY if admin passcode header is validated
      orders: isAuthorized ? state.orders : [],
      visitorLogs: isAuthorized ? state.visitorLogs : [],
      webhookUrl: isAuthorized ? state.webhookUrl : null
    });
  });

  // API 2: Submit a payment wallet update (requires authorization)
  app.post("/api/config/payment", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { bKashNumber, nagadNumber, bKashQR, nagadQR, whatsappNumber } = req.body;
    if (bKashNumber !== undefined) state.bKashNumber = bKashNumber;
    if (nagadNumber !== undefined) state.nagadNumber = nagadNumber;
    if (bKashQR !== undefined) state.bKashQR = bKashQR;
    if (nagadQR !== undefined) state.nagadQR = nagadQR;
    if (whatsappNumber !== undefined) state.whatsappNumber = whatsappNumber;
    await saveState();
    res.json({ 
      success: true, 
      bKashNumber: state.bKashNumber, 
      nagadNumber: state.nagadNumber,
      bKashQR: state.bKashQR,
      nagadQR: state.nagadQR,
      whatsappNumber: state.whatsappNumber
    });
  });

  // API 3: Save, Add, or Edit catalog jerseys (requires authorization)
  app.post("/api/jerseys", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const freshJersey: Jersey = req.body;
    if (!freshJersey || !freshJersey.id) {
      return res.status(400).json({ error: "Missing jersey parameter details" });
    }

    const index = state.jerseys.findIndex(j => j.id === freshJersey.id);
    if (index !== -1) {
      // Edit existing
      state.jerseys[index] = { ...state.jerseys[index], ...freshJersey };
    } else {
      // Add new
      state.jerseys = [freshJersey, ...state.jerseys];
    }

    await saveState();
    res.json({ success: true, jerseys: state.jerseys });
  });

  // API 4: Delete catalog jersey (requires authorization)
  app.delete("/api/jerseys/:id", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { id } = req.params;
    state.jerseys = state.jerseys.filter(j => j.id !== id);
    await saveState();
    res.json({ success: true, jerseys: state.jerseys });
  });

  // API 5: Create customer transaction order with automatic notification forwarding
  app.post("/api/orders", async (req, res) => {
    const order: Order = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ error: "Invalid order transaction" });
    }

    state.orders = [order, ...state.orders];
    await saveState();

    // Outgoing Webhook / Messenger automation forwarding
    if (state.webhookUrl) {
      try {
        const orderInfo = order;
        const textMessage = `🔔 *New Order Confirmed - Nafi Jersey House* \n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *Customer Name:* ${orderInfo.customerName || 'N/A'}\n` +
          `📞 *Phone Number:* ${orderInfo.customerPhone || 'N/A'}\n` +
          `👕 *Jersey Ordered:* ${orderInfo.jerseyName} (Size: ${orderInfo.size || 'N/A'})\n` +
          `🔢 *Quantity:* ${orderInfo.quantity} pcs\n` +
          `💰 *Total Price Paid:* BDT ${orderInfo.amount}\n` +
          `💳 *Payment Wallet:* ${orderInfo.paymentMethod}\n` +
          `⚡ *Transaction ID:* ${orderInfo.transactionId}\n` +
          `📅 *Timestamp:* ${orderInfo.timestamp || new Date().toLocaleString()}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━ \n` +
          `*Note:* Please check your mobile statements for bKash/Nagad and verify that the Transaction ID matching matches perfectly!`;

        const payload = {
          content: textMessage,
          text: textMessage,
          event: "order_submission",
          timestamp: new Date().toISOString(),
          order: orderInfo
        };

        const response = await fetch(state.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const success = response.ok;
        const statusText = `${response.status} ${response.statusText}`;

        integrationLogs.unshift({
          id: `wlog-${Date.now()}`,
          orderId: orderInfo.id,
          timestamp: new Date().toLocaleTimeString(),
          webhookUrl: state.webhookUrl,
          success,
          statusText,
          payload
        });

        if (integrationLogs.length > 20) {
          integrationLogs = integrationLogs.slice(0, 20);
        }
      } catch (err: any) {
        console.error("Failed to dispatcher webhook order notify:", err);
        integrationLogs.unshift({
          id: `wlog-${Date.now()}`,
          orderId: order.id,
          timestamp: new Date().toLocaleTimeString(),
          webhookUrl: state.webhookUrl,
          success: false,
          statusText: err.message || "Network Error",
          payload: { error: err.message }
        });
      }
    }

    res.json({ success: true, orders: isAdminAuthorized(req) ? state.orders : [] });
  });

  // API 5c: AI Voice Agent Processing with Gemini 3.6 Flash
  app.post("/api/ai-voice/process", async (req, res) => {
    try {
      const { userMessage, activeJerseyId, userLang } = req.body;
      const messageText = (userMessage || '').trim();

      const ai = getGenAIClient();
      const activeJersey = state.jerseys.find(j => j.id === activeJerseyId) || state.jerseys[0];

      if (ai && messageText) {
        try {
          const systemPrompt = `You are Nafi Jersey House AI Voice Agent (নাফী জার্সি হাউজ AI ভয়েস এজেন্ট), a friendly, highly professional Bangladeshi female AI sales representative.
You speak both BENGALI (বাংলা) and ENGLISH fluently, and understand Banglish (Bengali written in English script).

IMPORTANT SPEECH & TEXT RULES:
1. Detect user's intent and language from their spoken message or text.
2. Provide THREE text fields in your JSON response:
   - 'replyText': Clean Bengali Unicode script (বাঙালি পাঠ্য) or English text for displaying in chat UI.
   - 'speechText': Native clean Bengali Unicode text or English text specifically optimized for voice synthesis. DO NOT include markdown (*, #, _), emojis, or symbols. Keep it under 2 short sentences.
   - 'speechTextBanglish': Clear phonetic Romanized Banglish or English string (e.g. "Assalamu Alaikum! Apnar Order Number holo NJH-123456.") for text-to-speech fallback engines without native Bengali font installed. NO special characters or emojis!
   - 'language': Either 'bn' (Bengali) or 'en' (English).
3. Always answer user questions directly and politely! NEVER repeat "কোন জার্সিটি কিনতে চান" if the user asked a question, provided a phone number, or mentioned a jersey/size!

STORE CATALOG:
${JSON.stringify(state.jerseys.map(j => ({ id: j.id, country: j.country, name: j.name, priceBDT: j.priceBDT, priceUSD: j.priceUSD, description: j.description })))}

PAYMENT METHODS & INFO:
- Send Money bKash: ${state.bKashNumber} or Nagad: ${state.nagadNumber}. Cash on Delivery available.
- Free Custom Name & Number printing on all jerseys.
- Delivery charge: 80 BDT nationwide. 1-2 days in Dhaka, 2-3 days outside Dhaka.
- Price: BDT 1,350 (Flat Official Player Edition Rate).
- TRANSACTION ID (TrxID) RULE: The customer MUST provide their actual bKash or Nagad Transaction ID from their payment SMS. DO NOT generate fake TRX-123456 IDs. If the customer gave a real TrxID in speech, include it. Otherwise set transactionId to "Pending bKash TrxID" or "COD". Always ask the customer to send money to bKash ${state.bKashNumber} and send their bKash Transaction ID via Facebook message or website form with their Order ID.

CURRENT CONTEXT:
Currently viewed jersey: ${activeJersey ? `${activeJersey.name} (${activeJersey.id}) - BDT ${activeJersey.priceBDT}` : 'None'}

GOALS & CAPABILITIES:
1. Answer ANY user question directly (prices, sizes S/M/L/XL/XXL, delivery times, custom printing, payment methods, shop location, order status).
2. JERSEY ORDERS & PURCHASES:
   - When user mentions a jersey (Brazil, Argentina, Portugal, France, Germany, Spain, Japan, etc.) or size or purchase intent ("লাগবে", "চাই", "অর্ডার করবো", "কিনবো", "brazil size L"):
   - Set action to CONFIRM_ORDER and construct orderDetails.
   - NEVER ask "কোন জার্সিটি কিনতে চান" when the user specifies a jersey or size! Acknowledge their requested jersey directly!
3. TRACKING ORDERS:
   - If user asks to track or gives a phone number (017...) or Order ID (NJH-...):
   - Set action to "TRACK_ORDER" and set trackPhone to that phone number or Order ID.
   - If user asks to track without phone/ID, ask for their 11-digit phone number or Order ID.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
              { role: "user", parts: [{ text: `Customer speech (User Preferred Lang: ${userLang || 'auto'}): "${messageText}"` }] }
            ],
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  replyText: { type: Type.STRING, description: "Display reply text in Bengali script or English" },
                  speechText: { type: Type.STRING, description: "Native Bengali script or English voice text" },
                  speechTextBanglish: { type: Type.STRING, description: "Phonetic Romanized Banglish or English string for TTS fallback" },
                  language: { type: Type.STRING, description: "Language code: 'bn' or 'en'" },
                  action: { type: Type.STRING, description: "Action type: NONE, CONFIRM_ORDER, TRACK_ORDER, or RECOMMEND_JERSEY" },
                  orderDetails: {
                    type: Type.OBJECT,
                    properties: {
                      jerseyId: { type: Type.STRING },
                      jerseyName: { type: Type.STRING },
                      countryName: { type: Type.STRING },
                      size: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      customerName: { type: Type.STRING },
                      customerPhone: { type: Type.STRING },
                      paymentMethod: { type: Type.STRING },
                      transactionId: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      customName: { type: Type.STRING },
                      customNumber: { type: Type.STRING }
                    }
                  },
                  trackPhone: { type: Type.STRING }
                },
                required: ["replyText", "speechText", "speechTextBanglish", "language", "action"]
              }
            }
          });

          const rawText = response.text || "{}";
          const parsed = JSON.parse(rawText);

          if (parsed.action === 'CONFIRM_ORDER' && parsed.orderDetails) {
            const details = parsed.orderDetails;
            const matchedJersey = state.jerseys.find(j => j.id === details.jerseyId || details.jerseyName?.toLowerCase().includes(j.country.toLowerCase())) || activeJersey || state.jerseys[0];
            const qty = Number(details.quantity) || 1;
            const orderId = `NJH-${Math.floor(100000 + Math.random() * 900000)}`;
            const userTrx = (details.transactionId || '').trim();
            const hasRealTrx = userTrx && !userTrx.startsWith('TRX-') && !userTrx.startsWith('VOICE-');
            const trxId = hasRealTrx ? userTrx : (details.paymentMethod === 'Cash on Delivery' ? 'COD' : 'Pending bKash TrxID');
            
            const createdOrder: Order = {
              id: orderId,
              jerseyId: matchedJersey.id,
              jerseyName: matchedJersey.name,
              countryName: matchedJersey.country,
              size: details.size || 'L',
              quantity: qty,
              customerName: details.customerName || 'Voice Customer',
              customerPhone: details.customerPhone || '01700000000',
              paymentMethod: details.paymentMethod || 'bKash',
              transactionId: trxId,
              amount: matchedJersey.priceBDT * qty,
              timestamp: new Date().toISOString(),
              status: 'Pending Verification',
              customName: details.customName || '',
              customNumber: details.customNumber || ''
            };

            // Save order immediately to admin state
            state.orders = [createdOrder, ...state.orders];
            await saveState();

            parsed.order = createdOrder;
            parsed.orderDetails.id = orderId;
            parsed.orderDetails.transactionId = trxId;

            if (parsed.language === 'en') {
              parsed.replyText = `Thank you! Your order for ${createdOrder.jerseyName} (Size: ${createdOrder.size}) has been recorded! Order ID: ${orderId}. Please send money to bKash (${state.bKashNumber}) and share your bKash Transaction ID (TrxID) via message on our Facebook page or website form to verify your payment!`;
              parsed.speechText = `Thank you! Your order for ${createdOrder.jerseyName} is recorded with Order ID ${orderId}. Please send money to bKash and share your Transaction ID via Facebook message.`;
              parsed.speechTextBanglish = `Dhonnobad! Apnar order hoyeche. Order ID: ${orderId}. bKash e taka patiye TrxID amader Facebook page message e pathan.`;
            } else {
              parsed.replyText = `ধন্যবাদ! আপনার ${createdOrder.jerseyName} (সাইজ: ${createdOrder.size}) এর অর্ডারটি রিসিভ করা হয়েছে! আপনার অর্ডার আইডি: ${orderId}। বিকাশ (${state.bKashNumber}) এ সেন্ড মানি করে আপনার বিকাশ ট্রানজেকশন নম্বরটি (TrxID) এবং অর্ডার আইডিটি ফেসবুক পেজের মেসেজে বা পেইজের ইনবক্সে প্রদান করুন।`;
              parsed.speechText = `ধন্যবাদ! আপনার অর্ডার রিসিভ করা হয়েছে। আপনার অর্ডার নম্বর হলো ${orderId}। বিকাশ ট্রানজেকশন আইডিটি ফেসবুক মেসেজে পাঠাবেন।`;
              parsed.speechTextBanglish = `Dhonnobad! Apnar order hoyeche. Order ID: ${orderId}. bKash TrxID amader Facebook page message e pathan.`;
            }
          }

          if (parsed.action === 'TRACK_ORDER' && parsed.trackPhone) {
            const query = parsed.trackPhone.trim().toLowerCase();
            const matched = state.orders.filter(o => 
              o.customerPhone.includes(query) || 
              o.id.toLowerCase().includes(query) || 
              o.transactionId.toLowerCase().includes(query)
            );
            if (matched.length > 0) {
              const latest = matched[0];
              if (parsed.language === 'en') {
                parsed.replyText = `Order Found! Order Number: ${latest.id} | Jersey: ${latest.jerseyName} (Size: ${latest.size}) | Status: ${latest.status} | Phone: ${latest.customerPhone}.`;
                parsed.speechText = `Your Order Number is ${latest.id} for ${latest.jerseyName}. Status is ${latest.status}.`;
                parsed.speechTextBanglish = `Apnar Order Number holo ${latest.id}. Status: ${latest.status}.`;
              } else {
                parsed.replyText = `আপনার অর্ডার পাওয়া গেছে! অর্ডার নম্বর: ${latest.id} | জার্সি: ${latest.jerseyName} (সাইজ: ${latest.size}) | স্ট্যাটাস: ${latest.status} | ফোন: ${latest.customerPhone}।`;
                parsed.speechText = `আপনার অর্ডার নম্বর হলো ${latest.id}। জার্সির বর্তমান স্ট্যাটাস: ${latest.status}।`;
                parsed.speechTextBanglish = `Apnar Order Number holo ${latest.id}. Status: ${latest.status}.`;
              }
              parsed.trackResult = latest;
            } else {
              if (parsed.language === 'en') {
                parsed.replyText = `Sorry, no order was found for "${parsed.trackPhone}". Please check your phone number or Order ID (e.g. 017XXXXXXXX or NJH-123456).`;
                parsed.speechText = `No order found for ${parsed.trackPhone}. Please verify your phone number or Order ID.`;
                parsed.speechTextBanglish = `Kono order pawa jayni. Apnar phone number ba Order ID check korun.`;
              } else {
                parsed.replyText = `দুঃখিত, "${parsed.trackPhone}" দিয়ে কোনো অর্ডার রেকর্ড পাওয়া যায়নি। আপনার ফোন নম্বর বা অর্ডার নম্বরটি (যেমন: NJH-123456) সঠিক আছে কিনা পুনরায় চেক করুন।`;
                parsed.speechText = `দুঃখিত, এই তথ্যে কোনো অর্ডার পাওয়া যায়নি। সঠিক ফোন নম্বর বা অর্ডার নম্বর দিন।`;
                parsed.speechTextBanglish = `Kono order pawa jayni. Apnar phone number ba Order ID check korun.`;
              }
            }
          }

          return res.json({ success: true, ...parsed });
        } catch (geminiErr) {
          console.error("Gemini API execution error, switching to smart rule fallback:", geminiErr);
        }
      }

      // Smart rule-based fallback if Gemini API is processing, quota limited, or offline
      const lower = messageText.toLowerCase();
      const isEnglish = /[a-zA-Z]/.test(messageText) && !lower.includes("kemon") && !lower.includes("lagbe") && !lower.includes("khoj") && !lower.includes("chai") && !lower.includes("korbo") && !lower.includes("dam");
      
      let replyText = "";
      let speechText = "";
      let speechTextBanglish = "";
      let language = isEnglish ? "en" : "bn";
      let action = "NONE";
      let orderDetails: any = null;
      let trackResult: any = null;

      // Check for phone number or Order ID in prompt
      let phoneMatch = messageText.match(/01[3-9]\d{8}/) || messageText.match(/\b\d{11}\b/);
      let idMatch = messageText.match(/NJH-\d+/i) || messageText.match(/TRX-\d+/i);
      let query = idMatch ? idMatch[0] : (phoneMatch ? phoneMatch[0] : "");

      const isTrackingKeyword = lower.includes("track") || lower.includes("ট্র্যাক") || lower.includes("ট্র্যাকিং") || lower.includes("status") || lower.includes("স্ট্যাটাস") || lower.includes("কোথায়") || lower.includes("খুঁজ") || lower.includes("খোঁজ");

      // 1. ORDER TRACKING REQUEST
      if (query || (isTrackingKeyword && (phoneMatch || idMatch))) {
        action = "TRACK_ORDER";
        const matched = state.orders.filter(o => 
          o.customerPhone.includes(query) || 
          o.id.toLowerCase().includes(query.toLowerCase()) || 
          o.transactionId.toLowerCase().includes(query.toLowerCase())
        );

        if (matched.length > 0) {
          const latest = matched[0];
          trackResult = latest;
          if (isEnglish) {
            replyText = `Order Found! Order Number: ${latest.id} | Jersey: ${latest.jerseyName} (Size: ${latest.size}) | Status: ${latest.status} | Phone: ${latest.customerPhone}. You can send Order Number ${latest.id} in our Facebook chat!`;
            speechText = `Your Order Number is ${latest.id}. Current status is ${latest.status}.`;
            speechTextBanglish = `Apnar Order Number holo ${latest.id}. Status: ${latest.status}.`;
          } else {
            replyText = `আপনার অর্ডার পাওয়া গেছে! অর্ডার নম্বর (Order Number): ${latest.id} | জার্সি: ${latest.jerseyName} (সাইজ: ${latest.size}) | স্ট্যাটাস: ${latest.status} | ফোন: ${latest.customerPhone}। ফেসবুক মেসেজে বা পেজে এই অর্ডার নম্বরটি (${latest.id}) দিন!`;
            speechText = `আপনার অর্ডার নম্বর হলো ${latest.id}। জার্সির বর্তমান স্ট্যাটাস: ${latest.status}।`;
            speechTextBanglish = `Apnar Order Number holo ${latest.id}. Status: ${latest.status}.`;
          }
        } else {
          if (isEnglish) {
            replyText = `Sorry, no order found matching "${query}". Please verify your phone number or Order ID.`;
            speechText = `No order found for ${query}. Please check your phone number or Order ID.`;
            speechTextBanglish = `Kono order pawa jayni. Phone number ba Order ID check korun.`;
          } else {
            replyText = `দুঃখিত, "${query}" নম্বর বা আইডি দিয়ে কোনো রেকর্ড পাওয়া যায়নি। সঠিক ফোন নম্বর বা অর্ডার নম্বর (যেমন: NJH-123456) দিন।`;
            speechText = `দুঃখিত, এই তথ্যে কোনো অর্ডার পাওয়া যায়নি।`;
            speechTextBanglish = `Kono order pawa jayni. Apnar phone number ba Order ID check korun.`;
          }
        }
      } else if (isTrackingKeyword) {
        action = "NONE";
        if (isEnglish) {
          replyText = `To track your order, please type or say your 11-digit phone number or Order ID (e.g. 017XXXXXXXX or NJH-123456).`;
          speechText = `Please tell me your phone number or Order ID to track your order.`;
          speechTextBanglish = `Order track korte apnar phone number ba Order ID bolun.`;
        } else {
          replyText = `আপনার অর্ডার ট্র্যাক করতে অনুগ্রহ করে আপনার ১১ ডিজিটের ফোন নম্বর (যেমন: 017XXXXXXXX) অথবা অর্ডার নম্বরটি (যেমন: NJH-123456) বলুন বা লিখুন।`;
          speechText = `আপনার অর্ডার ট্র্যাক করতে ফোন নম্বর বা অর্ডার আইডি বলুন।`;
          speechTextBanglish = `Order track korte apnar phone number ba Order ID bolun.`;
        }
      } 
      // 2. DELIVERY & SHIPPING QUESTIONS
      else if (lower.includes("delivery") || lower.includes("ডেলিভারি") || lower.includes("শিপিং") || lower.includes("চার্জ") || lower.includes("কতদিন")) {
        if (isEnglish) {
          replyText = `We offer nationwide home delivery across Bangladesh! Delivery charge is 80 BDT. Delivery takes 1-2 days inside Dhaka and 2-3 days outside Dhaka.`;
          speechText = `Nationwide home delivery takes 1 to 3 days with 80 BDT delivery charge.`;
          speechTextBanglish = `Delivery charge 80 taka. 1 thake 3 diner moddhe home delivery paben.`;
        } else {
          replyText = `আমরা সারা বাংলাদেশে হোম ডেলিভারি দিয়ে থাকি! ডেলিভারি চার্জ মাত্র ৮০ টাকা। ঢাকার ভেতর ১-২ দিন এবং ঢাকার বাইরে ২-৩ দিনের মধ্যে ডেলিভারি পাবেন।`;
          speechText = `সারা বাংলাদেশে মাত্র ৮০ টাকায় ১ থেকে ৩ দিনের মধ্যে হোম ডেলিভারি পাবেন।`;
          speechTextBanglish = `Delivery charge 80 taka. 1 thake 3 diner moddhe home delivery paben.`;
        }
      }
      // 3. CUSTOM NAME AND NUMBER PRINTING QUESTIONS
      else if (lower.includes("name") || lower.includes("নাম") || lower.includes("নাম্বার") || lower.includes("number") || lower.includes("print") || lower.includes("প্রিন্ট")) {
        if (isEnglish) {
          replyText = `Yes! Custom name and jersey number printing on all official jerseys is completely FREE at Nafi Jersey House!`;
          speechText = `Custom name and number printing on all jerseys is completely free!`;
          speechTextBanglish = `Apnar pochonder name ebong number jersey te free te print kore dewa hobe!`;
        } else {
          replyText = `জি অবশ্যই! আমাদের সকল জার্সিতে আপনার নিজের নাম এবং পছন্দের জার্সি নম্বর ফ্রিতে প্রিন্ট করে দেওয়া হয়!`;
          speechText = `আমাদের সকল জার্সিতে আপনার নাম ও নম্বর ফ্রিতে প্রিন্ট করে দেওয়া হয়।`;
          speechTextBanglish = `Apnar pochonder name ebong number jersey te free te print kore dewa hobe!`;
        }
      }
      // 4. PRICE & COST QUESTIONS
      else if (lower.includes("দাম") || lower.includes("price") || lower.includes("কত") || lower.includes("cost") || lower.includes("টাকা")) {
        if (isEnglish) {
          replyText = `All our official player version national jerseys are priced at BDT 1,350 only with premium fabric quality!`;
          speechText = `All official player version jerseys are 1,350 BDT.`;
          speechTextBanglish = `Amader sob official player version jersey 1350 taka.`;
        } else {
          replyText = `আমাদের সকল অফিশিয়াল প্লেয়ার ভার্সন জাতীয় দল জার্সির দাম মাত্র ১,৩৫০ টাকা।`;
          speechText = `আমাদের সকল অফিশিয়াল প্লেয়ার ভার্সন জার্সির দাম ১,৩৫০ টাকা।`;
          speechTextBanglish = `Amader sob official player version jersey 1350 taka.`;
        }
      }
      // 5. PAYMENT METHOD QUESTIONS
      else if (lower.includes("bkash") || lower.includes("bKash") || lower.includes("বিকাশ") || lower.includes("nagad") || lower.includes("নগদ") || lower.includes("payment") || lower.includes("পেমেন্ট") || lower.includes("টাকা দেব")) {
        if (isEnglish) {
          replyText = `You can pay via bKash (${state.bKashNumber}) or Nagad (${state.nagadNumber}) Send Money, or choose Cash on Delivery!`;
          speechText = `You can pay via bKash, Nagad, or Cash on Delivery.`;
          speechTextBanglish = `Apni bKash, Nagad ba Cash on Delivery te order korte parben.`;
        } else {
          replyText = `আপনি বিকাশ (${state.bKashNumber}) অথবা নগদ (${state.nagadNumber}) সেন্ড মানি করে পেমেন্ট করতে পারেন, অথবা ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন!`;
          speechText = `আপনি বিকাশ, নগদ বা ক্যাশ অন ডেলিভারিতে পেমেন্ট করতে পারেন।`;
          speechTextBanglish = `Apni bKash, Nagad ba Cash on Delivery te order korte parben.`;
        }
      }
      // 6. STORE LOCATION QUESTIONS
      else if (lower.includes("দোকান") || lower.includes("কোথায়") || lower.includes("এড্রেস") || lower.includes("location") || lower.includes("address") || lower.includes("shop")) {
        if (isEnglish) {
          replyText = `We are an official online jersey house based in Dhaka, offering home delivery across all 64 districts of Bangladesh!`;
          speechText = `We are an online shop based in Dhaka with home delivery across Bangladesh.`;
          speechTextBanglish = `Amader online shop Dhaka e, sob 64 zillay home delivery dewa hoy.`;
        } else {
          replyText = `আমরা অনলাইন ভিত্তিক অফিশিয়াল জার্সি সপ। আমাদের হেড অফিস ঢাকা, এবং আমরা বাংলাদেশের সকল ৬৪ জেলায় হোম ডেলিভারি দিয়ে থাকি!`;
          speechText = `আমরা অনলাইন ভিত্তিক শপ, সারা বাংলাদেশে হোম ডেলিভারি দেওয়া হয়।`;
          speechTextBanglish = `Amader online shop Dhaka e, sob 64 zillay home delivery dewa hoy.`;
        }
      }
      // 7. CHECK FOR JERSEY SELECTION / ORDER INTENT
      else {
        let matchedJersey = state.jerseys.find(j => 
          lower.includes(j.country.toLowerCase()) || 
          lower.includes(j.name.toLowerCase()) || 
          lower.includes(j.id.toLowerCase())
        );
        if (!matchedJersey && (lower.includes("ব্রাজিল") || lower.includes("brazil"))) matchedJersey = state.jerseys.find(j => j.id.includes("brazil"));
        if (!matchedJersey && (lower.includes("আর্জেন্টিনা") || lower.includes("argentina"))) matchedJersey = state.jerseys.find(j => j.id.includes("argentina"));
        if (!matchedJersey && (lower.includes("পর্তুগাল") || lower.includes("portugal"))) matchedJersey = state.jerseys.find(j => j.id.includes("portugal"));
        if (!matchedJersey && (lower.includes("ফ্রান্স") || lower.includes("ফরাসি") || lower.includes("france"))) matchedJersey = state.jerseys.find(j => j.id.includes("france"));
        if (!matchedJersey && (lower.includes("জার্মানি") || lower.includes("germany"))) matchedJersey = state.jerseys.find(j => j.id.includes("germany"));
        if (!matchedJersey && (lower.includes("জাপান") || lower.includes("japan"))) matchedJersey = state.jerseys.find(j => j.id.includes("japan"));
        if (!matchedJersey && (lower.includes("স্পেন") || lower.includes("spain"))) matchedJersey = state.jerseys.find(j => j.id.includes("spain"));

        let detectedSize = "L";
        if (lower.includes("xxl")) detectedSize = "XXL";
        else if (lower.includes("xl")) detectedSize = "XL";
        else if (lower.includes(" m") || lower.includes("m ") || lower.includes("সাইজ m") || lower.includes("সাইজ এম")) detectedSize = "M";
        else if (lower.includes(" s") || lower.includes("s ") || lower.includes("সাইজ s") || lower.includes("সাইজ এস")) detectedSize = "S";
        else if (lower.includes(" l") || lower.includes("l ") || lower.includes("সাইজ l") || lower.includes("সাইজ এল")) detectedSize = "L";

        const hasOrderIntent = lower.includes("confirm") || lower.includes("অর্ডার") || lower.includes("কনফার্ম") || 
          lower.includes("কিনব") || lower.includes("কিনবো") || lower.includes("কিনি") || lower.includes("order") || 
          lower.includes("buy") || lower.includes("lagbe") || lower.includes("লাগবে") || lower.includes("chai") || 
          lower.includes("চাই") || lower.includes("সাইজ") || lower.includes("size") || matchedJersey !== undefined;

        if (hasOrderIntent) {
          action = "CONFIRM_ORDER";
          if (!matchedJersey) matchedJersey = activeJersey || state.jerseys[0];

          let phone = phoneMatch ? phoneMatch[0] : "";
          let isNagad = lower.includes("nagad") || lower.includes("নগদ");
          let payMethod = isNagad ? "Nagad" : "bKash";

          const orderId = `NJH-${Math.floor(100000 + Math.random() * 900000)}`;
          const trxId = "Pending bKash TrxID";

          const createdOrder: Order = {
            id: orderId,
            jerseyId: matchedJersey.id,
            jerseyName: matchedJersey.name,
            countryName: matchedJersey.country,
            size: detectedSize,
            quantity: 1,
            customerName: "Voice Customer",
            customerPhone: phone || "01700000000",
            paymentMethod: payMethod,
            transactionId: trxId,
            amount: matchedJersey.priceBDT,
            timestamp: new Date().toISOString(),
            status: 'Pending Verification',
            customName: '',
            customNumber: ''
          };

          // Save order to state immediately
          state.orders = [createdOrder, ...state.orders];
          await saveState();

          orderDetails = {
            id: orderId,
            jerseyId: matchedJersey.id,
            jerseyName: matchedJersey.name,
            countryName: matchedJersey.country,
            size: detectedSize,
            quantity: 1,
            customerName: "Voice Customer",
            customerPhone: phone || "01700000000",
            paymentMethod: payMethod,
            transactionId: trxId,
            amount: matchedJersey.priceBDT
          };

          if (isEnglish) {
            replyText = `Great! I prepared your order for ${matchedJersey.name} (Size: ${detectedSize}) for BDT ${matchedJersey.priceBDT}. Order ID: ${orderId}. Please send money to bKash (${state.bKashNumber}) and share your bKash Transaction ID via Facebook page message!`;
            speechText = `I prepared your order for ${matchedJersey.name} size ${detectedSize}. Order number is ${orderId}. Please share your bKash transaction ID via message.`;
            speechTextBanglish = `Apnar ${matchedJersey.name} size ${detectedSize} er order toiri hoyeche. Order Number: ${orderId}.`;
          } else {
            replyText = `ধন্যবাদ! আপনার ${matchedJersey.name} (সাইজ: ${detectedSize}) এর অর্ডার কনফার্ম করার জন্য তৈরি করা হয়েছে! আপনার অর্ডার নম্বর: ${orderId}। বিকাশ (${state.bKashNumber}) এ সেন্ড মানি করে আপনার বিকাশ ট্রানজেকশন নম্বরটি (TrxID) ফেসবুক পেজ বা মেসেজে শেয়ার করুন।`;
            speechText = `ধন্যবাদ! আপনার ${matchedJersey.name} সাইজ ${detectedSize} এর অর্ডার প্রস্তুত। অর্ডার নম্বর হলো ${orderId}। বিকাশ ট্রানজেকশন আইডি মেসেজে দিন।`;
            speechTextBanglish = `Dhonnobad! Apnar ${matchedJersey.name} size ${detectedSize} er order toiri hoyeche. Order Number: ${orderId}.`;
          }
        } else {
          // Default polite reply for general greetings or unspecified input
          if (isEnglish) {
            replyText = `Welcome to Nafi Jersey House! How can I assist you with your jersey purchase or order tracking today?`;
            speechText = `Welcome to Nafi Jersey House! How can I help you today?`;
            speechTextBanglish = `Nafi Jersey House e swagotom! Kina ba order track korte amader bolun.`;
          } else {
            replyText = `আসসালামু আলাইকুম! নাফী জার্সি হাউজে স্বাগতম। আজকে আপনাকে কিভাবে সাহায্য করতে পারি? জার্সি অর্ডার করতে বা আপনার অর্ডারের খোঁজ নিতে বলুন!`;
            speechText = `আসসালামু আলাইকুম! নাফী জার্সি হাউজে স্বাগতম। আজকে কিভাবে সাহায্য করতে পারি?`;
            speechTextBanglish = `Assalamu Alaikum! Nafi Jersey House e swagotom. Ki bhabe shahajjo korte pari?`;
          }
        }
      }

      res.json({
        success: true,
        replyText,
        speechText,
        speechTextBanglish,
        language,
        action,
        orderDetails,
        trackResult
      });
    } catch (err: any) {
      console.error("AI Voice processing exception:", err);
      res.status(500).json({ error: "Failed to process AI Voice request" });
    }
  });

  // API 5d: Confirm Voice Order Creation
  app.post("/api/ai-voice/confirm-order", async (req, res) => {
    try {
      const { jerseyId, size, quantity, customerName, customerPhone, paymentMethod, transactionId, customName, customNumber } = req.body;
      
      const matchedJersey = state.jerseys.find(j => j.id === jerseyId) || state.jerseys[0];
      const qty = Number(quantity) || 1;
      const totalAmount = matchedJersey ? matchedJersey.priceBDT * qty : 1350;

      const newOrder: Order = {
        id: `NJH-${Math.floor(100000 + Math.random() * 900000)}`,
        jerseyId: matchedJersey ? matchedJersey.id : 'brazil-2026',
        jerseyName: matchedJersey ? matchedJersey.name : 'Brazil Authentic Master Home Jersey',
        countryName: matchedJersey ? matchedJersey.country : 'Brazil',
        size: size || 'L',
        quantity: qty,
        customerName: customerName || 'Voice Customer',
        customerPhone: customerPhone || '01700000000',
        paymentMethod: paymentMethod || 'bKash',
        transactionId: (transactionId && transactionId.trim()) ? transactionId.trim() : (paymentMethod === 'Cash on Delivery' ? 'COD' : 'Pending bKash TrxID'),
        amount: totalAmount,
        timestamp: new Date().toISOString(),
        status: 'Pending Verification',
        customName: customName || '',
        customNumber: customNumber || ''
      };

      state.orders = [newOrder, ...state.orders];
      await saveState();

      res.json({
        success: true,
        order: newOrder,
        replyText: `ধন্যবাদ! আপনার ${newOrder.jerseyName} (সাইজ ${newOrder.size}) এর অর্ডারটি ভয়েস এজেন্টের মাধ্যমে সফলভাবে কনফার্ম করা হয়েছে। অর্ডার আইডি: ${newOrder.id}।`
      });
    } catch (err: any) {
      console.error("Voice order confirmation exception:", err);
      res.status(500).json({ error: "Voice order confirmation failed" });
    }
  });

  // API 5b: Secure order lookup for specific customer query (Search by Order ID, Phone Number, or Transaction ID)
  app.get("/api/orders/lookup", (req, res) => {
    const { id, phone } = req.query;
    if (!id && !phone) {
      return res.status(400).json({ error: "Please enter an Order ID (e.g. NJH-123456) or Customer Phone number." });
    }
    
    const cleanId = id ? String(id).trim().toLowerCase() : "";
    const cleanPhone = phone ? String(phone).trim() : "";
    
    const matched = state.orders.find(o => {
      const matchId = cleanId ? (o.id.toLowerCase().includes(cleanId) || o.transactionId.toLowerCase().includes(cleanId)) : true;
      const matchPhone = cleanPhone ? o.customerPhone.trim().includes(cleanPhone) : true;
      return matchId && matchPhone;
    });
    
    if (!matched) {
      return res.status(404).json({ error: "No matching transaction recorded. Please check Order ID or Phone number." });
    }
    
    res.json({ success: true, order: matched });
  });

  // API 11: Save webhook automation URL config (Requires Authorization)
  app.post("/api/config/webhook", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { webhookUrl } = req.body;
    state.webhookUrl = webhookUrl === "" ? null : webhookUrl;
    await saveState();
    res.json({ success: true, webhookUrl: state.webhookUrl });
  });

  // API 12: Fetch log entries of webhook dispatches (Requires Authorization)
  app.get("/api/integration/logs", (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    res.json({ logs: integrationLogs });
  });

  // API 13: Clear integration logs (Requires Authorization)
  app.post("/api/integration/logs/clear", (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    integrationLogs = [];
    res.json({ success: true, logs: [] });
  });

  // API 14: Dispatch a manual Test payload immediately (Requires Authorization)
  app.post("/api/integration/test", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const demoPayload = {
      id: `DEMO-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      jerseyId: 'brazil-2026',
      jerseyName: 'Brazil Authentic Master Home Jersey',
      countryName: 'Brazil',
      size: 'L',
      quantity: 1,
      customerName: 'Mr. Test Buyer (Demo Order)',
      customerPhone: '01700112233',
      paymentMethod: 'bKash',
      transactionId: 'TRX777DEMOMATCH',
      amount: 1450,
      timestamp: new Date().toLocaleString(),
      status: 'Pending Verification'
    };

    if (!state.webhookUrl) {
      return res.status(400).json({ error: "Please configure a Webhook URL first!" });
    }

    try {
      const textMessage = `🔔 *[TEST DISPATCH] New Order Confirmed - Nafi Jersey House* \n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *Customer Name:* ${demoPayload.customerName}\n` +
        `📞 *Phone Number:* ${demoPayload.customerPhone}\n` +
        `👕 *Jersey Ordered:* ${demoPayload.jerseyName} (Size: ${demoPayload.size})\n` +
        `🔢 *Quantity:* ${demoPayload.quantity} pcs\n` +
        `💰 *Total Price Paid:* BDT ${demoPayload.amount}\n` +
        `💳 *Payment Wallet:* ${demoPayload.paymentMethod}\n` +
        `⚡ *Transaction ID:* ${demoPayload.transactionId}\n` +
        `📅 *Timestamp:* ${demoPayload.timestamp}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━ \n` +
        `⚠️ *Status:* Connection confirmed. This simulated test matches real checkout flows!`;

      const payload = {
        content: textMessage,
        text: textMessage,
        event: "test_dispatch",
        timestamp: new Date().toISOString(),
        order: demoPayload
      };

      const response = await fetch(state.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const success = response.ok;
      const statusText = `${response.status} ${response.statusText}`;

      integrationLogs.unshift({
        id: `wlog-${Date.now()}`,
        orderId: demoPayload.id,
        timestamp: new Date().toLocaleTimeString(),
        webhookUrl: state.webhookUrl,
        success,
        statusText,
        payload
      });

      return res.json({ success, statusText });
    } catch (err: any) {
      integrationLogs.unshift({
        id: `wlog-${Date.now()}`,
        orderId: demoPayload.id,
        timestamp: new Date().toLocaleTimeString(),
        webhookUrl: state.webhookUrl,
        success: false,
        statusText: err.message || "Connection failed",
        payload: { error: err.message }
      });
      return res.status(500).json({ error: err.message || "Webhook delivery failed" });
    }
  });

  // API 6: Update orders list (status changes, deletions by admin) (Requires Authorization)
  app.post("/api/orders/update-list", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: "Expected array of orders" });
    }
    state.orders = orders;
    await saveState();
    res.json({ success: true, orders: state.orders });
  });

  // API 7: Manage live visitor logs stream (individual visitor state logging)
  app.post("/api/visitor-logs", async (req, res) => {
    const { logs, singleLog, actionUpdate, sessionId, customName } = req.body;
    
    if (Array.isArray(logs)) {
      if (!isAdminAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized access" });
      }
      state.visitorLogs = logs;
    } else if (singleLog) {
      // Insert single visitor log at head
      state.visitorLogs = [singleLog, ...state.visitorLogs.filter(l => l.id !== singleLog.id)];
    } else if (actionUpdate && sessionId) {
      // Dynamically modernize specific session log action
      state.visitorLogs = state.visitorLogs.map(log => {
        if (log.id === sessionId) {
          return {
            ...log,
            action: actionUpdate,
            name: customName ? customName : log.name
          };
        }
        return log;
      });
    }

    await saveState();
    // Return logs ONLY to authorized admin, empty arrays to other connections
    res.json({ success: true, visitorLogs: isAdminAuthorized(req) ? state.visitorLogs : [] });
  });

  // API 8: Clear visitor logs tracker (Requires Authorization)
  app.post("/api/visitor-logs/clear", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { activeLogId } = req.body;
    const activeLog = state.visitorLogs.find(l => l.id === activeLogId);
    state.visitorLogs = activeLog ? [activeLog] : [];
    await saveState();
    res.json({ success: true, visitorLogs: state.visitorLogs });
  });

  // API 9: Increment cumulative views
  app.post("/api/views/increment", async (req, res) => {
    state.viewsCount += 1;
    await saveState();
    res.json({ success: true, viewsCount: state.viewsCount });
  });

  // API 10: Reset cumulative views (Requires Authorization)
  app.post("/api/views/reset", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    state.viewsCount = 1;
    await saveState();
    res.json({ success: true, viewsCount: state.viewsCount });
  });

  // API 15: Bulk sync entire store state (Requires Authorization)
  app.post("/api/config/sync", async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const { jerseys, bKashNumber, nagadNumber, whatsappNumber, bKashQR, nagadQR, webhookUrl } = req.body;
    if (jerseys !== undefined) state.jerseys = jerseys;
    if (bKashNumber !== undefined) state.bKashNumber = bKashNumber;
    if (nagadNumber !== undefined) state.nagadNumber = nagadNumber;
    if (whatsappNumber !== undefined) state.whatsappNumber = whatsappNumber;
    if (bKashQR !== undefined) state.bKashQR = bKashQR;
    if (nagadQR !== undefined) state.nagadQR = nagadQR;
    if (webhookUrl !== undefined) state.webhookUrl = webhookUrl;
    await saveState();
    res.json({ 
      success: true, 
      config: {
        bKashNumber: state.bKashNumber,
        nagadNumber: state.nagadNumber,
        bKashQR: state.bKashQR,
        nagadQR: state.nagadQR,
        whatsappNumber: state.whatsappNumber,
        jerseys: state.jerseys,
        viewsCount: state.viewsCount,
        webhookUrl: state.webhookUrl
      }
    });
  });


  // Mounting Vite Dev Middleware or Serving Static build assets in Production mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express and Vite backend server initialized on port ${PORT}`);
  });
}

startServer();
