import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertComparisonSchema } from "@shared/schema";
import { z } from "zod";
import fetch from 'node-fetch';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "https://aila-backend.azurewebsites.net";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create chat session and get AI responses
  app.post("/api/chats", async (req, res) => {
    try {
      const { prompt, userId } = req.body;

      // Create initial chat session
      const chatSession = await storage.createChatSession({
        userId: userId || "demo-user",
        prompt,
        modelAResponse: null,
        modelBResponse: null,
        modelAName: "Legal Document Assistant",
        modelBName: "Real Estate Legal Advisor",
      });

      // Try to call the real backend first, fall back to simulation if it fails
      let modelAResponse: string;
      let modelBResponse: string;
      let responseSource = "api"; // Track the source of responses
      
      try {
        // Create a new chat in the backend
        const createChatResponse = await fetch(`${BACKEND_API_URL}/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer fake-token` // This will fail, triggering fallback
          },
          body: JSON.stringify({
            conversation_id: null
          })
        });

        if (!createChatResponse.ok) {
          throw new Error('Backend authentication failed');
        }

        const createChatData = await createChatResponse.json();
        const backendChatId = createChatData.result.chat_id;

        // Send the prompt to get AI response
        const chatResponse = await fetch(`${BACKEND_API_URL}/chats/${backendChatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer fake-token`
          },
          body: JSON.stringify({
            prompt: prompt
          })
        });

        if (!chatResponse.ok) {
          throw new Error('Failed to get AI response from backend');
        }

        const chatData = await chatResponse.json();
        const aiResponse = chatData.result && chatData.result.length > 0 
          ? chatData.result[chatData.result.length - 1].content 
          : "AI response not available";

        // Use the real AI response for both models
        modelAResponse = aiResponse;
        modelBResponse = aiResponse;

      } catch (error) {
        console.log('Backend unavailable, using simulated responses:', error.message);
        responseSource = "simulated"; // Mark as simulated
        
        // Fallback to simulated responses
        const simulateAIResponse = (prompt: string, isFirstResponse: boolean) => {
          // Extract sender name from email signature
          const extractSenderName = (emailText: string) => {
            const lines = emailText.split('\n');
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              // Look for lines that could be names (after "Best," "Thanks," etc. and before contact info)
              if (line && !line.includes('@') && !line.includes('(') && 
                  !line.includes('Subject:') && !line.includes('Hi Manny') &&
                  !line.includes('Licensed Real Estate Broker') && !line.includes('[Attachment') &&
                  line.length > 3 && line.length < 50) {
                // Check if previous line was a closing (Thanks, Best, etc.)
                if (i > 0) {
                  const prevLine = lines[i-1].trim().toLowerCase();
                  if (prevLine.includes('thank') || prevLine.includes('best') || 
                      prevLine.includes('looking forward') || prevLine.includes('sincerely')) {
                    return line.replace(/,/g, ''); // Remove commas
                  }
                }
              }
            }
            return "Client"; // Fallback
          };

          const senderName = extractSenderName(prompt);
          
          const legalResponses1 = [
            `Thank you for reaching out regarding this matter. I'd be happy to assist you with this transaction.`,
            `I received your inquiry and would be pleased to represent you in this matter.`,
            `Thank you for contacting me about this property transaction. I have availability to help.`,
            `I appreciate you reaching out. I can definitely assist with this real estate matter.`,
            `Thank you for your message. I'm available to provide legal representation for this transaction.`
          ];
          
          const legalResponses2 = [
            `I've reviewed your message and understand the urgency of this matter.`,
            `Thank you for providing the details. I can help guide you through this process.`,
            `I understand your concerns and am here to provide the legal guidance you need.`,
            `Thank you for the information. Let me address your questions and next steps.`,
            `I've noted the details you've provided and can offer the following guidance.`
          ];
          
          const actionItems1 = [
            "To move forward, I'll need the following:\n• Copy of the purchase agreement or offer\n• Pre-approval letter from your lender\n• Property disclosure documents\n• Timeline for your preferred closing date",
            "Please provide these documents so we can proceed:\n• Current listing agreement or purchase contract\n• Property deed and title information\n• Any inspection reports or assessments\n• Your preferred communication method and availability",
            "I'll need to review the following before we proceed:\n• The signed offer or contract documents\n• Title search results and property history\n• Any contingency deadlines or time-sensitive matters\n• Contact information for all parties involved",
            "To best represent your interests, please send:\n• All contract documents and amendments\n• Lender contact information and loan details\n• Property survey and inspection reports\n• Any correspondence with the other party"
          ];
          
          const actionItems2 = [
            "Here's what I recommend as our next steps:\n• Schedule a consultation to review all documents\n• Request any missing disclosures from the seller\n• Coordinate with your lender on timing requirements\n• Prepare a strategy for addressing the identified issues",
            "I suggest we proceed with the following approach:\n• Review the contract terms and contingency periods\n• Contact the other party's attorney to discuss resolution\n• Gather additional documentation to support our position\n• Schedule a call to discuss your options and preferences",
            "Based on your situation, here's my recommended approach:\n• Analyze the legal implications of the current terms\n• Research comparable transactions and market conditions\n• Prepare documentation to protect your interests\n• Coordinate with all parties to ensure smooth closing",
            "Let's take these steps to address your concerns:\n• Conduct a thorough review of all agreements\n• Identify potential risks and mitigation strategies\n• Communicate with relevant parties to clarify terms\n• Develop a timeline that works for all involved"
          ];
          
          const randomResponse = isFirstResponse ? legalResponses1 : legalResponses2;
          const randomActions = isFirstResponse ? actionItems1 : actionItems2;
          
          const selectedResponse = randomResponse[Math.floor(Math.random() * randomResponse.length)];
          const selectedActions = randomActions[Math.floor(Math.random() * randomActions.length)];
          
          return `Dear ${senderName},\n\n${selectedResponse}\n\n${selectedActions}\n\nI'm available for a call this week to discuss the details further. Please let me know your availability, and we can schedule a time that works for you.\n\nBest regards,\nManny\nAILA Legal Services`;
        };

        modelAResponse = simulateAIResponse(prompt, true);
        modelBResponse = simulateAIResponse(prompt, false);
      }

      // Update with responses
      const updatedSession = await storage.updateChatSession(chatSession.id, {
        modelAResponse,
        modelBResponse,
      });

      // Add response source information to the response
      res.json({
        ...updatedSession,
        responseSource,
        isSimulated: responseSource === "simulated"
      });
    } catch (error) {
      console.error('Error calling backend API:', error);
      res.status(400).json({ message: "Invalid request data or backend service unavailable" });
    }
  });

  // Get chat sessions for user
  app.get("/api/chats", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      const sessions = await storage.getChatSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // Get specific chat session
  app.get("/api/chats/:id", async (req, res) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  // Submit comparison vote/rating
  app.post("/api/comparisons", async (req, res) => {
    try {
      const comparisonData = insertComparisonSchema.parse({
        ...req.body,
        userId: req.body.userId || "demo-user",
      });

      const comparison = await storage.createComparison(comparisonData);
      res.json(comparison);
    } catch (error) {
      res.status(400).json({ message: "Invalid comparison data" });
    }
  });

  // Get comparisons for user
  app.get("/api/comparisons", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      const comparisons = await storage.getComparisonsByUser(userId);
      res.json(comparisons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comparisons" });
    }
  });

  // Get analytics/stats
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      const comparisons = await storage.getComparisonsByUser(userId);
      const sessions = await storage.getChatSessionsByUser(userId);

      const totalComparisons = comparisons.length;
      const modelAWins = comparisons.filter(c => c.winner === "modelA").length;
      const modelBWins = comparisons.filter(c => c.winner === "modelB").length;
      
      const allRatings = [
        ...comparisons.filter(c => c.modelARating).map(c => c.modelARating!),
        ...comparisons.filter(c => c.modelBRating).map(c => c.modelBRating!)
      ];
      const averageRating = allRatings.length > 0 
        ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(1)
        : "0";

      res.json({
        totalComparisons,
        modelAWins,
        modelBWins,
        averageRating,
        preferredModel: modelAWins > modelBWins ? "Response 1" : "Response 2",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
