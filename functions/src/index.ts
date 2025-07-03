import * as functions from "firebase-functions";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import cors from "cors";
import { Response } from "express";
import axios from "axios";

// Initialize CORS middleware.
const corsHandler = cors({ origin: true });

// Access your Gemini API Key from the environment configuration
const GEMINI_API_KEY = functions.config().gemini?.key;

if (!GEMINI_API_KEY) {
  console.error(
    "CRITICAL: Gemini API Key (gemini.key) is not configured in Firebase Functions environment. " +
    "Run 'firebase functions:config:set gemini.key=\"YOUR_KEY\"' and redeploy."
  );
}

// It's important to pass the apiKey in an object like {apiKey: GEMINI_API_KEY}
// Passing GEMINI_API_KEY directly as a string will cause an error.
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";

const handleApiError = (response: Response, error: unknown, functionName: string) => {
  console.error(`Error in ${functionName}:`, error);
  let errorMessage = "An unexpected error occurred with the AI service.";
  let statusCode = 500;

  // Check for Gemini-specific error structure or general HTTP status codes
  const errorDetails = (error as Record<string, unknown>).error || error; // Gemini errors might be nested
  const httpStatusCode = (errorDetails as Record<string, unknown>)?.httpStatusCode || (error as Record<string, unknown>).status || (error as Record<string, unknown>).code;

  if ((errorDetails as Record<string, unknown>).message) {
    errorMessage = (errorDetails as Record<string, unknown>).message as string;
  }
  
  if (httpStatusCode === 429 || ((errorDetails as Record<string, unknown>).message && ((errorDetails as Record<string, unknown>).message as string).includes("429"))) {
      errorMessage = "AI service is currently busy (rate limited). Please try again shortly.";
      statusCode = 429;
  } else if ((errorDetails as Record<string, unknown>).message && ((errorDetails as Record<string, unknown>).message as string).toLowerCase().includes("api key not valid")) {
      errorMessage = "AI service authentication failed. This is likely a server-side configuration issue.";
      statusCode = 503; // Service Unavailable due to config
  } else if (statusCode === 500 && (errorDetails as Record<string, unknown>).message) {
    errorMessage = `AI Service Error: ${(errorDetails as Record<string, unknown>).message}`;
  }


  response.status(statusCode).send({ message: errorMessage, errorDetails: error.toString() });
};

const checkApiKeyAndMethod = (
    req: functions.https.Request,
    res: Response,
    method: "POST" | "GET" = "POST"
): boolean => {
    if (method === "POST" && !GEMINI_API_KEY) { // Only check for Gemini key on AI-related POSTs
        console.error("Gemini API Key is not configured. Function cannot proceed.");
        res.status(503).send({ message: "AI service is not configured (API key missing). Please contact support." });
        return false;
    }
    if (req.method !== method) {
        res.status(405).send({ message: `Only ${method} requests are allowed.` });
        return false;
    }
    return true;
};

// --- FOREX FACTORY NEWS PROXY ---
const FF_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
let newsCache: { data: Record<string, unknown> | null, timestamp: number } = { data: null, timestamp: 0 };
const NEWS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const forexFactoryNews = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        if (!checkApiKeyAndMethod(request, response, "GET")) {
            return;
        }

        const now = Date.now();
        if (newsCache.data && (now - newsCache.timestamp < NEWS_CACHE_DURATION_MS)) {
            console.log("Returning cached news data.");
            response.status(200).send(newsCache.data);
            return;
        }

        try {
            console.log(`Proxying request to Forex Factory: ${FF_CALENDAR_URL}`);
            const ffResponse = await axios.get(FF_CALENDAR_URL, {
                headers: { "User-Agent": "ForexTradingCompanion-Proxy/1.0 (axios)" },
                timeout: 10000, // 10 seconds
            });

            newsCache = { data: ffResponse.data, timestamp: now };

            // Forward the data from Forex Factory
            response.status(200).send(ffResponse.data);
        } catch (error: unknown) {
            console.error("Error fetching from Forex Factory:", (error as Error).message);
            if (axios.isAxiosError(error) && error.response) {
                // Forward the status and data from the error response if available
                response.status(error.response.status).send(error.response.data);
            } else {
                // General server error
                response.status(500).send({ message: "Failed to fetch news from the external provider." });
            }
        }
    });
});


