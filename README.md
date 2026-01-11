# 🥃 Last Call: Liquor Store Tracker

**Last Call** is a high-utility, real-time dashboard designed for those moments when you need to find the nearest spirits before the doors lock. Built with React and powered by the **Google Gemini API** with **Google Maps grounding**, it provides instant, accurate data on store locations and closing times without the need to manually skim through search results.

## ✨ Features

- **📍 Intelligent Geolocation**: Automatically detects your coordinates to scan the immediate area for liquor, beer, and wine shops.
- **🕒 Live Closing Alerts**: Real-time closing status fetched via AI-powered Maps grounding, ensuring data accuracy beyond static listings.
- **⚖️ Smart Filtering**: Intelligently prioritizes open stores. Closed stores are gracefully greyed out to reduce cognitive load, unless everything in the area is shut down.
- **🚨 Urgency Indicators**: Visual pulse animations and "High Urgency" banners for stores closing very soon, helping you make a move fast.
- **🗺️ Direct Navigation**: Optimized Google Maps deep-linking for one-tap navigation.
- **🎨 Minimalist UI**: A premium dark-mode aesthetic built with Tailwind CSS, focused on high-contrast readability and speed.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`)
- **Tools**: Google Maps Grounding Tool
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: Optimized for low-latency frontend environments

## 🚀 Getting Started

### Prerequisites

- A modern browser with Geolocation permissions allowed.
- A valid Google Gemini API Key (configured via `process.env.API_KEY`).

### Core Logic

The application leverages the `googleMaps` tool within the Gemini 2.5 series models. It passes the user's lat/long coordinates directly to the model's `toolConfig` to retrieve the most up-to-date regional data.

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    tools: [{ googleMaps: {} }],
    toolConfig: {
      retrievalConfig: {
        latLng: { latitude, longitude }
      }
    }
  },
});
```

## 📂 Project Structure

- `App.tsx`: The heart of the app, managing geolocation, state, and the responsive layout.
- `services/geminiService.ts`: Handles communication with the GenAI SDK and parses grounding results into structured data.
- `components/StoreCard.tsx`: A highly polished UI component representing individual shop entries with dynamic status styling.
- `types.ts`: Centralized TypeScript definitions for consistent data handling.
- `metadata.json`: Defines browser permissions (camera/mic/geolocation) and project manifest.

## 🛡 License

This project is licensed under the MIT License.

---

*Please drink responsibly and follow local alcohol sales regulations.*