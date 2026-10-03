import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !apiKey.trim()) {
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

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // maximum 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many search requests. Maximum 10 requests per minute allowed." },
});

async function handleWebSearch(req: express.Request, res: express.Response) {
  const rawQuery =
    typeof req.body?.query === "string"
      ? req.body.query
      : typeof req.query?.q === "string"
      ? req.query.q
      : "";

  if (!rawQuery || !rawQuery.trim()) {
    return res.status(400).json({ error: "Search query is required." });
  }

  const trimmedQuery = rawQuery.trim();

  if (trimmedQuery.length > 200) {
    return res.status(400).json({ error: "Search query must not exceed 200 characters." });
  }

  try {
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({ error: "Search is unavailable right now" });
    }

    // Execute Gemini model with Google Search Grounding using valid Gemini Flash model
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a search for the following topic and provide an accurate, high-quality summary based on Google Search results: "${trimmedQuery}". Include key facts, recent context, and relevant details.`,
      config: {
        systemInstruction:
          "You are a real-time web search engine assistant powered by Google Search data. Summarize the search findings concisely with clear bullet points, accurate facts, and structured paragraphs. Do not mention that you are an AI model; present the search information directly and cleanly.",
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(503).json({ error: "Search is unavailable right now" });
    }

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
          snippet: chunk.web.title ? `Google web result for ${chunk.web.title}` : undefined,
        });
      }
    }

    return res.json({
      query: trimmedQuery,
      summary: text,
      sources,
      searchQueries: webSearchQueries,
      grounded: true,
    });
  } catch (err: any) {
    console.error("Error executing Google web search:", err);
    return res.status(503).json({ error: "Search is unavailable right now" });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Google Search Grounding for Web Search (supports both POST and GET with rate limiting)
  app.post("/api/search/web", searchRateLimiter, handleWebSearch);
  app.get("/api/search/web", searchRateLimiter, handleWebSearch);

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