// --- SENTIMENT ANALYSIS ---
export const sentiment = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;
    
    (async () => {
      try {
        const { journalText } = request.body;
        if (!journalText) {
          response.status(400).send({ message: "Missing 'journalText' in request body." });
          return;
        }

        const prompt = `Analyze the sentiment of the following journal entry: \"${journalText}\". Classify it strictly as one of: 'Low Emotion', 'Neutral Emotion', or 'High Emotion'. Return only the classification string.`;
        
        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { temperature: 0.2, topK:10 }
        });
        
        const textResponse = (genAIResponse.text ?? "").trim();
        let emotionTag: 'Low Emotion' | 'Neutral Emotion' | 'High Emotion' | 'Unknown' = 'Unknown';

        if (textResponse.includes('Low Emotion')) emotionTag = 'Low Emotion';
        else if (textResponse.includes('Neutral Emotion')) emotionTag = 'Neutral Emotion';
        else if (textResponse.includes('High Emotion')) emotionTag = 'High Emotion';
        
        console.log(`Sentiment analysis raw response: \"${textResponse}\", Tag: \"${emotionTag}\"`);
        response.status(200).send({ emotionTag });
        return;
      } catch (error) {
        handleApiError(response, error, "sentiment function");
        return;
      }
    })();
  });
});

// --- CHAT ASSISTANT ---
export const chat = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) {
      return;
    }

    try {
      const { userMessage, history } = request.body;
      if (!userMessage) {
        response.status(400).send({ message: "Missing 'userMessage' in request body." });
        return;
      }

      const contents = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: { role: 'user' | 'assistant'; text: string }) => {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user', // Ensure correct role mapping
            parts: [{ text: msg.text }],
          });
        });
      }
      contents.push({ role: "user", parts: [{ text: userMessage }] });
      
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: contents,
        config: { temperature: 0.7 } // Suitable temperature for chat
      });

      const responseText = (genAIResponse.text ?? "").trim();
      response.status(200).send({ responseText });
      return;
    } catch (error) {
      handleApiError(response, error, "chat function");
      return;
    }
  });
});

interface Signal {
  id: string;
  title: string;
  description: string;
  pair: string;
  confidence: "High" | "Medium" | "Low";
  keyLevels?: string;
  chartPattern?: string;
  confirmationSignals?: string;
  supportingIndicators?: string;
}

// --- AI SIGNAL RECOMMENDATIONS ---
export const signals = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;

    try {
      const { marketContext } = request.body;
      if (!marketContext) {
        response.status(400).send({ message: "Missing 'marketContext'."});
        return;
      }

      const prompt = `Given the market context: \"${marketContext}\", generate 3-5 potential forex trading signals. For each signal, provide:
        - id (string, unique, e.g., "eurusd-long-timestamp")
        - title (string, e.g., "EUR/USD Bullish Engulfing on H4")
        - description (string, detailed reasoning)
        - pair (string, e.g., "EUR/USD")
        - confidence (string, "High", "Medium", or "Low")
        - keyLevels (string, optional, e.g., "Support at 1.0800, Resistance at 1.0900")
        - chartPattern (string, optional, e.g., "Bullish Engulfing, Double Bottom")
        - confirmationSignals (string, optional, e.g., "RSI divergence, MACD crossover")
        - supportingIndicators (string, optional, e.g., "MA alignment, Volume increase")
        Return as a JSON object with a "signals" array: {"signals": [{"id": ..., "title": ...,}, ...]} `;

      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { responseMimeType: "application/json", temperature: 0.5 }
      });
      
      let jsonStr = (genAIResponse.text ?? "").trim();
      const fenceRegex = /^```(?:\w+)?\s*\n?([\s\S]*?)\n?```$/;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && Array.isArray(parsedData.signals)) {
            parsedData.signals = parsedData.signals.map((s: Partial<Signal>, i: number) => ({
                ...s,
                id: s.id || `sig-${(s.pair || 'unknown').replace(/[^a-zA-Z0-9]/g, "")}-${Date.now() + i}`
            }));
            response.status(200).send(parsedData);
            return;
        }
        console.warn("Signals JSON from AI was not in expected format:", parsedData);
        response.status(200).send({ signals: [] }); 
        return;
      } catch(error) {
          console.error("Failed to parse signals JSON from AI:", error, "Raw Text:", jsonStr);
          response.status(500).send({ message: "AI generated invalid signal data format.", details: jsonStr });
          return;
      }

    } catch (error) {
      handleApiError(response, error, "signals function");
      return;
    }
  });
});

