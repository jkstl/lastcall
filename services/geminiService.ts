
import { GoogleGenAI } from "@google/genai";
import { Store, Location } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchNearbyStores = async (location: Location): Promise<Store[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Find the 5 closest liquor stores, beer stores, or wine shops near these coordinates: ${location.latitude}, ${location.longitude}. 
  For each store, I need:
  1. Store Name
  2. Full Address
  3. Current Status (Open or Closed)
  4. Exact Closing Time for today (e.g., 9:00 PM)
  5. Distance from coordinates if available.
  
  Format the results as a clear list. Ensure you use the latest data from Google Maps.`;

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
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Parse the text response into structured objects
    // Since we can't use responseSchema with googleMaps, we parse the LLM's text output
    const stores: Store[] = parseGeminiResponse(text, chunks);
    
    return stores;
  } catch (error) {
    console.error("Error fetching stores from Gemini:", error);
    throw new Error("Failed to fetch store data. Please try again.");
  }
};

const parseGeminiResponse = (text: string, chunks: any[]): Store[] => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const stores: Store[] = [];
  
  // Basic heuristic parsing for the markdown/text response
  // We'll also use the grounding chunks to get URLs
  
  // Let's try to extract items that look like store entries
  // In a real app, we might use a more robust regex or secondary AI pass for structured JSON
  // but for this implementation, we'll parse common patterns
  
  const storeBlocks = text.split(/\d\.\s+/).slice(1);
  
  storeBlocks.forEach((block, index) => {
    const lines = block.split('\n');
    const name = lines[0].replace(/\*\*/g, '').trim();
    const address = lines.find(l => l.toLowerCase().includes('address'))?.split(':')[1]?.trim() || "Address not found";
    const closingTime = lines.find(l => l.toLowerCase().includes('closing'))?.split(':')[1]?.trim() || "Check hours";
    const statusText = lines.find(l => l.toLowerCase().includes('status'))?.toLowerCase() || "";
    
    let status: 'Open' | 'Closed' | 'Closing Soon' = 'Open';
    if (statusText.includes('closed')) status = 'Closed';
    
    // Calculate urgency based on keywords or current time (simplified)
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (status === 'Open' && (closingTime.toLowerCase().includes('pm') || closingTime.toLowerCase().includes('am'))) {
       // Logic to check if closing is within 1 hour would go here
       // For demo, if it mentions "PM" and current time is evening, mark as medium/high
       const now = new Date();
       if (now.getHours() >= 20) urgency = 'high';
       else if (now.getHours() >= 17) urgency = 'medium';
    }

    // Try to find a matching grounding URL
    const mapUrl = chunks[index]?.maps?.uri || `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + address)}`;

    if (name) {
      stores.push({
        id: `store-${index}`,
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
