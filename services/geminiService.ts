
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
    // We construct a list of store objects by parsing the text
    const stores: Store[] = parseGeminiResponse(text);
    
    return stores;
  } catch (error) {
    console.error("Error fetching stores from Gemini:", error);
    throw new Error("Failed to fetch store data. Please try again.");
  }
};

const parseGeminiResponse = (text: string): Store[] => {
  const stores: Store[] = [];
  
  // Strip all markdown artifacts immediately to prevent formatting issues
  const cleanText = text.replace(/[\*#_]/g, '');
  
  // Split by items that look like "1. Name", "2. Name" etc.
  const storeBlocks = cleanText.split(/\d+\.\s+/).filter(block => block.trim().length > 0);
  
  storeBlocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;

    const name = lines[0].trim();
    
    const findValue = (keywords: string[]) => {
      const line = lines.find(l => keywords.some(k => l.toLowerCase().includes(k)));
      if (!line) return null;
      const parts = line.split(':');
      if (parts.length < 2) return line; // Return full line if no colon
      return parts.slice(1).join(':').trim();
    };

    const address = findValue(['address']) || "Address unknown";
    const closingTime = findValue(['closing', 'time']) || "Check hours";
    const statusText = findValue(['status'])?.toLowerCase() || "";
    
    let status: 'Open' | 'Closed' | 'Closing Soon' = 'Open';
    if (statusText.includes('closed')) {
      status = 'Closed';
    }
    
    // Heuristic for urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (status === 'Open') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // If it's late or the text mentions "soon"
      if (currentHour >= 21 || block.toLowerCase().includes('soon')) urgency = 'high';
      else if (currentHour >= 18) urgency = 'medium';
    }

    // Construct a high-accuracy Google Maps URL using specific name and address
    // This avoids the "wrong store" issue caused by index mismatch in grounding chunks
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;

    if (name && name.length > 2) {
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