// --- AI STRATEGY GENERATION ---
export const strategyIdea = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) {
      return;
    }

    try {
      const { tradingStyle, newsContext } = request.body; 
      if (!tradingStyle) return response.status(400).send({ message: "Missing 'tradingStyle'."});

      const prompt = `Generate a forex trading strategy idea for a '${tradingStyle}' style.\n        News Context: \"${newsContext || 'No specific news provided, assume general market conditions.'}\"\n        Provide:\n        - strategyName (string)\n        - description (string, brief overview)\n        - entryConditions (string, clear rules)\n        - exitConditions (string, clear rules for SL and TP)\n        - coreLogic (string, the underlying rationale)\n        - recommendedPairs (string, comma-separated e.g., "EUR/USD, GBP/JPY")\n        - timeframes (string, e.g., "M15, H1, H4")\n        Return as a JSON object with a "strategyIdea" key: {"strategyIdea": {"strategyName": ..., etc.}}`;
      
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { responseMimeType: "application/json", temperature: 0.6 }
      });

      let jsonStr = (genAIResponse.text ?? "").trim();
      const fenceRegex = /^`{3}(\w*)?\s*\n?([\s\S]*?)\n?\s*`{3}$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && parsedData.strategyIdea && parsedData.strategyIdea.strategyName) {
           parsedData.strategyIdea.id = `strat-${parsedData.strategyIdea.strategyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        }
        return response.status(200).send(parsedData);
      } catch (e) {
        console.error("Failed to parse strategy idea JSON from AI:", e, "Raw text:", jsonStr);
        return response.status(500).send({ message: "AI generated invalid strategy data format.", details: jsonStr });
      }

    } catch (error) {
      handleApiError(response, error, "strategyIdea function");
      return;
    }
  });
});

// --- AI MARKET COMMENTARY ---
export const marketCommentary = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;

    try {
      const { newsContext } = request.body;

      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{
          role: "user",
          parts: [{
            text: `Provide a brief (2-3 sentences) overall forex market commentary considering this news context: \"${newsContext || "General market conditions"}\". Focus on current sentiment, potential drivers, and major pair outlooks. Return as a JSON object: {"commentary": {"commentaryText": "Your commentary here"}}`
          }]
        }],
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });

      let jsonStr = (genAIResponse.text ?? "").trim();
      const fenceRegex = /^`{3}(\w*)?\s*\n?([\s\S]*?)\n?\s*`{3}$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && parsedData.commentary && parsedData.commentary.commentaryText) {
          return response.status(200).send(parsedData);
        }
        console.warn("Market commentary from AI was not in expected format:", parsedData);
        return response.status(200).send({ commentary: { commentaryText: "No specific commentary available at this moment." } });

      } catch (e) {
        console.error("Failed to parse market commentary JSON from AI:", e, "Raw text:", jsonStr);
        return response.status(500).send({ message: "AI generated invalid commentary data format.", details: jsonStr });
      }

    } catch (error) {
      handleApiError(response, error, "marketCommentary function");
      return;
    }
  });
});

