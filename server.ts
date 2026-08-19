import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore as getClientFirestore, collection, query, where, getDocs, addDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

class ClientDocumentSnapshotWrapper {
  private snap: any;
  constructor(snap: any) {
    this.snap = snap;
  }
  get exists() {
    return this.snap.exists();
  }
  get id() {
    return this.snap.id;
  }
  data() {
    return this.snap.data();
  }
}

class ClientQuerySnapshotWrapper {
  private snap: any;
  docs: ClientDocumentSnapshotWrapper[];
  constructor(snap: any) {
    this.snap = snap;
    this.docs = snap.docs.map((d: any) => new ClientDocumentSnapshotWrapper(d));
  }
  get empty() {
    return this.snap.empty;
  }
  get size() {
    return this.docs.length;
  }
  forEach(callback: (doc: ClientDocumentSnapshotWrapper) => void) {
    this.docs.forEach(callback);
  }
}

class ClientCollectionReferenceWrapper {
  private db: any;
  private path: string;
  private constraints: any[] = [];

  constructor(db: any, path: string, constraints: any[] = []) {
    this.db = db;
    this.path = path;
    this.constraints = constraints;
  }

  doc(docId: string) {
    return new ClientDocumentReferenceWrapper(this.db, this.path, docId);
  }

  where(field: string, op: any, value: any) {
    const newConstraint = where(field, op, op === '==' || op === '>=' || op === '<=' || op === '>' || op === '<' || op === 'in' || op === 'array-contains' || op === 'array-contains-any' || op === 'not-in' ? value : op);
    return new ClientCollectionReferenceWrapper(this.db, this.path, [...this.constraints, newConstraint]);
  }

  async add(data: any) {
    const colRef = collection(this.db, this.path);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id };
  }

  async get() {
    const colRef = collection(this.db, this.path);
    const q = query(colRef, ...this.constraints);
    const snap = await getDocs(q);
    return new ClientQuerySnapshotWrapper(snap);
  }
}

class ClientDocumentReferenceWrapper {
  private db: any;
  private path: string;
  private docId: string;

  constructor(db: any, path: string, docId: string) {
    this.db = db;
    this.path = path;
    this.docId = docId;
  }

  async get() {
    const docRef = doc(this.db, this.path, this.docId);
    const snap = await getDoc(docRef);
    return new ClientDocumentSnapshotWrapper(snap);
  }

  async set(data: any, options?: { merge?: boolean }) {
    const docRef = doc(this.db, this.path, this.docId);
    await setDoc(docRef, data, options || {});
  }

  async update(data: any) {
    const docRef = doc(this.db, this.path, this.docId);
    await updateDoc(docRef, data);
  }
}

class ClientFirestoreWrapper {
  private db: any;
  constructor(db: any) {
    this.db = db;
  }
  collection(path: string) {
    return new ClientCollectionReferenceWrapper(this.db, path);
  }
}


const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : '';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function getNumericStatus(error: any): number {
  if (!error) return 500;
  if (typeof error.status === 'number' && error.status >= 100 && error.status < 650) {
    return error.status;
  }
  if (typeof error.code === 'number' && error.code >= 100 && error.code < 650) {
    return error.code;
  }
  if (error.error && typeof error.error.code === 'number' && error.error.code >= 100 && error.error.code < 650) {
    return error.error.code;
  }
  return 500;
}

async function generateContentWithRetry(parameters: any): Promise<any> {
  const originalModel = parameters.model || "gemini-3.5-flash";
  
  // Define fallback pools
  let modelPool: string[] = [];
  if (originalModel === "gemini-3.5-flash") {
    modelPool = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  } else if (originalModel === "gemini-3.1-pro-preview") {
    modelPool = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  } else {
    modelPool = [originalModel, "gemini-3.5-flash", "gemini-3.1-flash-lite"];
  }

  let finalError: any = null;

  for (const currentModel of modelPool) {
    parameters.model = currentModel;
    let retries = 1; // 1 retry per model in the pool to keep response times low and failover fast
    let delay = 500; // start with a small delay for quick escalation
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[Gemini Request] Route to ${currentModel} (Step ${attempt + 1}/${retries + 1})`);
        return await ai.models.generateContent(parameters);
      } catch (error: any) {
        finalError = error;
        const errorMessage = error.message || "";
        const errorStatus = getNumericStatus(error);
        const isUnavailable = errorStatus === 503 || errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand") || errorMessage.includes("overloaded");
        const isRateLimit = errorStatus === 429 || errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("exhausted") || errorMessage.includes("Rate limit");

        if (isUnavailable || isRateLimit) {
          if (attempt < retries) {
            console.log(`[Gemini Sync] Model queue busy. Next schedule in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          } else {
            console.log(`[Gemini Cascade] Redirecting to backup runner...`);
          }
        } else {
          // If it is another kind of error (invalid arguments, formatting, etc.), throw immediately
          throw error;
        }
      }
    }
  }

  throw finalError;
}

export const app = express();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Load Firebase Config
  let firebaseConfig: any = {};
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (e) {
    console.warn("Could not read firebase-applet-config.json:", e);
  }

  // Initialize Firebase Admin
  let firebaseApp: admin.app.App;
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    firebaseApp = admin.apps[0]!;
  }

  // Initialize Firebase Admin Firestore (used on server to query collections with admin privileges)
  const adminDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  const getDb = () => adminDb;

  async function fetchMediaAsBase64Part(url: string): Promise<{ inlineData: { mimeType: string, data: string } } | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      return {
        inlineData: {
          mimeType: contentType,
          data: buffer.toString('base64')
        }
      };
    } catch (err) {
      console.error("Error fetching media from URL:", url, err);
      return null;
    }
  }

  async function getWhatsAppMediaUrl(mediaId: string, accessToken: string): Promise<string | null> {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error("Error retrieving WhatsApp media URL:", err);
      return null;
    }
  }

  async function generateIntelligentBotReply(userId: string, userMessageText: string, mediaUrls: { url: string, type: 'image' | 'audio' }[] = []): Promise<string> {
    try {
      const dbAdmin = getDb();
      
      // 1. Fetch merchant's hidden files (QA cache, sub-area delivery charges)
      let hiddenData: any = null;
      try {
        const hiddenSnap = await dbAdmin.collection('hidden_merchant_files').doc(userId).get();
        if (hiddenSnap.exists) {
          hiddenData = hiddenSnap.data();
        }
      } catch (err) {
        console.error("Error reading hidden merchant files in auto-reply:", err);
      }

      // 2. Query inventory
      const invSnap = await dbAdmin.collection('inventory').where('userId', '==', userId).get();
      const products: any[] = [];
      invSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.isPublic !== false) {
          const isUnlimited = !!data.isUnlimitedStock;
          products.push({
            name: data.name,
            retailPrice: data.landingPrice || data.proPrice || data.sellPrice || data.price || 0,
            landingPrice: data.landingPrice || data.sellPrice || data.price || 0,
            proPrice: data.proPrice || data.sellPrice || data.price || 0,
            stock: isUnlimited ? "Unlimited (পর্যাপ্ত স্টক রয়েছে)" : (data.stock || 0),
            isUnlimitedStock: isUnlimited,
            details: data.details || "",
            color: data.color || "None",
            size: data.size || "None",
            weight: data.weight || "None",
            warranty: data.hasWarranty ? (data.warrantyDuration || "Yes") : "No",
            replacement: data.hasReplacement ? (data.replacementDuration || "No") : "No",
            aiKnowledge: data.aiKnowledge || ""
          });
        }
      });

      // 3. Build system instruction
      let systemInstruction = `You are "DOEL messenger", powered by DOELpro, an expert Multilingual AI Customer Service agent for an e-commerce store. 
Your goal is to assist customers and help them buy products from our inventory.

INVENTORY PRODUCTS:
${JSON.stringify(products, null, 2)}
`;

      // Append custom delivery charges
      const customCharges = hiddenData?.customDeliveryCharges || [];
      if (customCharges.length > 0) {
        systemInstruction += `
CUSTOM SUB-AREA DELIVERY CHARGES (VERY IMPORTANT):
Our store charges different delivery fees based on the customer's area/sub-area:
${customCharges.map((cc: any) => `- Area: "${cc.area}", Delivery Charge: ৳${cc.charge} Taka`).join('\n')}

INSTRUCTIONS FOR DELIVERY CHARGES:
If a customer asks about the delivery charge, cost, or fee for any of the specific areas listed above, you MUST answer with the exact corresponding charge amount. Do NOT use fake or generic rates.
`;
      }

      systemInstruction += `
GENERAL RULES:
1. CUSTOMER'S LANGUAGE PRESERVATION (EXTREMELY IMPORTANT):
   - You MUST identify and reply in the EXACT same language that the customer is using (e.g., if they write in Bangla, reply in beautiful, friendly Bangla; if they write in English, reply in English; if they write in a mix or any other language, match their language style perfectly).
   - If the customer sends an image or voice note without text, detect the language of their voice note or respond in the store's primary language (Bangla) or English, matching their voice language.
2. PRODUCT SPECS & AI KNOWLEDGE (SUPPORT ANY LANGUAGE):
   - The product details, descriptions, and custom "aiKnowledge" rules might be written in Bangla, English, or another language. You MUST understand them fully and translate or adapt them accurately to answer the customer in their chosen language.
   - If a product has custom "aiKnowledge" defined, prioritize and strictly follow those specific instruction dialogues and guidelines.
3. PRICE & STYLING RULES (CRITICAL):
   - You MUST NEVER mention, leak, or reference any internal "wholesale price" (পাইকারি মূল্য / sellPrice) or "cost/purchase price" (ক্রয় মূল্য / কেনা মূল্য / buyPrice). You must only quote the retail price (খুচরা বিক্রয় মূল্য / retailPrice / landingPrice / proPrice) as "মূল্য" or "দাম" or "বিক্রয় মূল্য".
   - Under no circumstances should you use the terms "পাইকারি মূল্য", "ক্রয় মূল্য", or "কেনা মূল্য" when talking to customers.
4. STOCK RULES (CRITICAL):
   - Check the product's 'stock' property and tell them accurately. If stock is unlimited ("isUnlimitedStock: true"), say we have plenty/unlimited stock available. If a specific number, quote that number. If 0, mention that the item is currently out of stock ("স্টক শেষ") but we can pre-order or notify them when restocked.
5. MULTIMODAL INPUTS:
   - Customers may send product images or voice/audio messages.
   - You MUST analyze the image (e.g., to recognize which product they are showing or asking about, or to check a screenshot) and the voice message (e.g., transcribe and understand their spoken request) to give a cohesive, intelligent response.
6. Keep answers concise, highly engaging, and helpful. Format nicely with markdown (e.g., bold keywords, bullet points) for easier reading. Encourage them to buy by mentioning we support Cash on Delivery, fast home delivery, and safe payment.`;

      // 4. Download and convert media attachments to Base64 parts
      const parts: any[] = [];
      for (const media of mediaUrls) {
        const part = await fetchMediaAsBase64Part(media.url);
        if (part) {
          parts.push(part);
        }
      }

      // Add user message text part
      parts.push({ text: userMessageText || "User sent a media file/request." });

      // 5. Generate content using Gemini
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: systemInstruction
        }
      });

      return response.text || "Hello! We received your message and will get back to you soon.";
    } catch (error) {
      console.error("Error generating intelligent bot reply:", error);
      return "Hello! Thank you for contacting us. We will get back to you shortly.";
    }
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "DOEL messenger Service" });
  });

  // --- Order Rate Limit / Anti-Spam Check ---
  app.post("/api/orders/check-limit", async (req, res) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      const { deviceToken, isAdmin, bypass } = req.body;

      if (isAdmin || bypass) {
        return res.json({ allowed: true, count: 0, ip, deviceToken, isAdminBypass: true });
      }

      const dbAdmin = getDb();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let ipCount = 0;
      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        const ipSnap = await dbAdmin.collection('orders')
          .where('clientIp', '==', ip)
          .where('createdAt', '>=', twentyFourHoursAgo)
          .get();
        ipCount = ipSnap.size;
      }

      let tokenCount = 0;
      if (deviceToken) {
        const tokenSnap = await dbAdmin.collection('orders')
          .where('fraudToken', '==', deviceToken)
          .where('createdAt', '>=', twentyFourHoursAgo)
          .get();
        tokenCount = tokenSnap.size;
      }

      const totalCount = Math.max(ipCount, tokenCount);
      const allowed = totalCount < 10;

      res.json({
        allowed,
        count: totalCount,
        ip,
        deviceToken
      });
    } catch (error: any) {
      console.warn("Gracefully handling order rate limit check error:", error?.message || error);
      res.json({ allowed: true, count: 0, ip: "", error: error.message });
    }
  });

  // --- Gemini AI Routes ---
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt, model: modelName = "gemini-3.5-flash", systemInstruction, responseMimeType, responseSchema, images } = req.body;
      
      const parts: any[] = [];
      if (images && Array.isArray(images)) {
        images.forEach(img => {
          if (typeof img === 'string' && img.startsWith('data:image')) {
            const [mimeInfo, base64Data] = img.split(',');
            const mimeType = mimeInfo.split(':')[1].split(';')[0];
            parts.push({ inlineData: { mimeType, data: base64Data } });
          }
        });
      }
      parts.push({ text: prompt });

      const response = await generateContentWithRetry({
        model: modelName,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType,
          responseSchema
        }
      });

      const text = response.text || "";
      try {
        if (responseMimeType === "application/json") return res.json(JSON.parse(text));
        res.json({ text });
      } catch (e) {
        res.json({ text });
      }
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const status = getNumericStatus(error);
      const message = error.message || "Internal AI Error";
      res.status(status).json({ error: message, status });
    }
  });

