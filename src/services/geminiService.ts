// No longer needed in browser
// import { GoogleGenAI, Type } from "@google/genai";
// const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

// Function to sanitize reference code before sending to AI for security
function sanitizeReferenceCode(code: string): string {
  if (!code) return "";
  // Deep clean: Remove all script tags and their contents
  let sanitized = code.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "<!-- Script Filtered for System Security -->");
  // Remove all inline event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gmi, ' ');
  sanitized = sanitized.replace(/\son\w+='[^']*'/gmi, ' ');
  // Remove iframe and object tags to prevent embedding attacks
  sanitized = sanitized.replace(/<(iframe|object|embed|form|meta|link)\b[^>]*>([\s\S]*?)<\/\1>/gmi, "<!-- Tag Removed -->");
  // Limit length to prevent token flooding
  return sanitized.substring(0, 5000);
}

export interface ProWebsiteConfig {
  brandName: string;
  header: {
    nav: { label: string; link: string }[];
  };
  hero: {
    title: string;
    subtitle: string;
    coverImage: string;
    ctaText: string;
  };
  categories: { id: string; name: string }[];
  catalog: {
    id: string;
    name: string;
    price: number;
    comparePrice?: number;
    image: string;
    categoryId: string;
  }[];
  footer: {
    about: string;
    whatsapp: string;
  };
}

export async function generateProWebsite(userInput: {
  brandName: string;
  niche: string;
  inventory?: { name: string; price: number; image: string }[];
  whatsapp: string;
}): Promise<ProWebsiteConfig> {
  const response = await fetch('/api/ai/generate-pro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userInput)
  });

  if (!response.ok) {
    let errMsg = `AI Generation failed (${response.status})`;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } else {
      const txt = await response.text();
      if (txt.includes("503") || txt.includes("UNAVAILABLE") || txt.includes("high demand")) {
        errMsg = "AI is currently experiencing high demand. Please wait a moment and try again.";
      }
    }
    throw new Error(errMsg);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response from server during AI Generation.");
  }

  const data = await response.json();
  if (data && data.error) {
    throw new Error(data.error);
  }
  return data;
}