// --- AI JOURNAL REVIEW ---
export const journalReview = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;

    try {
        const { entriesText, periodDescription } = request.body; 
        if (!entriesText || !periodDescription) {
          response.status(400).send({ message: "Missing 'entriesText' or 'periodDescription'."});
          return;
        }

        const prompt = `Review the following forex trading journal entries for the period '${periodDescription}'. Provide constructive feedback on patterns, mindset, strategy application, and areas for improvement. Be concise and actionable. Entries:\n        \n        ${entriesText}\n        \n        Return as a JSON object: {"reviewText": "Your review here"}`;
        
        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: { responseMimeType: "application/json", temperature: 0.5 }
        });
        
        let jsonStr = (genAIResponse.text ?? "").trim();
        const fenceRegex = /^`{3}(\w*)?\s*\n?([\s\S]*?)\n?\s*`{3}$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        interface Review { reviewText: string; }
        try {
            const parsedData: Review = JSON.parse(jsonStr);
            if (parsedData && parsedData.reviewText) {
                 response.status(200).send(parsedData);
                 return;
            }
            console.warn("Journal review from AI was not in expected format:", parsedData);
            response.status(200).send({ reviewText: "Could not generate a review at this time." });
            return;
        } catch (e) {
            console.error("Failed to parse journal review JSON from AI:", e, "Raw text:", jsonStr);
            response.status(500).send({ message: "AI generated invalid review data format.", details: jsonStr });
            return;
        }

    } catch (error) {
      handleApiError(response, error, "journalReview function");
      return;
    }
  });
});

// --- AI WATCHLIST SYMBOL SENTIMENT ---
export const symbolSentiment = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;

    try {
        const { symbol } = request.body; 
        if (!symbol) {
            response.status(400).send({ message: "Missing 'symbol'."});
            return;
        }

        const prompt = `What is the current market sentiment for the forex symbol ${symbol}? Consider recent price action, news, and general technical outlook. Classify strictly as 'Bullish', 'Bearish', or 'Neutral'. Return as a JSON object: {"sentiment": "Your classification"}`;
        
        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });

        let jsonStr = (genAIResponse.text ?? "").trim();
        const fenceRegex = /^`{3}(\w*)?\s*\n?([\s\S]*?)\n?\s*`{3}$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr);
            if (parsedData && parsedData.sentiment && ['Bullish', 'Bearish', 'Neutral'].includes(parsedData.sentiment)) {
                response.status(200).send(parsedData);
                return;
            }
            console.warn("Symbol sentiment from AI was not in expected format:", parsedData);
            response.status(200).send({ sentiment: "N/A" });
            return;
        } catch (e) {
            console.error("Failed to parse symbol sentiment JSON from AI:", e, "Raw text:", jsonStr);
            response.status(500).send({ message: "AI generated invalid sentiment data format.", details: jsonStr });
            return;
        }

    } catch (error) {
      handleApiError(response, error, "symbolSentiment function");
      return;
    }
  });
});

// --- AI-POWERED BACKTESTING ANALYSIS ---
export const backtestAnalysis = functions.https.onRequest((request: functions.https.Request, response: Response) => {
  corsHandler(request, response, async () => {
    if (!checkApiKeyAndMethod(request, response, "POST")) return;

    try {
        const { backtestResults, strategyDescription }: { backtestResults: Record<string, unknown>, strategyDescription: string } = request.body;
        if (!backtestResults || !strategyDescription) {
            response.status(400).send({ message: "Missing 'backtestResults' or 'strategyDescription'." });
            return;
        }

        // Convert backtestResults object to a string for the prompt
        const resultsString = JSON.stringify(backtestResults, null, 2);

        const prompt = `Analyze the following backtest results for the strategy: \"${strategyDescription}\". Provide a concise analysis of the performance, highlighting strengths, weaknesses, and potential areas for improvement. Backtest Results:\n\n${resultsString}\n\nReturn as a JSON object: {"analysisText": "Your analysis here"}`;

        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", temperature: 0.5 }
        });

        let jsonStr = (genAIResponse.text ?? "").trim();
        const fenceRegex = /^`{3}(\w*)?\s*\n?([\s\S]*?)\n?\s*`{3}$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData: { analysisText: string } = JSON.parse(jsonStr);
            if (parsedData && parsedData.analysisText) {
                response.status(200).send(parsedData);
                return;
            }
            console.warn("Backtest analysis from AI was not in expected format:", parsedData);
            response.status(200).send({ analysisText: "Could not generate an analysis at this time." });
            return;
        } catch (error) {
            console.error("Failed to parse backtest analysis JSON from AI:", error, "Raw text:", jsonStr);
            response.status(500).send({ message: "AI generated invalid analysis data format.", details: jsonStr });
            return;
        }

    } catch (error) {
        handleApiError(response, error, "backtestAnalysis function");
        return;
    }
  });
});