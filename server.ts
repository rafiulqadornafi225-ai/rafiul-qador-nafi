import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

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
    name: 'Brazil 2026 Authentic Home Jersey',
    priceBDT: 1450,
    priceUSD: 14,
    image: '/src/assets/images/brazil_jersey_2026_1779474536112.png',
    description: 'Embrace the soul of Joga Bonito. The 2026 edition features an organic canvas pattern embodying Brazil’s rainforest layers, completed with a performance-driven flat-knit green collar and elastic sleeves.',
    rating: 4.9,
    reviewsCount: 142,
    badgeColor: 'bg-[#009b3a] text-white',
    accentColor: 'text-yellow-450',
    bgGradient: 'from-amber-500/10 via-green-600/5 to-slate-950',
  },
  {
    id: 'argentina-2026',
    country: 'Argentina',
    name: 'Argentina 2026 Three-Star Home Jersey',
    priceBDT: 1400,
    priceUSD: 13,
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
    name: 'Bangladesh 2026 Gold Edition Home Jersey',
    priceBDT: 1350,
    priceUSD: 12,
    image: '/src/assets/images/input_file_3.png',
    description: 'Celebrate the pride of the Bengal Tigers. This premium 2026 edition features a dynamic red and green abstract canvas with geometric lines, completed with a solid crimson collar and high-definition Bangladesh football federation crest.',
    rating: 4.9,
    reviewsCount: 224,
    badgeColor: 'bg-[#006a4e] text-white',
    accentColor: 'text-red-500',
    bgGradient: 'from-emerald-600/10 via-red-650/5 to-slate-950',
  },
  {
    id: 'japan-2026',
    country: 'Japan',
    name: 'Japan 2026 Special Edition Anime Jersey',
    priceBDT: 1490,
    priceUSD: 14.5,
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
    name: 'France 2026 Royal Crest Home Jersey',
    priceBDT: 1500,
    priceUSD: 15,
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
    name: 'Spain 2026 La Furia Roja Home Jersey',
    priceBDT: 1350,
    priceUSD: 12.5,
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
    name: 'Portugal 2026 Navigator Home Jersey',
    priceBDT: 1480,
    priceUSD: 14.5,
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
    name: 'Germany 2026 Modernist Home Jersey',
    priceBDT: 1380,
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
  { id: 'v-103', name: 'Zeeshan Ahmed', location: 'Mirpur, Dhaka', device: 'Android Mobile', action: 'Purchased Argentina Three-Star Jersey', timestamp: 'May 22, 2026, 06:40 PM', ip: '103.114.172.5' },
  { id: 'v-104', name: 'Subho Chowdhury', location: 'Sylhet', device: 'iPhone Mobile', action: 'Viewed Bangladesh Gold Edition Home Jersey', timestamp: 'May 22, 2026, 06:55 PM', ip: '103.199.155.12' },
  { id: 'v-105', name: 'Imran Khan', location: 'Uttara, Dhaka', device: 'Windows PC', action: 'Began order checkout for Japan Special Jersey', timestamp: 'May 22, 2026, 07:02 PM', ip: '113.11.144.17' },
  { id: 'v-106', name: 'Tanzim Rony', location: 'Banani, Dhaka', device: 'Android Mobile', action: 'Copied bKash Active Number', timestamp: 'May 22, 2026, 07:15 PM', ip: '119.30.22.84' },
  { id: 'v-107', name: 'Mashrafe Alom', location: 'Chittagong', device: 'Mac PC', action: 'Viewed Brazil 2026 Authentic Home Jersey', timestamp: 'May 22, 2026, 07:18 PM', ip: '37.111.201.2' },
  { id: 'v-108', name: 'Nabila Karim', location: 'Dhanmondi, Dhaka', device: 'iPhone Mobile', action: 'Verified payment transaction submission', timestamp: 'May 22, 2026, 07:22 PM', ip: '103.144.200.54' },
  { id: 'v-109', name: 'Zahid Hasan', location: 'Mirpur, Dhaka', device: 'Android Mobile', action: 'Browsing active 2026 Selection Gallery', timestamp: 'May 22, 2026, 07:24 PM', ip: '103.111.18.99' },
  { id: 'v-110', name: 'Fahim Anwar', location: 'Rajshahi', device: 'Windows PC', action: 'Selected Portugal Navigator Home Jersey', timestamp: 'May 22, 2026, 07:27 PM', ip: '116.58.204.1' }
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

    // Trigger Outgoing Webhook integration if configured
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

  // API 5b: Secure order lookup for specific customer query (Requires EXACT Order ID AND Phone Number)
  app.get("/api/orders/lookup", (req, res) => {
    const { id, phone } = req.query;
    if (!id || !phone) {
      return res.status(400).json({ error: "Order ID and Customer Phone number are required." });
    }
    
    const cleanId = String(id).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    
    const matched = state.orders.find(o => 
      o.id.toLowerCase() === cleanId && 
      o.customerPhone.trim() === cleanPhone
    );
    
    if (!matched) {
      return res.status(404).json({ error: "No matching transaction recorded. Please double check details." });
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
      jerseyName: 'Brazil 2026 Authentic Home Jersey',
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
