import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import cors from "cors";

// Initialize Firebase Admin SDK
admin.initializeApp();

// --- Enhanced CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://forex-trade-companion.web.app'
];

const corsMiddleware = cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
});

// --- Main Cloud Function ---
export const getGeminiResponse = functions.https.onRequest((req, res) => {
  // Apply CORS middleware
  corsMiddleware(req, res, async () => {
    // --- Basic Request Validation ---
    if (req.method !== "POST") {
      functions.logger.warn("Method Not Allowed:", req.method);
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      functions.logger.error("Bad Request: Prompt is missing or not a string.");
      return res.status(400).send({ error: "Bad Request: 'prompt' is required and must be a string." });
    }

    // --- Securely Get API Key ---
    let apiKey;
    try {
        apiKey = functions.config().gemini.key;
        if (!apiKey) {
            functions.logger.error("Gemini API key is not configured. Set it with 'firebase functions:config:set gemini.key=YOUR_API_KEY'");
            return res.status(500).send({ error: "Internal Server Error: AI service is not configured." });
        }
    } catch (error) {
        functions.logger.error("Could not access Firebase functions config. Ensure you are in an initialized Firebase project.", error);
        return res.status(500).send({ error: "Internal Server Error: Configuration missing." });
    }

    try {
      // --- Initialize Gemini Client ---
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        // --- Safety Settings (Resourceful Upgrade) ---
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ],
      });

      // --- Generate Content ---
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return res.status(200).send({ text });

    } catch (error) {
      // --- Enhanced Error Logging ---
      functions.logger.error("Error calling Gemini API:", error);
      // Provide a generic error to the client for security
      return res.status(500).send({ error: "Internal Server Error: Could not get response from AI service." });
    }
  });
});

// Placeholder for the 'chat' function
export const chat = functions.https.onRequest((req, res) => {
    res.status(501).send("Not Implemented: This function will handle chat interactions and voice recordings.");
});

import { onCall, HttpsError } from "firebase-functions/v2/https";

// --- Enhanced Sentiment Analysis Function (Callable) ---
export const analyzeSentimentAndSave = onCall(async (request) => {
    // 1. --- Authentication Check ---
    if (!request.auth) {
        throw new HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }
    const userId = request.auth.uid;

    // 2. --- Input Data Validation ---
    const { journalEntry, tradeData } = request.data;
    if (!journalEntry || typeof journalEntry !== 'object' || !tradeData || typeof tradeData !== 'object') {
        throw new HttpsError(
            'invalid-argument',
            'The function must be called with "journalEntry" and "tradeData" objects.'
        );
    }

    // 3. --- Securely Get API Key ---
    let apiKey;
    try {
        apiKey = functions.config().gemini.key;
        if (!apiKey) {
            functions.logger.error("Gemini API key is not configured.");
            throw new HttpsError('internal', 'AI service is not configured.');
        }
    } catch (error) {
        functions.logger.error("Could not access Firebase functions config.", error);
        throw new HttpsError('internal', 'Configuration missing.');
    }

    try {
        // 4. --- Initialize Gemini Client ---
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 5. --- Advanced AI Prompt ---
        const advancedPrompt = `
            As a trading psychology expert, analyze the following structured journal entry and trade data.
            The user is a forex trader. Your task is to provide deep, actionable insights.

            **Trade Data:**
            - Instrument: ${tradeData.instrument || 'N/A'}
            - P/L: ${tradeData.profit || 'N/A'}
            - Strategy: ${tradeData.strategy || 'N/A'}

            **Structured Journal Entry:**
            - Market Thesis: ${journalEntry.marketThesis || 'N/A'}
            - Entry Reason: ${journalEntry.entryReason || 'N/A'}
            - Exit Reason: ${journalEntry.exitReason || 'N/A'}
            - Post-Trade Feelings: ${journalEntry.postTradeFeelings || 'N/A'}

            **Analysis Task:**
            Based on ALL the provided information, generate a JSON object with the following structure:
            {
              "sentimentSummary": "A brief, insightful summary of the trader's psychological state, linking their feelings to the trade outcome.",
              "keyEmotions": ["List", "of", "identified", "emotions", "like", "Fear", "Greed", "Discipline"],
              "confidenceScore": A number between 0.0 (no confidence) and 1.0 (high confidence),
              "recommendations": [
                "A specific, actionable recommendation based on the market thesis.",
                "A specific, actionable recommendation based on the entry/exit reasons.",
                "A specific, actionable recommendation based on the post-trade feelings and P/L."
              ]
            }
        `;

        // 6. --- Generate Content ---
        const result = await model.generateContent(advancedPrompt);
        const response = result.response;
        const responseText = response.text();
        let analysisResult;

        // 7. --- Parse Response ---
        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
            const jsonString = jsonMatch ? jsonMatch[1] : responseText;
            analysisResult = JSON.parse(jsonString);
        } catch (parseError) {
            functions.logger.error("Failed to parse JSON from Gemini:", parseError, "Raw response:", responseText);
            throw new HttpsError('internal', 'Could not process AI response.');
        }

        // 8. --- Save to Firestore ---
        const db = admin.firestore();
        const tradeId = tradeData.id || `trade_${Date.now()}`; // Use trade ID if provided, else generate one
        const sentimentRecord = {
            ...analysisResult,
            tradeData, // Store the original trade data for context
            journalEntry, // Store the original journal entry
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('users').doc(userId).collection('sentimentHistory').doc(tradeId).set(sentimentRecord);

        functions.logger.log(`Successfully analyzed and saved sentiment for user ${userId}, trade ${tradeId}`);

        // 9. --- Return Result to Client ---
        return sentimentRecord;

    } catch (error) {
        functions.logger.error("Error during sentiment analysis and save:", error);
        if (error instanceof HttpsError) {
            throw error; // Re-throw HttpsError
        }
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});