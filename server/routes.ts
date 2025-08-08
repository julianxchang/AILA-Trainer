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
        modelAName: "Legal Analysis System",
        modelBName: "Contract Review Assistant",
      });

      // Simulate AI responses (in real app, call actual AI APIs)
      const modelAResponse = `**Contract Review Summary - Mutual Non-Disclosure Agreement**

**Key Findings:**
1. **Duration & Termination:** The 5-year confidentiality term appears standard for technology collaborations, with automatic renewal clause that may require attention.

2. **Confidential Information Definition:** Broadly defined but includes appropriate carve-outs for independently developed information and publicly available data.

3. **Return/Destruction:** 30-day return requirement upon termination is reasonable. Electronic data destruction certification should be required.

4. **Governing Law:** Delaware law specified with federal court jurisdiction. Consider alternative dispute resolution clause.

**Recommendations:**
- Add specific provisions for return of proprietary software methodologies
- Include mutual indemnification for data breaches
- Consider adding non-solicitation clause for Project Alpha duration

**Overall Assessment:** Agreement is generally favorable with minor modifications recommended.`;
      
      const modelBResponse = `**Legal Analysis: TechCorp MNDA Review**

**Critical Issues Identified:**

**HIGH PRIORITY:**
- Reciprocity imbalance in confidentiality obligations (Section 3.2)
- Overly broad definition of "Confidential Information" may capture non-proprietary data
- Liquidated damages clause (Section 7.1) may be unenforceable as penalty

**MEDIUM PRIORITY:**
- Survival clause extends confidentiality obligations beyond reasonable term
- Assignment rights favor TechCorp disproportionately
- Dispute resolution mechanism lacks efficiency measures

**LOW PRIORITY:**
- Standard provisions regarding public disclosures and legal compulsion

**Legal Strategy:**
1. Negotiate reciprocal confidentiality terms
2. Narrow confidential information scope to truly proprietary materials
3. Replace liquidated damages with reasonable limitation of liability
4. Add termination for convenience with 60-day notice

**Recommendation:** Significant revisions required before execution.`;

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
        preferredModel: modelAWins > modelBWins ? "Response 1" : "Response 2",
        avgResponseTime: "3.4s",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