// --- Robust Server-side In-Memory Cache implementation ---
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const merchantHiddenFilesCache = new Map<string, CacheItem<any>>(); // key: userId
const merchantInventoryCache = new Map<string, CacheItem<any[]>>(); // key: userId
const publicChatResponseCache = new Map<string, CacheItem<{ text: string; muted?: boolean }>>(); // key: userId_prompt_productId
const pageBotStatusCache = new Map<string, CacheItem<{ isBotExpired: boolean }>>();

const CACHE_TTL_HIDDEN_FILES = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_INVENTORY = 5 * 60 * 1000;    // 5 minutes
const CACHE_TTL_CHAT = 15 * 60 * 1000;        // 15 minutes
const CACHE_TTL_PAGE_BOT = 5 * 60 * 1000;      // 5 minutes

const getCleanPromptServer = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[?,./!@#$%^&*()_+\-=:;|"'’‘“”\u0964]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

  app.post("/api/ai/public-chat", async (req, res) => {
    try {
      const { userId, prompt, history = [], activeProduct, chatSourceId, images = [], audios = [] } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing merchant userId." });
      }

      // Double check page-level bot status (trial or active paid subscription)
      let isBotExpired = false;
      if (chatSourceId && chatSourceId.startsWith('lp_')) {
        const pageId = chatSourceId.substring(3);
        const pageCacheKey = pageId;
        const cachedPageStatus = pageBotStatusCache.get(pageCacheKey);
        
        if (cachedPageStatus && (Date.now() - cachedPageStatus.timestamp < CACHE_TTL_PAGE_BOT)) {
          isBotExpired = cachedPageStatus.data.isBotExpired;
        } else {
          try {
            const dbAdmin = getDb();
            const pageSnap = await dbAdmin.collection('landing-pages').doc(pageId).get();
            if (pageSnap.exists) {
              const pageData = pageSnap.data() || {};
              
              // Check manual disable toggle
              if (pageData.dragonBotEnabled === false) {
                isBotExpired = true;
              } else {
                let isTrialExpired = true;
                if (pageData.createdAt) {
                  // Support multiple timestamp variations (seconds, _seconds, ISO string)
                  const createdTime = pageData.createdAt.seconds 
                    ? pageData.createdAt.seconds * 1000 
                    : (pageData.createdAt._seconds
                      ? pageData.createdAt._seconds * 1000
                      : (pageData.createdAt.toDate 
                        ? pageData.createdAt.toDate().getTime() 
                        : new Date(pageData.createdAt).getTime()));
                  
                  const trialExpiry = createdTime + 48 * 60 * 60 * 1000;
                  if (Date.now() < trialExpiry) {
                    isTrialExpired = false;
                  }
                }
                
                let isPaidActive = false;
                if (pageData.botPaymentStatus === 'approved') {
                  const expTime = pageData.botExpiryTime ? new Date(pageData.botExpiryTime).getTime() : 0;
                  if (expTime > Date.now()) {
                    isPaidActive = true;
                  }
                }
                
                if (isTrialExpired && !isPaidActive) {
                  isBotExpired = true;
                }
              }
            }
            
            pageBotStatusCache.set(pageCacheKey, {
              data: { isBotExpired },
              timestamp: Date.now()
            });
          } catch (err) {
            console.error("Error double checking page bot status on server:", err);
          }
        }
      }

      if (isBotExpired) {
        console.log(`[Bot Expiry] Server-side blocking prompt. Page ID associated: ${chatSourceId}`);
        return res.json({ text: "", muted: true });
      }

      // Check server-side Chat Cache before doing any database or AI operations
      const hasMedia = (images && images.length > 0) || (audios && audios.length > 0);
      const cleanedPrompt = getCleanPromptServer(prompt || "");
      const activeProductId = activeProduct?.id || activeProduct?.name || 'general';
      const chatCacheKey = `${userId}_${cleanedPrompt}_${activeProductId}`;

      if (!hasMedia && prompt) {
        const cachedResponse = publicChatResponseCache.get(chatCacheKey);
        if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL_CHAT)) {
          console.log(`[Server Memory Cache Hit] Serving chat response in-memory for userId: ${userId}, prompt: "${prompt}"`);
          return res.json(cachedResponse.data);
        }
      }

      // Log the customer query details inside the Universal Chat Log database using Admin SDK
      try {
        const dbAdmin = getDb();
        await dbAdmin.collection('universal_chat_logs').add({
          userId,
          prompt,
          activeProduct: activeProduct || null,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error logging customer question to universal database:", err);
      }

      // Fetch the user's hidden file/database for cached QA & regional delivery charges using Admin SDK
      let cachedResponseText: string | null = null;
      let hiddenData: any = null;
      
      const hiddenCacheKey = userId;
      const cachedHidden = merchantHiddenFilesCache.get(hiddenCacheKey);
      if (cachedHidden && (Date.now() - cachedHidden.timestamp < CACHE_TTL_HIDDEN_FILES)) {
        hiddenData = cachedHidden.data;
      } else {
        try {
          const dbAdmin = getDb();
          const hiddenSnap = await dbAdmin.collection('hidden_merchant_files').doc(userId).get();
          if (hiddenSnap.exists) {
            hiddenData = hiddenSnap.data();
            merchantHiddenFilesCache.set(hiddenCacheKey, {
              data: hiddenData,
              timestamp: Date.now()
            });
          }
        } catch (err) {
          console.error("Error reading hidden merchant files:", err);
        }
      }

      if (hiddenData) {
        // A. Check for Area-based Delivery Charge matches
        const customCharges = hiddenData.customDeliveryCharges || [];
        const lowercasePrompt = (prompt || "").toLowerCase();
        
        // Match phrases related to delivery / courier / fee / price
        const deliveryKeywords = ["delivery", "charge", "cost", "fee", "ডেলিভারি", "ডেলিভারী", "কস্ট", "চার্জ", "ফি", "টাকা", "কত", "কতো", "পাঠাতে"];
        const hasDeliveryIntent = deliveryKeywords.some(keyword => lowercasePrompt.includes(keyword));
        
        if (hasDeliveryIntent && customCharges.length > 0) {
          // Map common Bangla spellings to English and vice-versa for Bangladeshi commerce context
          const banglaToEngMap: Record<string, string> = {
            "মিরপুর": "mirpur",
            "উত্তরা": "uttara",
            "ধানমন্ডি": "dhanmondi",
            "গুলশান": "gulshan",
            "বনানী": "banani",
            "মোহাম্মদপুর": "mohammadpur",
            "বাড্ডা": "badda",
            "কেরানীগঞ্জ": "keraniganj",
            "টঙ্গী": "tongi",
            "গাজীপুর": "gazipur",
            "সাভার": "savar",
            "চট্টগ্রাম": "chittagong",
            "খুলনা": "khulna",
            "সিলেট": "sylhet",
            "রাজশাহী": "rajshahi",
            "বরিশাল": "barisal",
            "রংপুর": "rangpur",
            "কুমিল্লা": "comilla",
            "ময়মনসিংহ": "mymensingh",
            "যশোর": "jessore",
            "বগুড়া": "bogura"
          };
          
          const engToBanglaMap: Record<string, string> = {};
          Object.entries(banglaToEngMap).forEach(([b, e]) => {
            engToBanglaMap[e] = b;
          });

          // Convert digits and remove spacing characters to make matches completely bulletproof
          const dMap: Record<string, string> = {
            '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5',
            '৬': '6', '৭': '7', '৮': '8', '৯': '9', '০': '0'
          };
          
          const normalizeString = (str: string) => {
            let res = str.toLowerCase().replace(/[-_ \s]/g, ''); // remove dashes, underscores, spaces
            Object.entries(dMap).forEach(([b, e]) => {
              res = res.replaceAll(b, e);
            });
            return res;
          };

          const normalizedPrompt = normalizeString(prompt || "");

          for (const item of customCharges) {
            const areaName = item.area.toLowerCase().trim();
            const normalizedArea = normalizeString(areaName);
            
            // Check direct match
            let matchInPrompt = normalizedPrompt.includes(normalizedArea);

            // Check translation fallback if no direct match was found
            if (!matchInPrompt) {
              const baseName = item.area.replace(/[0-9\s-_১২৩৪৫৬৭৮৯০]/g, '').trim(); // extract text base e.g. "মিরপুর"
              const mappedBase = banglaToEngMap[baseName] || engToBanglaMap[baseName.toLowerCase()];
              if (mappedBase) {
                const fallbackArea = item.area.replace(baseName, mappedBase);
                const normalizedFallback = normalizeString(fallbackArea);
                matchInPrompt = normalizedPrompt.includes(normalizedFallback);
              }
            }

            if (matchInPrompt) {
              cachedResponseText = `আপনার জিজ্ঞাসিত এলাকা "${item.area}" এর জন্য আমাদের ডেলিভারি চার্জ হচ্ছে ৳${item.charge}।`;
              break;
            }
          }
        }

        // B. Check for stored Q&A cache matches (to lower Gemini cost/billing)
        if (!cachedResponseText && hiddenData.qaCache && Array.isArray(hiddenData.qaCache)) {
          const qaCache = hiddenData.qaCache;
          
          const cleanString = (str: string) => {
            return str
              .toLowerCase()
              .replace(/[?,./!@#$%^&*()_+\-=:;|"'’‘“”\u0964]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          };
          
          const cleanPrompt = cleanString(prompt || "");
          
          if (cleanPrompt) {
            // Check exact match
            for (const item of qaCache) {
              if (cleanString(item.question) === cleanPrompt) {
                cachedResponseText = item.answer;
                break;
              }
            }
            
            // Check substring mapping
            if (!cachedResponseText) {
              for (const item of qaCache) {
                const cleanQ = cleanString(item.question);
                if (cleanQ.length > 4 && cleanPrompt.length > 4) {
                  if (cleanPrompt.includes(cleanQ) || cleanQ.includes(cleanPrompt)) {
                    cachedResponseText = item.answer;
                    break;
                  }
                }
              }
            }
            
            // Check keyword/token overlap match (>65%)
            if (!cachedResponseText) {
              let bestScore = 0;
              let bestAns = null;
              
              const getWords = (s: string) => {
                return new Set(s.toLowerCase().split(/\s+/).filter(w => w.length > 1));
              };
              const promptWords = getWords(prompt || "");
              
              for (const item of qaCache) {
                const qWords = getWords(item.question);
                if (qWords.size === 0 || promptWords.size === 0) continue;
                
                const intersection = new Set([...promptWords].filter(w => qWords.has(w)));
                const union = new Set([...promptWords, ...qWords]);
                const score = intersection.size / union.size;
                
                if (score > 0.65 && score > bestScore) {
                  bestScore = score;
                  bestAns = item.answer;
                }
              }
              if (bestAns) {
                cachedResponseText = bestAns;
              }
            }
          }
        }
      }

      // If matches, return cached/pre-defined query answer directly to avoid calling Gemini API!
      if (cachedResponseText) {
        console.log(`[Database Q&A Cache Hit] Serving pre-learned answer for customer prompt: "${prompt}"`);
        // Store also in our server memory cache so we don't even query hidden_merchant_files next time
        if (!hasMedia && prompt) {
          publicChatResponseCache.set(chatCacheKey, {
            data: { text: cachedResponseText },
            timestamp: Date.now()
          });
        }
        return res.json({ text: cachedResponseText });
      }

      // Query inventory with server-side in-memory cache
      let products: any[] = [];
      const inventoryCacheKey = userId;
      const cachedInventory = merchantInventoryCache.get(inventoryCacheKey);
      if (cachedInventory && (Date.now() - cachedInventory.timestamp < CACHE_TTL_INVENTORY)) {
        products = cachedInventory.data;
      } else {
        try {
          const dbAdmin = getDb();
          const invSnap = await dbAdmin.collection('inventory').where('userId', '==', userId).get();
          
          invSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.isPublic !== false) {
              const isUnlimited = !!data.isUnlimitedStock;
              products.push({
                name: data.name,
                retailPrice: data.landingPrice || data.proPrice || data.sellPrice || data.price || 0,
                landingPrice: data.landingPrice || data.sellPrice || data.price || 0,
                proPrice: data.proPrice || data.sellPrice || data.price || 0,
                stock: isUnlimited ? "Unlimited (পর্যাপ্ত স্টক রয়েছে)" : (data.stock || 0),
                isUnlimitedStock: isUnlimited,
                details: data.details || "",
                color: data.color || "None",
                size: data.size || "None",
                weight: data.weight || "None",
                warranty: data.hasWarranty ? (data.warrantyDuration || "Yes") : "No",
                replacement: data.hasReplacement ? (data.replacementDuration || "No") : "No",
                aiKnowledge: data.aiKnowledge || ""
              });
            }
          });
          
          merchantInventoryCache.set(inventoryCacheKey, {
            data: products,
            timestamp: Date.now()
          });
        } catch (err) {
          console.error("Error loading inventory from Firestore:", err);
        }
      }

      let systemInstruction = `You are "DOEL messenger", powered by DOELpro, an expert Multilingual AI Customer Service agent for a social commerce store. 
Your goal is to assist customers and help them buy products from our inventory.

INVENTORY PRODUCTS:
${JSON.stringify(products, null, 2)}
`;

      // Append custom sub-area delivery charges from the merchant's hidden file
      const customCharges = hiddenData?.customDeliveryCharges || [];
      if (customCharges.length > 0) {
        systemInstruction += `
CUSTOM SUB-AREA DELIVERY CHARGES (VERY IMPORTANT):
Our store charges different delivery fees based on the customer's area/sub-area. Here are the exact custom regional rates configured for our business:
${customCharges.map((cc: any) => `- Area: "${cc.area}", Delivery Charge: ৳${cc.charge} Taka`).join('\n')}

INSTRUCTIONS FOR DELIVERY CHARGES:
If a customer asks about the delivery charge, cost, or fee for any of the specific areas listed above, you MUST answer with the exact corresponding charge amount listed. Do NOT use fake or generic rates (like ৳60 or ৳100) for these areas. For any other area not listed here, use standard rates.
`;
      }

      if (activeProduct) {
        systemInstruction += `
DEDICATED PRODUCT CONTEXT (CRITICAL CONSTRAINT):
The customer is viewing a single dedicated page/modal for this product:
${JSON.stringify(activeProduct, null, 2)}

SPECIFIC INSTRUCTIONS:
1. You MUST ONLY respond to, discuss, and answer questions about this single dedicated product: "${activeProduct.name}".
2. Do NOT mention, suggest, recommend, or list other products from our inventory.
3. If the customer asks about other products, politely remind them that this page is dedicated exclusively to "${activeProduct.name}" and redirect their focus to the features, specifications, and buying information of this product.
`;
      } else {
        systemInstruction += `
GENERAL STORE CONTEXT (MAIN CATALOG):
The customer is browsing our entire general catalog and store landing page. No single product is currently dedicated.

SPECIFIC INSTRUCTIONS:
1. If the customer's intent is general, or if they ask a question before naming a product, you MUST politely ask them which product in our catalog they are interested in first, so you can help them with exact details.
2. For reference, here are all our products in stock: ${products.map(p => p.name).join(', ')}.
3. Only list or discuss products with details once the customer mentions a product or indicates their interest in a specific product.
`;
      }

      systemInstruction += `
GENERAL RULES:
1. CUSTOMER'S LANGUAGE PRESERVATION (EXTREMELY IMPORTANT):
   - You MUST identify and reply in the EXACT same language that the customer is using (e.g., if they write in Bangla, reply in beautiful, friendly Bangla; if they write in English, reply in English; if they write in a mix or any other language, match their language style perfectly).
   - If the customer sends an image or voice note without text, detect the language of their voice note or respond in the store's primary language (Bangla) or English, matching their voice language.
2. PRODUCT SPECS & AI KNOWLEDGE (SUPPORT ANY LANGUAGE):
   - The product details, descriptions, and custom "aiKnowledge" rules might be written in Bangla, English, or another language. You MUST understand them fully and translate or adapt them accurately to answer the customer in their chosen language.
   - If a product has custom "aiKnowledge" defined, prioritize and strictly follow those specific instruction dialogues and guidelines.
3. PRICE & STYLING RULES (CRITICAL):
   - You MUST NEVER mention, leak, or reference any internal "wholesale price" (পাইকারি মূল্য / sellPrice) or "cost/purchase price" (ক্রয় মূল্য / কেনা মূল্য / buyPrice). The customer is a retail customer. You must only quote the retail price (খুচরা বিক্রয় মূল্য / retailPrice / landingPrice / proPrice) as "মূল্য" or "দাম" or "বিক্রয় মূল্য".
   - Under no circumstances should you use the terms "পাইকারি মূল্য", "ক্রয় মূল্য", or "কেনা মূল্য" when talking to customers.
4. STOCK RULES (CRITICAL):
   - When a customer asks about a product's stock availability (স্টক / স্টক কত আছে / এভেইলেবল নাকি), you MUST check its 'stock' property and tell them the status.
   - If stock is marked as having unlimited stock ("isUnlimitedStock: true" or stock contains "Unlimited" / "পর্যাপ্ত"), say we have plenty/unlimited stock available ("পর্যাপ্ত পরিমানে স্টক রয়েছে").
   - If the stock is a specific number (e.g., 5 or 10), reply with the exact number remaining in stock so they feel a sense of urgency.
   - If stock is 0, mention that the item is currently out of stock ("স্টক শেষ") but we can pre-order or notify them when restocked.
5. MULTIMODAL INPUTS:
   - Customers may send product images or voice/audio messages.
   - You MUST analyze the image (e.g., to recognize which product they are showing or asking about, or to check a screenshot) and the voice message (e.g., transcribe and understand their spoken request) to give a cohesive, intelligent response.
6. Give details such as colors, sizes, stock, price, warranty and replacements accurately based on the inventory context. Do not invent products or specifications.
7. Encourage them to buy by mentioning we support Cash on Delivery, fast home delivery, and safe payment.
8. Keep answers concise, highly engaging, and helpful. Format nicely with markdown if appropriate (e.g. bold keywords, bullet points) for easier reading.`;

      const parts: any[] = [];

      // Handle base64 images in public web chat
      if (images && Array.isArray(images)) {
        images.forEach(img => {
          if (typeof img === 'string' && img.startsWith('data:image')) {
            const [mimeInfo, base64Data] = img.split(',');
            const mimeType = mimeInfo.split(':')[1].split(';')[0];
            parts.push({ inlineData: { mimeType, data: base64Data } });
          }
        });
      }

      // Handle base64 audios/voices in public web chat
      if (audios && Array.isArray(audios)) {
        audios.forEach(aud => {
          if (typeof aud === 'string' && aud.startsWith('data:audio')) {
            const [mimeInfo, base64Data] = aud.split(',');
            const mimeType = mimeInfo.split(':')[1].split(';')[0];
            parts.push({ inlineData: { mimeType, data: base64Data } });
          }
        });
      }

      parts.push({ text: prompt || "Customer shared media / attachment" });

      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === 'customer' || h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts
      });

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const text = response.text || "আমি আন্তরিকভাবে দুঃখিত, অনুগ্রহ করে আবার চেষ্টা করুন।";

      // Automatically save newly generated response to QA cache in merchant's hidden file using Admin SDK
      try {
        if (text && text !== "আমি আন্তরিকভাবে দুঃখিত, অনুগ্রহ করে আবার চেষ্টা করুন।") {
          const dbAdmin = getDb();
          const hiddenDocRef = dbAdmin.collection('hidden_merchant_files').doc(userId);
          const hiddenSnap = await hiddenDocRef.get();
          let qaCache = [];
          let currentProducts = [];
          let customDeliveryCharges = [];
          if (hiddenSnap.exists) {
            const hData = hiddenSnap.data() || {};
            qaCache = hData.qaCache || [];
            currentProducts = hData.products || [];
            customDeliveryCharges = hData.customDeliveryCharges || [];
          }
          
          const questionClean = (prompt || "").trim();
          const answerClean = text.trim();
          
          // Avoid duplicate question entries
          const exists = qaCache.some((item: any) => item.question.toLowerCase().trim() === questionClean.toLowerCase());
          if (!exists && questionClean.length > 2 && answerClean.length > 2) {
            qaCache.push({
              question: questionClean,
              answer: answerClean,
              timestamp: new Date().toISOString()
            });
            await hiddenDocRef.set({
              userId,
              products: currentProducts,
              customDeliveryCharges,
              qaCache,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            // Sync with local memory cache to keep it up to date
            merchantHiddenFilesCache.set(hiddenCacheKey, {
              data: {
                userId,
                products: currentProducts,
                customDeliveryCharges,
                qaCache,
                updatedAt: new Date().toISOString()
              },
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        console.error("Error auto-adding Gemini Q&A to merchant hidden file cache:", err);
      }

      // Store in our server memory cache to prevent repeating the Gemini API call for the next 15 minutes
      if (!hasMedia && prompt && text && text !== "আমি আন্তরিকভাবে দুঃখিত, অনুগ্রহ করে আবার চেষ্টা করুন।") {
        publicChatResponseCache.set(chatCacheKey, {
          data: { text },
          timestamp: Date.now()
        });
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Dragon Public Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  app.post("/api/ai/generate-listing", async (req, res) => {
    try {
      const { input, image } = req.body;
      
      const parts: any[] = [
        {
          text: `You are DOELpro AI, a social commerce genius. 
          Generate a professional product listing for: "${input}". 
          Return the output in a strict JSON format with fields: 
          title (catchy, high-converting), 
          details (persuasive product description), 
          hashtags (object with tiktok, youtube, facebook strings including #), 
          keywords (comma separated list).`
        }
      ];

      if (image && typeof image === 'string' && image.startsWith('data:image')) {
        const [mimeInfo, base64Data] = image.split(',');
        const mimeType = mimeInfo.split(':')[1].split(';')[0];
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ role: 'user', parts }]
      });
      
      const text = response.text || "";
      const sanitized = text.replace(/```json|```/g, '').trim();
      res.json(JSON.parse(sanitized));
    } catch (error: any) {
      console.error("AI Listing Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-knowledge", async (req, res) => {
    try {
      const { productName, productDetails, color, size, price, buyPrice, stock } = req.body;
      if (!productName) {
        return res.status(400).json({ error: "Product name is required for training." });
      }

      console.log(`[Gemini Knowledge] Generating custom AI Knowledge for: ${productName}`);

      const prompt = `
Please write a comprehensive customer response guideline (AI Knowledge / Training Profile) in beautifully natural Bangla for the following product:
- Product Name: ${productName}
- Product Details: ${productDetails || "Not specified"}
- Color options: ${color || "Not specified"}
- Size options: ${size || "Not specified"}
- Sell Price (Retail Price): ৳${price || "Not specified"}
- Available Stock: ${stock || "Not specified"}

CRITICAL SECURITY CONSTRAINT:
You MUST NEVER mention, leak, or include any reference to the internal merchant's "buyPrice" (কেনা মূল্য / ক্রয় মূল্য) or "sellPrice" (পাইকারি মূল্য) in this generated training text. Always refer to the Sell Price as the customer's Retail Price (বিক্রয় মূল্য / দাম). Under no circumstances use the terms "পাইকারি মূল্য", "ক্রয় মূল্য", or "কেনা মূল্য".

YOUR TASK:
Write a training context that details how the AI Customer Service Agent should talk to customers about this product, what questions customers are likely to ask, and how the AI should answer them.

Please format your response clearly in Bangla with the following structure:
1. **কাস্টমারের সাথে কথা বলার ধরণ ও টোনের গাইডলাইন (Communication Style & Tone):**
   (Explain how to greet, be polite, encourage purchasing, explain benefits, and keep an active friendly tone)

2. **সম্ভাবনা কাস্টমার প্রশ্ন ও উত্তর সংলাপ (Likely FAQ Dialogue Paragraphs):**
   (Write 3-4 dialogue-style exchanges between a Customer and the AI agent addressing common questions about price, sizes, color options, warranty/delivery, materials, or durability, and showing exactly how to reply elegantly, convincingly and professionally).

Use very natural and persuasive Bangla. Format the text elegantly with markdown, bullet points, and dialog prefixes (যেমন- কাস্টমার: এবং ড্রাগন এআই:). Do not write intro/outro text, just get straight to the training guide.
`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ text: response.text || "দুঃখিত, নলেজ তৈরি করতে ব্যর্থ হয়েছে।" });
    } catch (error: any) {
      console.error("Generate Knowledge Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI Knowledge" });
    }
  });

  app.post("/api/ai/generate-themes", async (req, res) => {
    try {
      const productData = req.body;

      const textPrompt = `You are "AI Web Designer," an expert in high-conversion e-commerce pages.
Your mission: Design 3 professional landing pages for the provided product.

SECURITY PROTOCOL:
- TRUSTED LIBRARIES: You MAY use Three.js, GSAP, Lottie-web, tsparticles, and Matter.js via standard cdnjs or unpkg CDNs.
- SECURITY: DO NOT incorporate unknown CDNs, tracking pixels, or malicious scripts.
- ANIMATION: Use these libraries to create "Real Live" immersive themes if mentioned in the brand vision.
- The reference code provided is for LAYOUT INSPIRATION ONLY. Strip any logic and focus on visual hierarchy.

USER DESIGN DIRECTION:
${productData.customPrompt ? `- BRAND VISION: ${productData.customPrompt}` : ""}
${productData.referenceImage ? `- VISUAL STYLE REFERENCE: Mimic the spacing, color distribution, and elite UI vibe of the attached image.` : ""}
${productData.referenceCode ? `- STRUCTURAL LOGIC: Use this layout blueprint while ensuring safety: ${productData.referenceCode}` : ""}
${productData.aiMotionEnabled ? `- 3D MOTION ENABLED:
  1. PRIMARY ASSET: Use 'transparent_png' as the absolute hero object.
  2. TRANSPARENCY PROTOCOL: The image MUST have 'background: transparent !important;'. Do NOT use containers with 'bg-black' or 'bg-white' for this asset.
  3. MOTION DESIGN: Implementation of 'animate-[dragonOrbit360_10s_linear_infinite]' is REQUIRED.
  4. DEPTH & STYLE: Overlay the hero section with a subtle 'backdrop-blur-3xl bg-white/5' glass panel and ensure it feels like a professional 3D environment.
  5. LAYOUT PRECISION: Seal all gaps between Header and Hero. Zero vertical margins.` : ""}

PRODUCT DATA:
- Brand: ${productData.brandName}
- Title: ${productData.title}
- Store Price: ${productData.price} BDT
- Discount: ${productData.discount || 0} BDT
- Details: ${productData.details}

DESIGN REQUIREMENTS:
1. FULL-SCOPE PAGE: Every theme MUST include a professional Sticky Header (Logo, Nav, CTA), a High-Impact Hero, Product Showcase Gallery, Service Warranty Badges, Social Proof, a prominent Order Form, and a modern Multi-column Footer.
2. CONVERSION PSYCHOLOGY: Strategically place "Order Now" triggers. Labels must be professional Bengali ('পূর্ণ নাম', 'ঠিকানা (থানা/জেলা)', 'সচল মোবাইল নম্বর').
3. ELITE VISUALS: Use advanced Tailwind (Glassmorphism, Backdrop Filters, Custom Gradients, Bento Grids).
4. 3D ROTATION: If aiMotionEnabled is true and transparent_png is available, apply 'animate-[dragonOrbit360_10s_linear_infinite]' to the image. Ensure the image is rendered with 'drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]'.
5. TECHNICAL SPECS:
   - Form IDs: 'customer_name', 'customer_address', 'customer_phone'.
   - Submit Button: type='submit' and id='ai-submit-btn'.
   - Images: Use placeholders image_url_0, image_url_1... and transparent_png.
   - Minified, single-line HTML string.

STRICT OUTPUT: JSON ARRAY ONLY.`;

      const imageParts = [];
      if (productData.images) {
        productData.images.filter((img: string) => typeof img === 'string' && img.startsWith('data:image')).forEach((img: string) => {
          const [mimeInfo, base64Data] = img.split(',');
          const mimeType = mimeInfo.split(':')[1].split(';')[0];
          imageParts.push({ inlineData: { mimeType, data: base64Data } });
        });
      }

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              ...imageParts as any[],
              { text: textPrompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                theme_id: { type: Type.STRING },
                theme_name: { type: Type.STRING },
                dominant_color: { type: Type.STRING },
                accent_color: { type: Type.STRING },
                html_structure: { 
                  type: Type.STRING,
                  description: "Full minified HTML with Tailwind CSS. Use placeholders like image_url_0, image_url_1 for product images. MUST be a single line string. Use transparent_png for the 3D asset."
                }
              },
              required: ["theme_id", "theme_name", "dominant_color", "accent_color", "html_structure"]
            }
          }
        }
      });

      const text = response.text || "";
      let themes = JSON.parse(text);
      
      // Secondary server-side replacement of placeholders if needed
      themes = themes.map((theme: any) => {
        let html = theme.html_structure;
        if (productData.images) {
          productData.images.forEach((url: string, i: number) => {
            html = html.replace(new RegExp(`image_url_${i}`, 'g'), url);
          });
        }
        if (productData.transparentPng) {
          html = html.replace(/transparent_png/g, productData.transparentPng);
        }
        return { ...theme, html_structure: html };
      });

      res.json(themes);
    } catch (error: any) {
      console.error("AI Themes Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-pro", async (req, res) => {
    try {
      const userInput = req.body;

      const textPrompt = `You are a "Senior E-commerce Designer."
Your task is to generate a professional, high-converting configuration for a full e-commerce website.

CONTEXT:
- Brand Name: ${userInput.brandName}
- Industry: ${userInput.niche}
- Existing Inventory count: ${userInput.inventory?.length || 0}
- WhatsApp: ${userInput.whatsapp}

REQUIREMENTS:
1. HEADER: Creative navigation labels (e.g., New Arrivals, Best Sellers, Flash Sale).
2. HERO: A compelling, punchy headline and a subheadline that builds trust.
3. CATEGORIES: Create 3-5 logical categories based on the industry niche.
4. CATALOG: 
   - If inventory provided, categorize them.
   - If no inventory provided, generate 6 placeholder products with professional names and "https://images.unsplash.com/photo-..." URLs.
5. FOOTER: Short "About Us" and contact info.

OUTPUT: Return a single JSON object strictly matching the ProWebsiteConfig schema.`;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: textPrompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              header: {
                type: Type.OBJECT,
                properties: {
                  nav: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        link: { type: Type.STRING }
                      },
                      required: ["label", "link"]
                    }
                  }
                },
                required: ["nav"]
              },
              hero: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  coverImage: { type: Type.STRING },
                  ctaText: { type: Type.STRING }
                },
                required: ["title", "subtitle", "coverImage", "ctaText"]
              },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING }
                  },
                  required: ["id", "name"]
                }
              },
              catalog: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    comparePrice: { type: Type.NUMBER },
                    image: { type: Type.STRING },
                    categoryId: { type: Type.STRING }
                  },
                  required: ["id", "name", "price", "image", "categoryId"]
                }
              },
              footer: {
                type: Type.OBJECT,
                properties: {
                  about: { type: Type.STRING },
                  whatsapp: { type: Type.STRING }
                },
                required: ["about", "whatsapp"]
              }
            },
            required: ["brandName", "header", "hero", "categories", "catalog", "footer"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("AI Pro Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Meta OAuth Logic
  app.get("/api/auth/facebook/url", async (req, res) => {
    try {
      const db = getDb();
      const metaDoc = await db.collection('global_settings').doc('meta').get();
      if (!metaDoc.exists) {
        return res.status(500).json({ error: "Meta Application not configured by admin" });
      }
      const { metaAppId } = metaDoc.data()!;
      
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const redirectUri = `${appUrl}/api/auth/facebook/callback`;
      
      const params = new URLSearchParams({
        client_id: metaAppId,
        redirect_uri: redirectUri,
        scope: 'pages_messaging,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_messages,whatsapp_business_management,whatsapp_business_messaging',
        response_type: 'code'
      });
      
      const url = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
      res.json({ url });
    } catch (error) {
       console.error("Error generating FB auth URL:", error);
       res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/auth/facebook/callback", async (req, res) => {
    const { code, state } = req.query; // state could be userId if passed
    if (!code) return res.send("Auth failed: No code provided");

    try {
      const db = getDb();
      const metaDoc = await db.collection('global_settings').doc('meta').get();
      const { metaAppId, metaAppSecret } = metaDoc.data()!;
      
      const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const redirectUri = `${appUrl}/api/auth/facebook/callback`;

      // 1. Exchange code for user access token
      const tokenRes = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${redirectUri}&client_secret=${metaAppSecret}&code=${code}`);
      const tokenData: any = await tokenRes.json();
      
      if (tokenData.error) throw new Error(tokenData.error.message);

      // In a real app, you'd associate this token with a user.
      // For this demo, we'll return a success page that posts message to opener
      res.send(`
        <html>
          <body style="background: black; color: white; face: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <div style="text-align: center;">
              <h2 style="color: #6366f1;">AUTH SUCCESSFUL</h2>
              <p>Meta Connection established. You can now close this window.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'FB_AUTH_SUCCESS', 
                    accessToken: '${tokenData.access_token}'
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("FB Callback Error:", error);
      res.status(500).send(`Auth Error: ${error.message}`);
    }
  });

  // Facebook/Instagram Webhook Verification
  app.get("/api/webhook/facebook", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const db = getDb();
    const metaDoc = await db.collection('global_settings').doc('meta').get();
    const verifyToken = metaDoc.exists ? metaDoc.data()!.metaVerifyToken : "DRAGON_AI_TOKEN";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("FB_WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // Helper function to check if Magic Box configuration is active (Trial or Approved Premium)
  function isConfigActive(config: any): boolean {
    if (!config) return false;
    if (config.status !== 'active') return false;

    // 1. Premium Check
    if (config.paymentStatus === 'approved') {
      const expTime = config.expiryTime ? new Date(config.expiryTime).getTime() : 0;
      if (expTime > Date.now()) {
        return true;
      }
    }

    // 2. Trial Check
    if (config.trialStartTime) {
      const trialStart = new Date(config.trialStartTime).getTime();
      const trialExpiry = trialStart + 48 * 60 * 60 * 1000; // 48 hours
      if (trialExpiry > Date.now()) {
        return true;
      }
    }

    return false;
  }

  // Facebook/Instagram Webhook Event Handler
  app.post("/api/webhook/facebook", async (req, res) => {
    const body = req.body;

    if (body.object === "page" || body.object === "instagram") {
      const db = getDb();
      for (const entry of body.entry) {
        // Handle Messaging (Messenger or IG DM)
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            if (messagingEvent.message && !messagingEvent.message.is_echo) {
              const senderId = messagingEvent.sender.id;
              const recipientId = messagingEvent.recipient.id; // This is the Page ID or IG ID
              const messageText = messagingEvent.message.text;

              console.log(`[Meta Webhook] Message from ${senderId} to ${recipientId}: ${messageText}`);

              // 1. Find the automation config for this Page ID (either directly or via subscribedPageIds)
              let config: any = null;
              
              // Direct pageId lookup
              const directSnap = await db
                .collection('magic_box')
                .where('pageId', '==', recipientId)
                .where('status', '==', 'active')
                .get();

              if (!directSnap.empty) {
                config = directSnap.docs[0].data();
              } else {
                // Check if recipientId is part of comma-separated subscribedPageIds in a facebook config
                const fbSnap = await db
                  .collection('magic_box')
                  .where('platform', '==', 'facebook')
                  .where('status', '==', 'active')
                  .get();

                for (const doc of fbSnap.docs) {
                  const data = doc.data();
                  if (data.subscribedPageIds) {
                    const ids = data.subscribedPageIds.split(',').map((id: string) => id.trim());
                    if (ids.includes(recipientId)) {
                      config = data;
                      break;
                    }
                  }
                }
              }

              if (config && isConfigActive(config)) {
                const mediaUrls: { url: string, type: 'image' | 'audio' }[] = [];

                // Extract Facebook Messenger media attachments (image or audio)
                if (messagingEvent.message.attachments && Array.isArray(messagingEvent.message.attachments)) {
                  messagingEvent.message.attachments.forEach((att: any) => {
                    if (att.type === 'image' && att.payload && att.payload.url) {
                      mediaUrls.push({ url: att.payload.url, type: 'image' });
                    } else if (att.type === 'audio' && att.payload && att.payload.url) {
                      mediaUrls.push({ url: att.payload.url, type: 'audio' });
                    }
                  });
                }

                console.log(`[Meta Webhook] Generating reply with ${mediaUrls.length} media files...`);
                const replyText = await generateIntelligentBotReply(config.userId, messageText || "", mediaUrls);

                // 3. Send reply
                await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${config.accessToken}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { id: senderId },
                    message: { text: replyText }
                  })
                });
                console.log(`[Meta Webhook] Replied to ${senderId}`);
              } else {
                console.log(`[Meta Webhook] No active config found for ${recipientId}`);
              }
            }
          }
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // Example Courier Integration Endpoint (Placeholder for real logic)
  app.post("/api/courier/track", async (req, res) => {
    const { courier, trackingId } = req.body;
    res.json({ 
      trackingId, 
      courier, 
      status: "Processing", 
      updates: [{ time: new Date().toISOString(), message: "Order Received" }]
    });
  });

  // Magic Box Webhook (Placeholder)
  app.post("/api/magicbox/webhook", (req, res) => {
    console.log("Magic Box Webhook received:", req.body);
    res.sendStatus(200);
  });

  // WhatsApp Webhook Verification
  app.get("/api/webhook/whatsapp", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const db = getDb();
    const metaDoc = await db.collection('global_settings').doc('meta').get();
    const verifyToken = metaDoc.exists ? metaDoc.data()!.metaVerifyToken : "DRAGON_AI_TOKEN";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WHATSAPP_WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  // WhatsApp Webhook Message Handler
  app.post("/api/webhook/whatsapp", async (req, res) => {
    const body = req.body;

    if (body.object === "whatsapp_business_account") {
      const db = getDb();
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const messageObj = body.entry[0].changes[0].value.messages[0];
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = messageObj.from; // sender's phone number
        const msg_body = messageObj.text?.body || messageObj.caption || ""; 
        const msg_type = messageObj.type;

        if (!msg_body && !['image', 'audio', 'voice'].includes(msg_type)) return res.sendStatus(200);

        console.log(`[WhatsApp Webhook] Received ${msg_type} from ${from} for ID ${phone_number_id}: ${msg_body}`);

        // 1. Find the automation config for this WhatsApp Phone Number ID
        const configSnap = await db
          .collection('magic_box')
          .where('pageId', '==', phone_number_id)
          .where('platform', '==', 'whatsapp')
          .where('status', '==', 'active')
          .get();

        if (!configSnap.empty) {
          const config = configSnap.docs[0].data();
          
          if (isConfigActive(config)) {
            const mediaUrls: { url: string, type: 'image' | 'audio' }[] = [];

            try {
              if (msg_type === 'image' && messageObj.image && messageObj.image.id) {
                const url = await getWhatsAppMediaUrl(messageObj.image.id, config.accessToken);
                if (url) mediaUrls.push({ url, type: 'image' });
              } else if ((msg_type === 'audio' || msg_type === 'voice') && messageObj.audio && messageObj.audio.id) {
                const url = await getWhatsAppMediaUrl(messageObj.audio.id, config.accessToken);
                if (url) mediaUrls.push({ url, type: 'audio' });
              } else if ((msg_type === 'audio' || msg_type === 'voice') && messageObj.voice && messageObj.voice.id) {
                const url = await getWhatsAppMediaUrl(messageObj.voice.id, config.accessToken);
                if (url) mediaUrls.push({ url, type: 'audio' });
              }
            } catch (mediaErr) {
              console.error("Failed to extract WhatsApp media attachments:", mediaErr);
            }

            console.log(`[WhatsApp Webhook] Generating reply with ${mediaUrls.length} media files...`);
            const responseText = await generateIntelligentBotReply(config.userId, msg_body, mediaUrls);

            // 2. Send reply via WhatsApp Business API
            await fetch(`https://graph.facebook.com/v21.0/${phone_number_id}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: responseText }
              })
            });
            console.log(`[WhatsApp Webhook] Sent reply to ${from}`);
          } else {
            console.log(`[WhatsApp Webhook] Config is inactive/expired for ${phone_number_id}`);
          }
        } else {
          console.log(`[WhatsApp Webhook] No active config found for ${phone_number_id}`);
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // --- TIKTOK AUTH & WEBHOOKS ---
  app.get("/api/auth/tiktok/url", async (req, res) => {
    try {
      const db = getDb();
      const tiktokDoc = await db.collection('global_settings').doc('tiktok').get();
      const { tiktokClientKey } = tiktokDoc.exists ? tiktokDoc.data()! : { tiktokClientKey: process.env.TIKTOK_CLIENT_KEY };
      
      if (!tiktokClientKey) {
        return res.status(400).json({ error: "TikTok Client Key not configured in Admin Panel" });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/tiktok/callback`;
      const state = Math.random().toString(36).substring(7);
      
      const url = `https://www.tiktok.com/v2/auth/authorize/?` + new URLSearchParams({
        client_key: tiktokClientKey,
        scope: 'user.info.basic,video.list,video.upload,video.publish',
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state
      }).toString();
      
      res.json({ url });
    } catch (error) {
      console.error("TikTok Auth URL Error:", error);
      res.status(500).json({ error: "Failed to generate TikTok auth URL" });
    }
  });

  app.get("/api/auth/tiktok/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send("Auth Failed: No Code");

    try {
      const db = getDb();
      const tiktokDoc = await db.collection('global_settings').doc('tiktok').get();
      const { tiktokClientKey, tiktokClientSecret } = tiktokDoc.exists ? tiktokDoc.data()! : { 
        tiktokClientKey: process.env.TIKTOK_CLIENT_KEY,
        tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET
      };

      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: tiktokClientKey as string,
          client_secret: tiktokClientSecret as string,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/tiktok/callback`
        })
      });

      const data = await tokenRes.json();
      
      res.send(`
        <script>
          window.opener.postMessage({ type: 'TIKTOK_AUTH_SUCCESS', accessToken: '${data.access_token}', openId: '${data.open_id}' }, '*');
          window.close();
        </script>
      `);
    } catch (error) {
      console.error("TikTok Callback Error:", error);
      res.send("Auth Error");
    }
  });

  app.post("/api/webhook/tiktok", (req, res) => {
    console.log("[TikTok Webhook]", req.body);
    res.sendStatus(200);
  });

  // Public order retrieval endpoint for driver scanning tracking page
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const db = getDb();
      const orderSnap = await db.collection("orders").doc(orderId).get();
      
      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const orderData = orderSnap.data();
      res.json(orderData);
    } catch (error: any) {
      console.error("Fetch Public Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Courier webhook dispatcher endpoint
  app.post("/api/integration/trigger-webhook", async (req, res) => {
    try {
      const { orderId, forceTrigger } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" });
      }

      const db = getDb();
      
      // Load Webhook Configuration
      const settingsSnap = await db.collection("global_settings").doc("api_integration").get();
      if (!settingsSnap.exists) {
        return res.json({ success: false, message: "Webhook is not configured" });
      }

      const config = settingsSnap.data();
      // If we don't force trigger, respect the active status toggle
      if (!forceTrigger && (!config?.webhookActive || !config?.webhookUrl)) {
        return res.json({ success: false, message: "Webhook is disabled or has no URL" });
      }

      // Load Order details
      const orderSnap = await db.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderSnap.data();

      // We trigger the webhook directly when booked/sent to courier, no deliveryManAssigned check needed
      // Dynamic host tracking link
      const host = req.get("host");
      const trackingLink = `${req.protocol}://${host}/tracking/${orderId}`;

      const calculatedTotalBill = (order?.sellPrice !== undefined)
        ? (Number(order.sellPrice) * (Number(order.quantity) || 1)) + (Number(order.deliveryCharge) || 0)
        : (order?.totalBill || order?.totalPrice || order?.price || 0);

      // Construct customer details output payload specified in user guidelines
      const payload = {
        event: "ORDER_BOOKED_COURIER",
        orderId: orderId,
        customerName: order?.customerName || order?.name || "Customer",
        customerPhone: order?.customerPhone || order?.phone || "N/A",
        customerAddress: order?.customerAddress || order?.address || "N/A",
        totalBill: calculatedTotalBill,
        paymentMethod: order?.paymentMethod || "CASH_ON_DELIVERY",
        trackingLink: trackingLink,
        latitude: order?.latitude || null,
        longitude: order?.longitude || null,
        status: order?.status || "Pending",
        deliveryManName: order?.deliveryManName || "",
        deliveryManPhone: order?.deliveryManPhone || "",
        updatedAt: new Date().toISOString()
      };

      console.log(`[Webhook Dispatcher] Sending payload to ${config?.webhookUrl}`);
      
      const fetchResponse = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": config.apiKey ? `Bearer ${config.apiKey}` : ""
        },
        body: JSON.stringify(payload)
      });

      const responseText = await fetchResponse.text();
      console.log(`[Webhook Response] Status: ${fetchResponse.status}, Body: ${responseText}`);

      res.json({
        success: true,
        statusCode: fetchResponse.status,
        response: responseText,
        payloadSent: payload
      });
    } catch (error: any) {
      console.error("Webhook Dispatch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Courier callback Webhook (e.g. Steadfast / Carrybee / general courier integration)
  app.post(["/api/webhook/courier", "/api/webhook/steadfast", "/api/webhook/carrybee"], async (req, res) => {
    try {
      const body = req.body || {};
      console.log("[Courier Webhook Received]:", body);

      // Extract order ID and rider details
      const orderId = body.orderId || body.order_id || body.invoice || body.invoice_id || body.consignment_id;
      const deliveryManPhone = body.deliveryManPhone || body.delivery_man_phone || body.rider_phone || body.rider_mobile || body.deliveryman_phone;
      const deliveryManName = body.deliveryManName || body.delivery_man_name || body.rider_name || body.deliveryman_name || "Rider";

      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId / invoice identifier in payload" });
      }

      const db = getDb();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        return res.status(404).json({ error: `Order with ID ${orderId} not found` });
      }

      const order = orderSnap.data() || {};
      
      // Update delivery man assignment info in database
      const updateData: any = {
        deliveryManPhone: deliveryManPhone || null,
        deliveryManName: deliveryManName || null,
        deliveryManAssigned: !!deliveryManPhone,
        updatedAt: new Date().toISOString()
      };

      // If a delivery man is assigned, update status to "shipping" if currently pending
      if (deliveryManPhone && order.status === "pending") {
        updateData.status = "shipping";
      }

      await orderRef.update(updateData);
      console.log(`[Courier Webhook] Updated Order ${orderId} successfully with rider ${deliveryManPhone}`);

      // Immediately fetch updated order to trigger output webhook
      const updatedSnap = await orderRef.get();
      const updatedOrder = updatedSnap.data() || {};

      // Load merchant configured Webhook settings
      const settingsSnap = await db.collection("global_settings").doc("api_integration").get();
      if (settingsSnap.exists) {
        const config = settingsSnap.data() || {};
        if (config.webhookActive && config.webhookUrl) {
          const host = req.get("host");
          const trackingLink = `${req.protocol}://${host}/tracking/${orderId}`;
          const calculatedTotalBill = (updatedOrder.sellPrice !== undefined)
            ? (Number(updatedOrder.sellPrice) * (Number(updatedOrder.quantity) || 1)) + (Number(updatedOrder.deliveryCharge) || 0)
            : (updatedOrder.totalBill || updatedOrder.totalPrice || updatedOrder.price || 0);

          const payload = {
            event: "ORDER_BOOKED_COURIER",
            orderId: orderId,
            customerName: updatedOrder.customerName || updatedOrder.name || "Customer",
            customerPhone: updatedOrder.customerPhone || updatedOrder.phone || "N/A",
            customerAddress: updatedOrder.customerAddress || updatedOrder.address || "N/A",
            totalBill: calculatedTotalBill,
            paymentMethod: updatedOrder.paymentMethod || "CASH_ON_DELIVERY",
            trackingLink: trackingLink,
            latitude: updatedOrder.latitude || null,
            longitude: updatedOrder.longitude || null,
            status: updatedOrder.status || "shipping",
            deliveryManName: updatedOrder.deliveryManName || "",
            deliveryManPhone: updatedOrder.deliveryManPhone || "",
            updatedAt: new Date().toISOString()
          };

          console.log(`[Courier Webhook -> Dispatching Output Webhook] Sending to ${config.webhookUrl}`);
          fetch(config.webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": config.apiKey ? `Bearer ${config.apiKey}` : ""
            },
            body: JSON.stringify(payload)
          }).then(async r => {
            const txt = await r.text();
            console.log(`[Courier Webhook -> Dispatch Response] Status: ${r.status}, Body: ${txt}`);
          }).catch(err => {
            console.error("[Courier Webhook -> Dispatch Error]:", err);
          });
        }
      }

      return res.json({ 
        success: true, 
        message: "Order rider assignment processed successfully.", 
        orderId, 
        deliveryManPhone 
      });
    } catch (error: any) {
      console.error("[Courier Webhook Error]:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Dynamic Live Tracking simulation & Polling endpoint
  app.post("/api/integration/track-courier", async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" });
      }

      const db = getDb();
      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderSnap.data() || {};
      let currentNote = order.courierNote || "";
      let newNote = "";
      let status = order.status || "shipping";
      let deliveryManName = order.deliveryManName || "";
      let deliveryManPhone = order.deliveryManPhone || "";
      let deliveryManAssigned = !!order.deliveryManAssigned;
      let latitude = order.latitude || null;
      let longitude = order.longitude || null;
      let triggerWebhook = false;

      // Determine the next transition step based on currentNote
      if (!currentNote || currentNote.includes("বুকিং সফল হয়েছে") || currentNote.includes("Assigning rider")) {
        newNote = "কুরিয়ার হাব প্রসেসিং: পার্সেলটি সফলভাবে রিসিভ করা হয়েছে এবং গন্তব্যের হাব-এ প্রেরণের জন্য প্রস্তুত করা হচ্ছে।";
      } else if (currentNote.includes("হাব প্রসেসিং") || currentNote.includes("রিসিভ করা হয়েছে")) {
        newNote = "ট্রান্সিট আপডেট: পার্সেলটি বর্তমানে গন্তব্য জেলার ডেলিভারি হাব-এর উদ্দেশ্যে ট্রান্সিট-এ রয়েছে।";
      } else if (currentNote.includes("ট্রান্সিট আপডেট") || currentNote.includes("ট্রান্সিট-এ রয়েছে")) {
        newNote = "ডেলিভারিম্যান এসাইনমেন্ট: পার্সেলটি কুরিয়ার দ্বারা ডেলিভারিম্যানের নিকট হস্তান্তর করা হয়েছে। সে আজই পার্সেলটি ডেলিভারি করবে।";
        deliveryManName = "Md. Kamal Hossain";
        deliveryManPhone = "01789123456";
        deliveryManAssigned = true;
        latitude = 23.8103; // Dhaka live coordinates center
        longitude = 90.4125;
        triggerWebhook = true; // Trigger output webhook since rider is assigned!
      } else if (currentNote.includes("ডেলিভারিম্যান এসাইনমেন্ট") || currentNote.includes("হস্তান্তর করা হয়েছে")) {
        newNote = "ডেলিভারি সম্পন্ন: কাস্টমার পার্সেলটি সফলভাবে বুঝে নিয়েছেন এবং বিল পরিশোধ করেছেন।";
        status = "delivered";
      } else {
        newNote = "অর্ডার ট্র্যাকিং আপডেট: ডেলিভারি সফলভাবে সম্পন্ন এবং অ্যাকাউন্ট ক্লোজড।";
      }

      const updateData: any = {
        courierNote: newNote,
        status: status,
        deliveryManName: deliveryManName || null,
        deliveryManPhone: deliveryManPhone || null,
        deliveryManAssigned: deliveryManAssigned,
        latitude: latitude,
        longitude: longitude,
        updatedAt: new Date().toISOString()
      };

      await orderRef.update(updateData);
      console.log(`[Track Courier] Updated Order ${orderId} note to "${newNote}"`);

      // Synchronize tracking update to any linked forwarded or original orders
      try {
        if (order.originalOrderId) {
          await db.collection("orders").doc(order.originalOrderId).update(updateData).catch(e => console.warn("Sync original order track error:", e));
        }
        if (order.forwardedOrderId) {
          await db.collection("orders").doc(order.forwardedOrderId).update(updateData).catch(e => console.warn("Sync forwarded order track error:", e));
        }
        const linkedSnap1 = await db.collection("orders").where("forwardedOrderId", "==", orderId).get();
        linkedSnap1.forEach(d => d.ref.update(updateData).catch(e => console.warn("Sync linked tracking snap1 error:", e)));
        const linkedSnap2 = await db.collection("orders").where("originalOrderId", "==", orderId).get();
        linkedSnap2.forEach(d => d.ref.update(updateData).catch(e => console.warn("Sync linked tracking snap2 error:", e)));
      } catch (syncErr) {
        console.warn("Linked order tracking sync error:", syncErr);
      }

      // If rider is assigned, trigger outward webhook
      if (triggerWebhook) {
        // Load Webhook configuration
        const settingsSnap = await db.collection("global_settings").doc("api_integration").get();
        if (settingsSnap.exists) {
          const config = settingsSnap.data() || {};
          if (config.webhookActive && config.webhookUrl) {
            const host = req.get("host");
            const trackingLink = `${req.protocol}://${host}/tracking/${orderId}`;
            const calculatedTotalBill = (order.sellPrice !== undefined)
              ? (Number(order.sellPrice) * (Number(order.quantity) || 1)) + (Number(order.deliveryCharge) || 0)
              : (order.totalBill || order.totalPrice || order.price || 0);

            const payload = {
              event: "ORDER_BOOKED_COURIER",
              orderId: orderId,
              customerName: order.customerName || order.name || "Customer",
              customerPhone: order.customerPhone || order.phone || "N/A",
              customerAddress: order.customerAddress || order.address || "N/A",
              totalBill: calculatedTotalBill,
              paymentMethod: order.paymentMethod || "CASH_ON_DELIVERY",
              trackingLink: trackingLink,
              latitude: latitude,
              longitude: longitude,
              status: status,
              deliveryManName: deliveryManName,
              deliveryManPhone: deliveryManPhone,
              updatedAt: new Date().toISOString()
            };

            console.log(`[Auto-Tracking -> Dispatching Output Webhook] Sending to ${config.webhookUrl}`);
            fetch(config.webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": config.apiKey ? `Bearer ${config.apiKey}` : ""
              },
              body: JSON.stringify(payload)
            }).then(async r => {
              const txt = await r.text();
              console.log(`[Auto-Tracking -> Dispatch Response] Status: ${r.status}, Body: ${txt}`);
            }).catch(err => {
              console.error("[Auto-Tracking -> Webhook Error]:", err);
            });
          }
        }
      }

      return res.json({
        success: true,
        courierNote: newNote,
        status: status,
        deliveryManName: deliveryManName,
        deliveryManPhone: deliveryManPhone,
        deliveryManAssigned: deliveryManAssigned,
        webhookTriggered: triggerWebhook
      });
    } catch (error: any) {
      console.error("[Track Courier Error]:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Bulk Courier Booking Endpoint
  app.post("/api/integration/bulk-courier-booking", async (req, res) => {
    try {
      const { orderIds, courierName, country, userId } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Missing or invalid orderIds array" });
      }
      if (!courierName) {
        return res.status(400).json({ error: "Missing courierName" });
      }

      const db = getDb();
      
      // Load user's saved courier config if any
      const configId = `${userId || 'global'}_${country || 'Bangladesh'}_${courierName}`.replace(/\s+/g, '_');
      const configSnap = await db.collection("courier_configs").doc(configId).get();
      const credentials = configSnap.exists ? configSnap.data()?.credentials : {};

      const results = [];

      for (const orderId of orderIds) {
        try {
          const orderSnap = await db.collection("orders").doc(orderId).get();
          if (!orderSnap.exists) {
            results.push({ orderId, success: false, error: "Order not found" });
            continue;
          }

          const order = orderSnap.data();

          // Generate a realistic, courier-specific tracking ID
          let trackingId = "";
          const prefix = courierName.substring(0, 2).toUpperCase();
          const randNum = Math.floor(100000000 + Math.random() * 900000000);
          
          if (courierName.toLowerCase().includes("steadfast")) {
            trackingId = `SF${randNum}`;
          } else if (courierName.toLowerCase().includes("pathao")) {
            trackingId = `PT${randNum}`;
          } else if (courierName.toLowerCase().includes("redx")) {
            trackingId = `RX${randNum}`;
          } else if (courierName.toLowerCase().includes("paperfly")) {
            trackingId = `PF${randNum}`;
          } else if (courierName.toLowerCase().includes("ecourier")) {
            trackingId = `EC${randNum}`;
          } else if (courierName.toLowerCase().includes("carrybee") || courierName.toLowerCase().includes("carry bee")) {
            trackingId = `CB${randNum}`;
          } else {
            trackingId = `${prefix}${randNum}`;
          }

          // Format order details for courier API simulation
          const customerName = order?.customerName || order?.name || "Customer";
          const customerPhone = order?.customerPhone || order?.phone || "N/A";
          const customerAddress = order?.customerAddress || order?.address || "N/A";
          const totalBill = (order?.sellPrice !== undefined)
            ? (Number(order.sellPrice) * (Number(order.quantity) || 1)) + (Number(order.deliveryCharge) || 0)
            : (order?.totalBill || 0);

          // Use Gemini AI to format the specific payload required by this courier
          const aiTranslationPrompt = `You are a Global E-commerce Logistics API Translator. 
The merchant is booking an order with courier: "${courierName}" in "${country || 'Bangladesh'}".
Credentials provided: ${JSON.stringify(credentials)}

Order Details:
- Order ID: ${orderId}
- Product: ${order?.productName || "Product"}
- Quantity: ${order?.quantity || 1}
- Customer: ${customerName}
- Phone: ${customerPhone}
- Address: ${customerAddress}
- Total Bill: ${totalBill}

Generate the exact HTTP POST request payload (JSON format) and official API Endpoint URL to book this parcel according to "${courierName}" documentation.
Return a strict JSON response with fields:
1. endpoint (The official API endpoint URL, e.g. "https://api.steadfast.com.bd/v1/create_order")
2. headers (Object containing required headers including any Authorization headers constructed from credentials)
3. payload (The formatted JSON body matching the courier's official request format)
4. courierRules (Brief 1-sentence description of this courier's rules/regulations for booking)`;

          let translationResult = { endpoint: "", headers: {}, payload: {}, courierRules: "" };
          try {
            const aiResponse = await generateContentWithRetry({
              model: "gemini-3.5-flash",
              contents: [{ role: "user", parts: [{ text: aiTranslationPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            });
            const textResponse = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            translationResult = JSON.parse(textResponse);
          } catch (aiErr) {
            console.error("Gemini Translation Error, using fallback:", aiErr);
          }

          // Update order in Firestore with courier booking status, courierName, trackingId and initial live note
          const initialNote = `বুকিং সফল হয়েছে: পার্সেলটি সফলভাবে ${courierName}-এ সাবমিট করা হয়েছে এবং পিকআপের জন্য প্রস্তুত।`;
          const updateData: any = {
            status: "shipping",
            courierName: courierName,
            courierTrackingId: trackingId,
            courierNote: initialNote,
            courierBookedAt: new Date().toISOString(),
            courierRules: translationResult.courierRules || "Standard delivery guidelines apply.",
            updatedAt: new Date().toISOString()
          };

          await db.collection("orders").doc(orderId).update(updateData);

          // Synchronize status & courier tracking note to linked forwarded or original order (if this was a forwarded order)
          try {
            if (order?.originalOrderId) {
              await db.collection("orders").doc(order.originalOrderId).update(updateData).catch(e => console.warn("Sync original order booking error:", e));
            }
            if (order?.forwardedOrderId) {
              await db.collection("orders").doc(order.forwardedOrderId).update(updateData).catch(e => console.warn("Sync forwarded order booking error:", e));
            }
            const linkedSnap1 = await db.collection("orders").where("forwardedOrderId", "==", orderId).get();
            linkedSnap1.forEach(d => d.ref.update(updateData).catch(e => console.warn("Sync linked booking snap1 error:", e)));
            const linkedSnap2 = await db.collection("orders").where("originalOrderId", "==", orderId).get();
            linkedSnap2.forEach(d => d.ref.update(updateData).catch(e => console.warn("Sync linked booking snap2 error:", e)));
          } catch (syncErr) {
            console.warn("Linked order booking sync error:", syncErr);
          }

          // Now trigger the outward Webhook dispatcher so any integrated platforms are notified
          const host = req.get("host");
          const trackingLink = `${req.protocol}://${host}/tracking/${orderId}`;
          const webhookPayload = {
            event: "ORDER_BOOKED_COURIER",
            orderId: orderId,
            courierName: courierName,
            courierTrackingId: trackingId,
            customerName,
            customerPhone,
            customerAddress,
            totalBill,
            trackingLink,
            status: "shipping",
            updatedAt: new Date().toISOString()
          };

          // Try to load general webhook integration config to dispatch
          const settingsSnap = await db.collection("global_settings").doc("api_integration").get();
          if (settingsSnap.exists) {
            const config = settingsSnap.data();
            if (config?.webhookActive && config?.webhookUrl) {
              console.log(`[Bulk Booking -> Dispatching Webhook] Sending to ${config.webhookUrl}`);
              fetch(config.webhookUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": config.apiKey ? `Bearer ${config.apiKey}` : ""
                },
                body: JSON.stringify(webhookPayload)
              }).catch(err => console.error("[Bulk Booking -> Webhook Dispatch Error]:", err));
            }
          }

          results.push({
            orderId,
            success: true,
            trackingId,
            courierName,
            customerName,
            apiEndpoint: translationResult.endpoint || "Automated Delivery Sandbox",
            apiPayload: translationResult.payload || {},
            courierRules: translationResult.courierRules || "Auto-routed via DOELpro Gateway."
          });

        } catch (innerErr: any) {
          console.error(`Error booking individual order ${orderId}:`, innerErr);
          results.push({ orderId, success: false, error: innerErr.message });
        }
      }

      res.json({
        success: true,
        message: "Bulk booking processing complete.",
        results
      });

    } catch (error: any) {
      console.error("Bulk Booking Main Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rider search endpoint to find customer's live location by delivery man's phone and customer's phone
  app.get("/api/integration/driver-search", async (req, res) => {
    try {
      const deliveryManPhone = req.query.deliveryManPhone as string;
      const customerPhone = req.query.customerPhone as string;

      if (!deliveryManPhone || !customerPhone) {
        return res.status(400).json({ error: "Required query parameters missing: deliveryManPhone and customerPhone" });
      }

      const db = getDb();
      const ordersSnap = await db.collection("orders")
        .where("deliveryManPhone", "==", deliveryManPhone)
        .get();

      if (ordersSnap.empty) {
        return res.status(404).json({ error: "No orders found assigned to this delivery man" });
      }

      // Look for the specific customer's phone
      let matchedOrder: any = null;
      ordersSnap.forEach(doc => {
        const data = doc.data();
        // Check both raw matching and suffix match for flexibility with country codes
        const ordCustPhone = String(data.customerPhone || "").replace(/\D/g, "");
        const queryCustPhone = String(customerPhone).replace(/\D/g, "");
        
        if (ordCustPhone === queryCustPhone || 
            (ordCustPhone.length >= 11 && queryCustPhone.endsWith(ordCustPhone.slice(-11))) ||
            (queryCustPhone.length >= 11 && ordCustPhone.endsWith(queryCustPhone.slice(-11)))) {
          matchedOrder = { id: doc.id, ...data };
        }
      });

      if (!matchedOrder) {
        return res.status(404).json({ error: "No order matched for this customer phone number under your assignments" });
      }

      const host = req.get("host");
      const trackingLink = `${req.protocol}://${host}/tracking/${matchedOrder.id}`;
      const calculatedTotalBill = (matchedOrder.sellPrice !== undefined)
        ? (Number(matchedOrder.sellPrice) * (Number(matchedOrder.quantity) || 1)) + (Number(matchedOrder.deliveryCharge) || 0)
        : (matchedOrder.totalBill || matchedOrder.totalPrice || matchedOrder.price || 0);

      return res.json({
        success: true,
        orderId: matchedOrder.id,
        customerName: matchedOrder.customerName || "Customer",
        customerPhone: matchedOrder.customerPhone || "N/A",
        customerAddress: matchedOrder.customerAddress || "N/A",
        totalBill: calculatedTotalBill,
        latitude: matchedOrder.latitude || null,
        longitude: matchedOrder.longitude || null,
        status: matchedOrder.status || "Pending",
        trackingLink: trackingLink
      });
    } catch (error: any) {
      console.error("Driver search error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/search-cart", async (req, res) => {
    try {
      const { country } = req.body;
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: [{ 
          role: "user", 
          parts: [{ 
            text: `Generate a localized e-commerce "Order Cart" configuration for ${country}. 
            Identify the most popular payment methods, local currency symbol, and common checkout behavior for this country.
            Return JSON with:
            currencySymbol (e.g. ৳, $, £),
            paymentMethods (array of strings),
            localCartStyle (description of standard cart UI for this region),
            checkoutFields (common fields needed like "District" or "Thana" in BD).`
          }]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });
      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("AI Search Cart Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Create HTTP server wrapping Express
  const server = http.createServer(app);

  // In-memory WebRTC WebSocket Signaling Server for zero-Firestore read/writes during video calls
  const wss = new WebSocketServer({ noServer: true });
  const userSockets = new Map<string, Set<WebSocket>>();

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
    if (pathname === '/ws/signaling') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    let clientUserId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'register') {
          clientUserId = data.userId;
          if (clientUserId) {
            if (!userSockets.has(clientUserId)) {
              userSockets.set(clientUserId, new Set());
            }
            userSockets.get(clientUserId)!.add(ws);
            ws.send(JSON.stringify({ type: 'registered', userId: clientUserId }));
          }
        } else if (data.toUserId) {
          // Direct in-memory signaling routing (offer, answer, candidate, status, resolution, video/mic toggles)
          const targetSockets = userSockets.get(data.toUserId);
          if (targetSockets && targetSockets.size > 0) {
            const payload = JSON.stringify(data);
            targetSockets.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
              }
            });
          }
        }
      } catch (e) {
        console.error("Error handling WebRTC WS signaling message:", e);
      }
    });

    ws.on('close', () => {
      if (clientUserId && userSockets.has(clientUserId)) {
        const sockets = userSockets.get(clientUserId)!;
        sockets.delete(ws);
        if (sockets.size === 0) {
          userSockets.delete(clientUserId);
        }
      }
    });

    ws.on('error', (err) => {
      console.warn("WebSocket client error:", err.message);
    });
  });

  console.log("Vite middleware & WebSocket signaling initialized. Starting listener...");
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} with WebRTC signaling at /ws/signaling`);
  });
}

startServer().catch(err => {
  console.error("Critical Server failure:", err);
  process.exit(1);
});
