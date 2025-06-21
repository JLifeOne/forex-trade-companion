
import * as functions from "firebase-functions";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import * as cors from "cors";

// Initialize CORS middleware.
// For production, restrict origin to your app's actual domain for security.
// e.g., cors({ origin: "https://your-forex-app.web.app" })
const corsHandler = cors({ origin: true });

// Access your Gemini API Key from the environment configuration
const GEMINI_API_KEY = functions.config().gemini?.key;

if (!GEMINI_API_KEY) {
  console.error(
    "CRITICAL: Gemini API Key (gemini.key) is not configured in Firebase Functions environment. " +
    "Run 'firebase functions:config:set gemini.key=\"YOUR_KEY\"' and redeploy."
  );
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17"; // Ensure consistency

// --- Helper for API Error Handling ---
const handleApiError = (response: functions.Response, error: any, functionName: string) => {
  console.error(`Error in ${functionName}:`, error);
  let errorMessage = "An unexpected error occurred with the AI service.";
  let statusCode = 500;

  if (error.message) {
    errorMessage = error.message;
    // Check for specific error types or messages if needed
    if (error.message.includes("429") || (error.httpStatusCode === 429)) {
        errorMessage = "AI service is currently busy (rate limited). Please try again shortly.";
        statusCode = 429;
    } else if (error.message.toLowerCase().includes("api key not valid")) {
        errorMessage = "AI service authentication failed. Please check the API key configuration.";
        statusCode = 500; // Keep 500 as it's a server-side config issue
    }
  }
  response.status(statusCode).send({ message: errorMessage, errorDetails: error.toString() });
};


// --- SENTIMENT ANALYSIS ---
export const sentiment = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => {
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) {
      return response.status(500).send({ message: "AI service API key not configured." });
    }
    if (request.method !== "POST") {
      return response.status(405).send({ message: "Only POST requests are allowed." });
    }
    try {
      const { journalText } = request.body;
      if (!journalText) {
        return response.status(400).send({ message: "Missing 'journalText' in request body." });
      }

      const prompt = `Analyze the sentiment of the following journal entry: "${journalText}". Classify it strictly as one of: 'Low Emotion', 'Neutral Emotion', or 'High Emotion'. Return only the classification string.`;
      
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.2, topK:10 }
      });
      
      const textResponse = genAIResponse.text.trim();
      let emotionTag: 'Low Emotion' | 'Neutral Emotion' | 'High Emotion' | 'Unknown' = 'Unknown';

      if (textResponse.includes('Low Emotion')) emotionTag = 'Low Emotion';
      else if (textResponse.includes('Neutral Emotion')) emotionTag = 'Neutral Emotion';
      else if (textResponse.includes('High Emotion')) emotionTag = 'High Emotion';
      
      console.log(`Sentiment analysis raw response: "${textResponse}", Tag: "${emotionTag}"`);
      return response.status(200).send({ emotionTag });
    } catch (error) {
      handleApiError(response, error, "sentiment function");
    }
  });
});

// --- CHAT ASSISTANT ---
export const chat = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => {
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) {
      return response.status(500).send({ message: "AI service API key not configured." });
    }
    if (request.method !== "POST") {
      return response.status(405).send({ message: "Only POST requests are allowed." });
    }
    try {
      const { userMessage, history } = request.body;
      if (!userMessage) {
        return response.status(400).send({ message: "Missing 'userMessage' in request body." });
      }

      const contents = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: { role: 'user' | 'assistant'; text: string }) => {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          });
        });
      }
      contents.push({ role: "user", parts: [{ text: userMessage }] });
      
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: contents,
        config: { temperature: 0.7 }
      });

      const responseText = genAIResponse.text.trim();
      return response.status(200).send({ responseText });
    } catch (error) {
      handleApiError(response, error, "chat function");
    }
  });
});

