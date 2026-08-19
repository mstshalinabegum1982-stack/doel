import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

// Conceptual Automation Service ("Magic File")
// This service handles integration with multiple messaging platforms
// using Gemini to generate intelligent responses based on Inventory data.

export enum MessagingPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
  WECHAT = 'wechat',
  VIBER = 'viber',
  LINE = 'line',
  TIKTOK = 'tiktok'
}

interface IncomingMessage {
  platform: MessagingPlatform;
  senderId: string;
  text: string;
  metadata?: any;
}

interface InventoryProduct {
  id: string;
  name: string;
  sellPrice: number;
  stock: number;
  details?: string;
}

export const AutomationService = {
  /**
   * Main entry point for incoming messages from ANY platform.
   * "Magic" happens here: Gemini analyzes the message and inventory to reply.
   */
  handleIncomingMessage: async (userId: string, data: IncomingMessage) => {
    console.log(`[Automation] Processing ${data.platform} message from ${userId}`);
    
    // 1. Find relevant product in inventory if keywords match
    const inventoryRef = collection(db, 'inventory');
    // We could do a keyword search, but let's assume we fetch all products enabled for automation
    const q = query(
      inventoryRef, 
      where('userId', '==', userId), 
      where(`${data.platform === 'facebook' ? 'automationEnabled' : 
              data.platform === 'instagram' ? 'igAutomationEnabled' : 
              data.platform === 'telegram' ? 'tgAutomationEnabled' : 
              data.platform === 'wechat' ? 'wechatAutomationEnabled' :
              data.platform === 'viber' ? 'viberAutomationEnabled' :
              data.platform === 'line' ? 'lineAutomationEnabled' :
              data.platform === 'tiktok' ? 'tiktokAutomationEnabled' :
              'automationEnabled'}`, '==', true)
    );
    
    const snap = await getDocs(q);
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryProduct));

    if (products.length === 0) {
      console.log("[Automation] No active products for this platform found.");
      return null;
    }

    // 2. Use Gemini to decide which product is mentioned and generate a response
    const context = products.map(p => 
      `Product: ${p.name}, Price: ${p.sellPrice}, Stock: ${p.stock}, Details: ${p.details || 'N/A'}`
    ).join('\n');

    const prompt = `
      You are DOEL messenger, an intelligent Sales Assistant for an e-commerce business powered by DOELpro.
      User is messaging on ${data.platform}.
      User Message: "${data.text}"
      
      Available Inventory:
      ${context}
      
      Rules:
      - You identify as DOEL messenger.
      - If the user asks for price, info, or availability of a specific product, provide it.
      - Be polite, professional, and helpful.
      - Keep responses concise.
      - If NO product matches, ask how you can help.
      - Respond in the language used by the user (Bangla/English).
    `;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt
        })
      });

      if (!response.ok) {
        let errMsg = `API error with status ${response.status}`;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } else {
          const txt = await response.text();
          if (txt.includes("503") || txt.includes("UNAVAILABLE") || txt.includes("high demand")) {
            errMsg = "DOELpro AI is currently overloaded. Please try again later.";
          }
        }
        throw new Error(errMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server.");
      }

      const data = await response.json();
      if (data && data.error) {
        throw new Error(data.error);
      }

      const responseText = data.text || '';
      
      // 3. Dispatch reply to the specific platform API
      await AutomationService.dispatchReply(data, responseText);
      
      return responseText;
    } catch (e: any) {
      console.error("[Automation Error]", e);
      return null;
    }
  },

  /**
   * Conceptual wrappers for real-world APIs.
   * These would be replaced with actual fetch/axios calls to official SDKs.
   */
  dispatchReply: async (originalMsg: IncomingMessage, responseText: string) => {
    console.log(`[Integration] Sending to ${originalMsg.platform}: ${responseText}`);
    
    switch (originalMsg.platform) {
      case MessagingPlatform.FACEBOOK:
        return AutomationService.sendToFacebook(originalMsg.senderId, responseText);
      case MessagingPlatform.INSTAGRAM:
        return AutomationService.sendToInstagram(originalMsg.senderId, responseText);
      case MessagingPlatform.TELEGRAM:
        return AutomationService.sendToTelegram(originalMsg.senderId, responseText);
      case MessagingPlatform.WECHAT:
        return AutomationService.sendToWeChat(originalMsg.senderId, responseText);
      case MessagingPlatform.VIBER:
        return AutomationService.sendToViber(originalMsg.senderId, responseText);
      case MessagingPlatform.LINE:
        return AutomationService.sendToLine(originalMsg.senderId, responseText);
      case MessagingPlatform.TIKTOK:
        return AutomationService.sendToTikTok(originalMsg.senderId, responseText);
      case MessagingPlatform.WHATSAPP:
        return AutomationService.sendToWhatsApp(originalMsg.senderId, responseText);
      default:
        console.log("No specific dispatcher for platform");
    }
  },

  // Mock API Callers
  sendToFacebook: async (id: string, text: string) => {
    console.log("Mock FB API call...");
    // await fetch(`https://graph.facebook.com/v12.0/me/messages?access_token=${TOKEN}`, { ... })
  },

  sendToInstagram: async (id: string, text: string) => {
    console.log("Mock IG API call...");
    // IG use same Graph API as FB
  },

  sendToTelegram: async (id: string, text: string) => {
    console.log("Mock Telegram API call...");
    // await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { ... })
  },

  sendToWhatsApp: async (to: string, text: string) => {
    console.log(`[WhatsApp] Sending message to ${to}`);
    const token = (import.meta as any).env.VITE_WHATSAPP_TOKEN;
    const phoneNumberId = (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.error("[WhatsApp] Missing API token or Phone Number ID");
      return;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: text }
        })
      });

      const result = await response.json();
      console.log("[WhatsApp] Send Response:", result);
    } catch (e) {
      console.error("[WhatsApp Send Error]", e);
    }
  },

  sendToWeChat: async (id: string, text: string) => { console.log("Mock WeChat integration..."); },
  sendToViber: async (id: string, text: string) => { console.log("Mock Viber integration..."); },
  sendToLine: async (id: string, text: string) => { console.log("Mock Line integration..."); },
  sendToTikTok: async (id: string, text: string) => { console.log("Mock TikTok integration..."); }
};
