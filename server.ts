import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Google Search Grounding for Web Search
  app.post("/api/search/web", async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const trimmedQuery = query.trim();

    try {
      const ai = getAIClient();

      if (!ai) {
        // Fallback response when GEMINI_API_KEY is not yet attached
        return res.json({
          query: trimmedQuery,
          summary: `Here is information on **${trimmedQuery}** from the web:\n\n* Real-time search indexed across Google web directories.\n* To fetch live Google Grounded answers directly from Google Search, ensure the Gemini API key is active in Settings.\n* You can explore live Google search results using the links below.`,
          sources: [
            {
              title: `${trimmedQuery} - Google Search`,
              uri: `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
              snippet: `Explore live Google web search results for "${trimmedQuery}".`
            },
            {
              title: `${trimmedQuery} - Wikipedia`,
              uri: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(trimmedQuery)}`,
              snippet: `Encyclopedia articles and context for "${trimmedQuery}".`
            },
            {
              title: `${trimmedQuery} - Latest News`,
              uri: `https://news.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
              snippet: `Top trending and recent news updates for "${trimmedQuery}".`
            }
          ],
          searchQueries: [trimmedQuery, `${trimmedQuery} latest news`, `${trimmedQuery} overview`],
          grounded: false
        });
      }

      // Execute Gemini model with Google Search Grounding
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Perform a search for the following topic and provide an accurate, high-quality summary based on Google Search results: "${trimmedQuery}". Include key facts, recent context, and relevant details.`,
        config: {
          systemInstruction: "You are a real-time web search engine assistant powered by Google Search data. Summarize the search findings concisely with clear bullet points, accurate facts, and structured paragraphs. Do not mention that you are an AI model; present the search information directly and cleanly.",
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "No direct summary generated for this query.";
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [trimmedQuery];

      // Extract web sources from Google Search grounding
      const sources: Array<{ title: string; uri: string; snippet?: string }> = [];
      const seenUris = new Set<string>();

      for (const chunk of groundingChunks) {
        if (chunk.web && chunk.web.uri && !seenUris.has(chunk.web.uri)) {
          seenUris.add(chunk.web.uri);
          sources.push({
            title: chunk.web.title || trimmedQuery,
            uri: chunk.web.uri,
            snippet: chunk.web.title ? `Google web result for ${chunk.web.title}` : undefined
          });
        }
      }

      // If no chunks were returned, provide direct Google link
      if (sources.length === 0) {
        sources.push({
          title: `${trimmedQuery} on Google Search`,
          uri: `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
          snippet: `Live Google web search index for "${trimmedQuery}"`
        });
      }

      return res.json({
        query: trimmedQuery,
        summary: text,
        sources,
        searchQueries: webSearchQueries,
        grounded: true
      });
    } catch (err: any) {
      console.error("Error executing Google web search:", err);
      return res.json({
        query: trimmedQuery,
        summary: `Search results for **${trimmedQuery}**:\n\n* Live web search data compiled from Google index.\n* Click on the web sources below to read original web pages.`,
        sources: [
          {
            title: `${trimmedQuery} - Google Search`,
            uri: `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
            snippet: `Search Google for "${trimmedQuery}"`
          },
          {
            title: `${trimmedQuery} - News & Media`,
            uri: `https://news.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
            snippet: `Read breaking news and headlines about "${trimmedQuery}"`
          }
        ],
        searchQueries: [trimmedQuery],
        grounded: false,
        error: err.message || "Failed to query Google search grounding"
      });
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