// --- AI SIGNAL RECOMMENDATIONS ---
export const signals = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => {
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) return response.status(500).send({ message: "AI service API key not configured." });
    if (request.method !== "POST") return response.status(405).send({ message: "Only POST requests are allowed." });

    try {
      const { marketContext } = request.body;
      if (!marketContext) return response.status(400).send({ message: "Missing 'marketContext'."});

      const prompt = \`Given the market context: "${marketContext}", generate 3-5 potential forex trading signals. For each signal, provide:
        - id (string, unique, e.g., "eurusd-long-timestamp")
        - title (string, e.g., "EUR/USD Bullish Engulfing on H4")
        - description (string, detailed reasoning)
        - pair (string, e.g., "EUR/USD")
        - confidence (string, "High", "Medium", or "Low")
        - keyLevels (string, optional, e.g., "Support at 1.0800, Resistance at 1.0900")
        - chartPattern (string, optional, e.g., "Bullish Engulfing, Double Bottom")
        - confirmationSignals (string, optional, e.g., "RSI divergence, MACD crossover")
        - supportingIndicators (string, optional, e.g., "MA alignment, Volume increase")
        Return as a JSON object with a "signals" array: {"signals": [{"id": ..., "title": ...,}, ...]}\`;

      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { responseMimeType: "application/json", temperature: 0.5 }
      });
      
      let jsonStr = genAIResponse.text.trim();
      const fenceRegex = /^\`\`\`(\w*)?\\s*\n?(.*?)\n?\s*\`\`\`$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      try {
        const parsedData = JSON.parse(jsonStr);
        if (parsedData && Array.isArray(parsedData.signals)) {
            // Ensure IDs are somewhat unique if not perfectly provided by AI
            parsedData.signals = parsedData.signals.map((s: any, i: number) => ({
                ...s,
                id: s.id || \`sig-\${s.pair?.replace(/[^a-zA-Z0-9]/g, "") || 'unknown'}-\${Date.now() + i}\`
            }));
            return response.status(200).send(parsedData);
        }
        console.warn("Signals JSON from AI was not in expected format:", parsedData);
        return response.status(200).send({ signals: [] }); // Send empty array if format is off
      } catch(e) {
          console.error("Failed to parse signals JSON from AI:", e, "Raw Text:", jsonStr);
          // Attempt to extract from malformed JSON if possible or return error
           return response.status(500).send({ message: "AI generated invalid signal data format.", details: jsonStr });
      }

    } catch (error) {
      handleApiError(response, error, "signals function");
    }
  });
});

// --- AI STRATEGY GENERATION ---
export const strategyIdea = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => { // Renamed to match frontend call
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) return response.status(500).send({ message: "AI service API key not configured." });
    if (request.method !== "POST") return response.status(405).send({ message: "Only POST requests are allowed." });

    try {
      const { tradingStyle, newsContext } = request.body; // Correctly get variables from request body
      if (!tradingStyle) return response.status(400).send({ message: "Missing 'tradingStyle'."});

      const prompt = \`Generate a forex trading strategy idea for a '${tradingStyle}' style.
        News Context: "${newsContext || 'No specific news provided, assume general market conditions.'}"
        Provide:
        - strategyName (string)
        - description (string, brief overview)
        - entryConditions (string, clear rules)
        - exitConditions (string, clear rules for SL and TP)
        - coreLogic (string, the underlying rationale)
        - recommendedPairs (string, comma-separated e.g., "EUR/USD, GBP/JPY")
        - timeframes (string, e.g., "M15, H1, H4")
        Return as a JSON object with a "strategyIdea" key: {"strategyIdea": {"strategyName": ..., etc.}}\`;
      
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: [{role: "user", parts: [{text: prompt}]}],
        config: { responseMimeType: "application/json", temperature: 0.6 }
      });

      let jsonStr = genAIResponse.text.trim();
      const fenceRegex = /^\`\`\`(\w*)?\\s*\n?(.*?)\n?\s*\`\`\`$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      try {
        const parsedData = JSON.parse(jsonStr);
        // Add id to strategyIdea before sending
        if (parsedData && parsedData.strategyIdea && parsedData.strategyIdea.strategyName) {
           parsedData.strategyIdea.id = \`strat-\${parsedData.strategyIdea.strategyName.replace(/\\s+/g, '-').toLowerCase()}-\${Date.now()}\`;
        }
        return response.status(200).send(parsedData);
      } catch (e) {
        console.error("Failed to parse strategy idea JSON from AI:", e, "Raw text:", jsonStr);
        return response.status(500).send({ message: "AI generated invalid strategy data format.", details: jsonStr });
      }

    } catch (error) {
      handleApiError(response, error, "strategyIdea function");
    }
  });
});

// --- AI MARKET COMMENTARY ---
export const marketCommentary = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => { // Renamed
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) return response.status(500).send({ message: "AI service API key not configured." });
    if (request.method !== "POST") return response.status(405).send({ message: "Only POST requests are allowed." });
    
    try {
        const { newsContext } = request.body; // Correctly get variable from request body
        const prompt = \`Provide a brief (2-3 sentences) overall forex market commentary considering this news context: "${newsContext || "General market conditions"}". Focus on current sentiment, potential drivers, and major pair outlooks. Return as a JSON object: {"commentary": {"commentaryText": "Your commentary here"}}\`;

        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: { responseMimeType: "application/json", temperature: 0.7 }
        });

        let jsonStr = genAIResponse.text.trim();
        const fenceRegex = /^\`\`\`(\w*)?\\s*\n?(.*?)\n?\s*\`\`\`$/s;
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
    }
  });
});

// --- AI JOURNAL REVIEW ---
export const journalReview = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => { // Renamed
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) return response.status(500).send({ message: "AI service API key not configured." });
    if (request.method !== "POST") return response.status(405).send({ message: "Only POST requests are allowed." });

    try {
        const { entriesText, periodDescription } = request.body; // Correctly get variables from request body
        if (!entriesText || !periodDescription) return response.status(400).send({ message: "Missing 'entriesText' or 'periodDescription'."});

        const prompt = \`Review the following forex trading journal entries for the period '${periodDescription}'. Provide constructive feedback on patterns, mindset, strategy application, and areas for improvement. Be concise and actionable. Entries:\\n\\n${entriesText}\\n\\nReturn as a JSON object: {"reviewText": "Your review here"}\`;
        
        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: { responseMimeType: "application/json", temperature: 0.5 }
        });

        let jsonStr = genAIResponse.text.trim();
        const fenceRegex = /^\`\`\`(\w*)?\\s*\n?(.*?)\n?\s*\`\`\`$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr);
            if (parsedData && parsedData.reviewText) {
                 return response.status(200).send(parsedData);
            }
            console.warn("Journal review from AI was not in expected format:", parsedData);
            return response.status(200).send({ reviewText: "Could not generate a review at this time." });
        } catch (e) {
            console.error("Failed to parse journal review JSON from AI:", e, "Raw text:", jsonStr);
            return response.status(500).send({ message: "AI generated invalid review data format.", details: jsonStr });
        }

    } catch (error) {
      handleApiError(response, error, "journalReview function");
    }
  });
});

// --- AI WATCHLIST SYMBOL SENTIMENT ---
export const symbolSentiment = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => { // Renamed
  corsHandler(request, response, async () => {
    if (!GEMINI_API_KEY) return response.status(500).send({ message: "AI service API key not configured." });
    if (request.method !== "POST") return response.status(405).send({ message: "Only POST requests are allowed." });
    
    try {
        const { symbol } = request.body; // Correctly get variable from request body
        if (!symbol) return response.status(400).send({ message: "Missing 'symbol'."});

        const prompt = \`What is the current market sentiment for the forex symbol ${symbol}? Consider recent price action, news, and general technical outlook. Classify strictly as 'Bullish', 'Bearish', or 'Neutral'. Return as a JSON object: {"sentiment": "Your classification"}\`;
        
        const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{role: "user", parts: [{text: prompt}]}],
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });

        let jsonStr = genAIResponse.text.trim();
        const fenceRegex = /^\`\`\`(\w*)?\\s*\n?(.*?)\n?\s*\`\`\`$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData = JSON.parse(jsonStr);
            if (parsedData && parsedData.sentiment && ['Bullish', 'Bearish', 'Neutral'].includes(parsedData.sentiment)) {
                return response.status(200).send(parsedData);
            }
            console.warn("Symbol sentiment from AI was not in expected format:", parsedData);
            return response.status(200).send({ sentiment: "N/A" });
        } catch (e) {
            console.error("Failed to parse symbol sentiment JSON from AI:", e, "Raw text:", jsonStr);
            return response.status(500).send({ message: "AI generated invalid sentiment data format.", details: jsonStr });
        }

    } catch (error) {
      handleApiError(response, error, "symbolSentiment function");
    }
  });
});
