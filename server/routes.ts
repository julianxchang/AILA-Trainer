import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertComparisonSchema, insertEvaluationTestCaseSchema, insertAgentResponseSchema, insertHumanGradeSchema } from "@shared/schema";
import { z } from "zod";
import fetch from 'node-fetch';
import { FastAPIService } from './fastapi-service';
import { AILABackendService } from './aila-backend-service';
import { emailPrompts } from './email-prompts';

const BACKEND_API_URL = process.env.BACKEND_API_URL || "https://aila-backend.azurewebsites.net";
let fastAPIService: FastAPIService;
let ailaBackendService: AILABackendService;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services after environment variables are loaded
  fastAPIService = new FastAPIService();
  ailaBackendService = new AILABackendService();
  
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection and aila-backend connection
      const testUser = await storage.getUser('00000000-0000-0000-0000-000000000000');
      const ailaBackendConnected = await ailaBackendService.testConnection();
      
      res.json({ 
        status: "healthy", 
        database: "connected",
        openaiKey: process.env.OPENAI_API_KEY ? "configured" : "missing",
        ailaBackend: ailaBackendConnected ? "connected" : "disconnected"
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: "unhealthy", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get available email prompts
  app.get("/api/emails", async (req, res) => {
    try {
      res.json({
        message: "success",
        result: emailPrompts.map(email => ({
          id: email.id,
          subject: email.subject,
          category: email.category
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email prompts" });
    }
  });

  // Get specific email content
  app.get("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const email = emailPrompts.find(e => e.id === emailId);
      
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      
      res.json({
        message: "success",
        result: email
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  // Get test cases from aila-backend
  app.get("/api/backend/test-cases", async (req, res) => {
    try {
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const testCases = await ailaBackendService.getTestCases(category, limit);
      res.json({
        message: "success",
        result: testCases
      });
    } catch (error) {
      console.error('Error fetching test cases from aila-backend:', error);
      res.status(500).json({ 
        message: "Failed to fetch test cases from aila-backend",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific test case detail from aila-backend
  app.get("/api/backend/test-cases/:id", async (req, res) => {
    try {
      const testCaseId = req.params.id;
      const testCaseDetail = await ailaBackendService.getTestCaseDetail(testCaseId);
      
      res.json({
        message: "success",
        result: testCaseDetail
      });
    } catch (error) {
      console.error('Error fetching test case detail from aila-backend:', error);
      res.status(500).json({ 
        message: "Failed to fetch test case detail from aila-backend",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Submit grade to aila-backend
  app.post("/api/backend/grade", async (req, res) => {
    try {
      const { response_id, score, feedback, grading_criteria } = req.body;
      
      if (!response_id || score === undefined) {
        return res.status(400).json({ 
          message: "response_id and score are required" 
        });
      }

      const success = await ailaBackendService.submitGrade({
        response_id,
        score,
        feedback,
        grading_criteria
      });
      
      res.json({
        message: "Grade submitted successfully",
        success
      });
    } catch (error) {
      console.error('Error submitting grade to aila-backend:', error);
      res.status(500).json({ 
        message: "Failed to submit grade to aila-backend",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create evaluation session using aila-backend test cases
  app.post("/api/evaluations/from-backend", async (req, res) => {
    try {
      const { testCaseId, userId } = req.body;

      if (!testCaseId) {
        return res.status(400).json({ message: "testCaseId is required" });
      }

      // Get the test case from aila-backend
      const testCaseDetail = await ailaBackendService.getTestCaseDetail(testCaseId);
      
      if (!testCaseDetail || !testCaseDetail.test_case) {
        return res.status(404).json({ message: "Test case not found" });
      }

      const testCase = testCaseDetail.test_case;
      
      // Get both AI responses using the FastAPI service with test case input
      const evaluationSessionId = `eval-${Date.now()}`;
      const responses = await fastAPIService.getBothResponses(
        testCase.input_text, 
        evaluationSessionId, 
        userId || "demo-user"
      );
      
      // Create local evaluation record for compatibility
      const localTestCase = await storage.createEvaluationTestCase({
        caseName: testCase.case_name,
        inputText: testCase.input_text,
        contextData: { 
          backendTestCaseId: testCase.id,
          category: testCase.category,
          ...testCase.context_data 
        },
        expectedBehavior: testCase.expected_behavior,
        category: testCase.category,
        difficultyLevel: testCase.difficulty_level,
        createdBy: userId || "demo-user"
      });

      // Save agent responses locally for comparison UI
      const agentResponseA = await storage.createAgentResponse({
        testCaseId: localTestCase.id,
        agentVersion: "gpt-3.5-turbo-compose",
        responseText: responses.modelAResponse,
        responseMetadata: { 
          temperature: 0.3, 
          systemPrompt: "Legal Document Assistant",
          backendTestCaseId: testCase.id
        },
        sessionId: evaluationSessionId
      });

      const agentResponseB = await storage.createAgentResponse({
        testCaseId: localTestCase.id,
        agentVersion: "gpt-3.5-turbo-research", 
        responseText: responses.modelBResponse,
        responseMetadata: { 
          temperature: 0.7, 
          systemPrompt: "Real Estate Legal Advisor",
          backendTestCaseId: testCase.id
        },
        sessionId: evaluationSessionId
      });

      // Return evaluation data
      res.json({
        id: evaluationSessionId,
        testCaseId: localTestCase.id,
        backendTestCaseId: testCase.id,
        agentResponseAId: agentResponseA.id,
        agentResponseBId: agentResponseB.id,
        modelAResponse: responses.modelAResponse,
        modelBResponse: responses.modelBResponse,
        modelAName: "Response 1",
        modelBName: "Response 2",
        prompt: testCase.input_text,
        expectedBehavior: testCase.expected_behavior,
        category: testCase.category,
        userId: userId || "demo-user",
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating evaluation from backend:', error);
      res.status(500).json({ 
        message: "Server error", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create evaluation session using predefined emails (NO CHAT NEEDED)
  app.post("/api/evaluations", async (req, res) => {
    try {
      const { emailId, userId } = req.body;

      // Get the email prompt by ID (default to first email if not specified)
      const selectedEmail = emailPrompts.find(email => email.id === emailId) || emailPrompts[0];
      
      // Create evaluation test case
      const testCase = await storage.createEvaluationTestCase({
        caseName: selectedEmail.subject,
        inputText: selectedEmail.content,
        contextData: { emailId, category: selectedEmail.category },
        expectedBehavior: "Professional legal response with specific next steps",
        category: selectedEmail.category,
        difficultyLevel: 3,
        createdBy: userId || "demo-user"
      });
      
      // Get both AI responses using the FastAPI service with email content
      const fullEmailContent = `Subject: ${selectedEmail.subject}\n\n${selectedEmail.content}`;
      const evaluationSessionId = `eval-${Date.now()}`;
      const responses = await fastAPIService.getBothResponses(fullEmailContent, evaluationSessionId, userId || "demo-user");
      
      // Save agent responses to evaluation schema (NO CHAT TABLES NEEDED)
      const agentResponseA = await storage.createAgentResponse({
        testCaseId: testCase.id,
        agentVersion: "gpt-3.5-turbo-compose",
        responseText: responses.modelAResponse,
        responseMetadata: { 
          temperature: 0.3, 
          systemPrompt: "Legal Document Assistant"
        },
        sessionId: evaluationSessionId
      });

      const agentResponseB = await storage.createAgentResponse({
        testCaseId: testCase.id,
        agentVersion: "gpt-3.5-turbo-research", 
        responseText: responses.modelBResponse,
        responseMetadata: { 
          temperature: 0.7, 
          systemPrompt: "Real Estate Legal Advisor"
        },
        sessionId: evaluationSessionId
      });

      // Return evaluation data (NO CHAT SESSION NEEDED)
      res.json({
        id: evaluationSessionId,
        testCaseId: testCase.id,
        agentResponseAId: agentResponseA.id,
        agentResponseBId: agentResponseB.id,
        modelAResponse: responses.modelAResponse,
        modelBResponse: responses.modelBResponse,
        modelAName: "Response 1",
        modelBName: "Response 2",
        prompt: `Subject: ${selectedEmail.subject}\n\n${selectedEmail.content}`,
        userId: userId || "demo-user",
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error in /api/evaluations:', error);
      
      // More detailed error reporting
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      res.status(500).json({ 
        message: "Server error", 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Check server logs for more information"
      });
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

  // Submit comparison vote/rating for evaluation
  app.post("/api/comparisons", async (req, res) => {
    try {
      const { 
        evaluationSessionId, modelARating, modelBRating, modelAComment, modelBComment, 
        userId, agentResponseAId, agentResponseBId, backendTestCaseId
      } = req.body;

      // Save human grades to evaluation schema (NO LEGACY COMPARISONS NEEDED)
      const gradePromises = [];
      const backendGradePromises = [];
      
      if (agentResponseAId && modelARating) {
        // Save to local storage
        gradePromises.push(storage.createHumanGrade({
          responseId: agentResponseAId,
          graderId: userId || "demo-user",
          score: modelARating,
          feedback: modelAComment || null,
          gradingCriteria: { 
            responseName: "Response 1",
            comparisonWinner: modelARating >= modelBRating ? "this" : "other"
          },
          gradingSessionId: evaluationSessionId
        }));

        // If we have a backend test case, also submit to aila-backend
        if (backendTestCaseId) {
          // Get the agent response to find any backend response IDs
          const agentResponse = await storage.getAgentResponseById(agentResponseAId);
          const backendResponseId = agentResponse?.responseMetadata?.backendResponseId;
          
          if (backendResponseId) {
            backendGradePromises.push(ailaBackendService.submitGrade({
              response_id: backendResponseId,
              score: modelARating,
              feedback: modelAComment || undefined,
              grading_criteria: { 
                responseName: "Response 1",
                comparisonWinner: modelARating >= modelBRating ? "this" : "other",
                evaluationSessionId
              }
            }));
          }
        }
      }

      if (agentResponseBId && modelBRating) {
        // Save to local storage
        gradePromises.push(storage.createHumanGrade({
          responseId: agentResponseBId,
          graderId: userId || "demo-user", 
          score: modelBRating,
          feedback: modelBComment || null,
          gradingCriteria: {
            responseName: "Response 2", 
            comparisonWinner: modelBRating >= modelARating ? "this" : "other"
          },
          gradingSessionId: evaluationSessionId
        }));

        // If we have a backend test case, also submit to aila-backend
        if (backendTestCaseId) {
          const agentResponse = await storage.getAgentResponseById(agentResponseBId);
          const backendResponseId = agentResponse?.responseMetadata?.backendResponseId;
          
          if (backendResponseId) {
            backendGradePromises.push(ailaBackendService.submitGrade({
              response_id: backendResponseId,
              score: modelBRating,
              feedback: modelBComment || undefined,
              grading_criteria: {
                responseName: "Response 2", 
                comparisonWinner: modelBRating >= modelARating ? "this" : "other",
                evaluationSessionId
              }
            }));
          }
        }
      }

      // Execute all promises
      const [grades, backendResults] = await Promise.all([
        Promise.all(gradePromises),
        Promise.all(backendGradePromises)
      ]);
      
      res.json({ 
        success: true, 
        grades: grades.length,
        backendGrades: backendResults.length,
        winner: modelARating >= modelBRating ? "modelA" : "modelB",
        evaluationSessionId
      });
    } catch (error) {
      console.error("Error saving comparison:", error);
      res.status(400).json({ message: "Invalid comparison data" });
    }
  });

  // Get comparisons for user
  app.get("/api/comparisons", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      // Use evaluation-based data instead of legacy comparisons
      const comparisons = await storage.getRecentGradesByUser(userId, 50); // Get more for full history
      res.json(comparisons);
    } catch (error) {
      console.error("Error fetching comparisons:", error);
      res.status(500).json({ message: "Failed to fetch comparisons" });
    }
  });

  // Get analytics/stats
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.query.userId as string || "demo-user";
      // Use evaluation-based stats instead of legacy stats
      const stats = await storage.getEvaluationStatsByUser(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
