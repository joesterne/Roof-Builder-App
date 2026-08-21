import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/weather", async (req, res) => {
    try {
      const { lat, lng } = req.body;
      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Google Maps API Key not configured" });
      }

      const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weather API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ error: error.message || "Failed to fetch weather" });
    }
  });

  app.post("/api/suggest-materials", async (req, res) => {
    try {
      const { conditions, temperatureC } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
      const prompt = `Based on the following local climate data:
      Conditions: ${conditions}
      Temperature: ${temperatureC}°C

      Suggest the most appropriate Soprema roofing materials (Base Ply, Cap Sheet, Insulation, etc.) for these climate conditions. Explain why they are suitable (e.g. cold weather flexibility, high heat resistance, UV protection).
      
      Return as a JSON array of suggestions:
      [{ "category": "...", "material": "...", "reason": "..." }]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                material: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
            },
          },
        },
      });

      const data = JSON.parse(response.text || "[]");
      res.json(data);
    } catch (error: any) {
      console.error("Error suggesting materials:", error);
      res.status(500).json({ error: error.message || "Failed to suggest materials" });
    }
  });

  // AI Definition & Regulations Tool Endpoint
  app.post("/api/analyze-materials", async (req, res) => {
    try {
      const { location, materials } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `
      You are an expert roofing and construction consultant.
      The user is building a roof in "${location}" using the following Soprema materials:
      ${materials.map((m: any) => "- " + m.name + " (" + m.category + ")").join("\n")}

      Please provide:
      1. A brief overview of the selected materials and how they work together as a roofing system.
      2. Any known or typical local building codes, structural requirements, or environmental regulations for roofing in ${location} that might affect the use of these materials (e.g., wind uplift, fire ratings, insulation R-value requirements, cool roof mandates).
      3. A summary of what these specific Soprema materials are made of and their environmental impact.

      Return the result as a JSON object with the following structure:
      {
        "systemOverview": "...",
        "localRegulations": ["...", "..."],
        "materialDefinitions": [
          { "material": "...", "description": "...", "environmentalImpact": "..." }
        ]
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              systemOverview: { type: Type.STRING },
              localRegulations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              materialDefinitions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    material: { type: Type.STRING },
                    description: { type: Type.STRING },
                    environmentalImpact: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error analyzing materials:", error);
      res.status(500).json({ error: error.message || "Failed to analyze materials" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
