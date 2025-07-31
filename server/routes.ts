import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertComparisonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create chat session and get AI responses
  app.post("/api/chats", async (req, res) => {
    try {
      const { prompt, userId } = insertChatSessionSchema.parse({
        ...req.body,
        userId: req.body.userId || "demo-user", // In real app, extract from JWT
      });

      // Create initial chat session
      const chatSession = await storage.createChatSession({
        userId,
        prompt,
        modelAResponse: null,
        modelBResponse: null,
        modelAName: "GPT-4 Turbo",
        modelBName: "Claude 3 Opus",
      });

      // Simulate AI responses (in real app, call actual AI APIs)
      const modelAResponse = `Based on legal precedent and applicable statutes, regarding "${prompt}": The contractual obligations would likely be enforceable under relevant commercial code provisions. Key considerations include material terms definition, adequate consideration, and party capacity requirements. Recommend reviewing specific agreement terms and consulting applicable state law.`;
      
      const modelBResponse = `Analyzing "${prompt}" from a comprehensive legal perspective: The enforceability depends on several factors under applicable law. Primary framework includes contract formation requirements (offer, acceptance, consideration), commercial code applicability, state-specific interpretation standards, and potential defenses. Recommend thorough contract language review and jurisdictional requirement analysis.`;

      // Update with responses
      const updatedSession = await storage.updateChatSession(chatSession.id, {
        modelAResponse,
        modelBResponse,
      });

      res.json(updatedSession);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
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
        preferredModel: modelAWins > modelBWins ? "GPT-4" : "Claude",
        avgResponseTime: "3.4s",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
