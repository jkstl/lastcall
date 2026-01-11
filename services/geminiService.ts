
import { GoogleGenAI } from "@google/genai";
import { Store, Location } from "../types";

export const fetchNearbyStores = async (location: Location): Promise<Store[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Find the 5 closest liquor stores, beer stores, or wine shops near these coordinates: ${location.latitude}, ${location.longitude}. 
  For each store, provide:
  1. Name
  2. Address
  3. Status (Open or Closed)
  4. Closing Time (Today) in clean H:MM AM/PM format.
  
  IMPORTANT: 
  - Do NOT use markdown like ** or # in your response. 
  - Return each store in a clear, separate block.
  - Ensure the closing time is strictly like "9:00 PM" or "12:00 AM".
  - Use Google Maps data for accuracy.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      },
    });

    const text = response.text || "";
    const stores: Store[] = parseGeminiResponse(text);
    
    return stores;
  } catch (error) {
    console.error("Error fetching stores from Gemini:", error);
    throw new Error("Failed to fetch store data. Please try again.");
  }
};

const parseGeminiResponse = (text: string): Store[] => {
  const stores: Store[] = [];
  
  // Strip all markdown artifacts immediately
  const cleanText = text.replace(/[\*#_]/g, '');
  
  // Split by numbered list pattern
  const storeBlocks = cleanText.split(/\d+\.\s+/).filter(block => block.trim().length > 0);
  
  storeBlocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;

    // Aggressively strip prefixes like "Name:", "Store Name:", etc.
    const rawName = lines[0];
    const name = rawName.replace(/^(Store\s+)?Name:\s*/i, '').trim();
    
    const findValue = (keywords: string[]) => {
      const line = lines.find(l => keywords.some(k => l.toLowerCase().includes(k)));
      if (!line) return null;
      const parts = line.split(':');
      // If there's a label like "Address: 123 Main St", take the part after the colon
      if (parts.length >= 2) {
        return parts.slice(1).join(':').trim();
      }
      // Otherwise, try to strip the label from the start of the string if it matches
      let value = line;
      keywords.forEach(k => {
        const regex = new RegExp(`^${k}:?\\s*`, 'i');
        value = value.replace(regex, '');
      });
      return value.trim();
    };

    const address = findValue(['address']) || "Address unknown";
    const closingTime = findValue(['closing', 'time']) || "Check hours";
    const statusText = findValue(['status'])?.toLowerCase() || "";
    
    let status: 'Open' | 'Closed' | 'Closing Soon' = 'Open';
    if (statusText.includes('closed')) {
      status = 'Closed';
    }
    
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (status === 'Open') {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 21 || block.toLowerCase().includes('soon')) urgency = 'high';
      else if (currentHour >= 18) urgency = 'medium';
    }

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;

    if (name && name.length > 1) {
      stores.push({
        id: `store-${index}-${Date.now()}`,
        name,
        address,
        status,
        closingTime,
        mapUrl,
        urgency,
      });
    }
  });

  return stores;
};
