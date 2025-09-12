import { 
  type User, type InsertUser, type ChatSession, type InsertChatSession, type Comparison, type InsertComparison,
  type EvaluationTestCase, type InsertEvaluationTestCase, type AgentResponse, type InsertAgentResponse,
  type HumanGrade, type InsertHumanGrade,
  users, chatSessions, comparisons, evaluationTestCases, agentResponses, humanGrades
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, sql, avg, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createChatSession(chatSession: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  getComparisonsByUser(userId: string): Promise<Comparison[]>;
  getComparisonsByChatSession(chatSessionId: string): Promise<Comparison[]>;

  // Evaluation methods
  createEvaluationTestCase(testCase: InsertEvaluationTestCase): Promise<EvaluationTestCase>;
  getEvaluationTestCase(id: string): Promise<EvaluationTestCase | undefined>;
  createAgentResponse(response: InsertAgentResponse): Promise<AgentResponse>;
  getAgentResponse(id: string): Promise<AgentResponse | undefined>;
  getAgentResponseById(id: string): Promise<AgentResponse | undefined>;
  createHumanGrade(grade: InsertHumanGrade): Promise<HumanGrade>;
  getHumanGradesByResponse(responseId: string): Promise<HumanGrade[]>;
  
  // Dashboard stats methods
  getEvaluationStatsByUser(graderId: string): Promise<{
    totalComparisons: number;
    averageScore: number;
    modelAWins: number;
    modelBWins: number;
    preferredModel: string;
  }>;
  getRecentGradesByUser(graderId: string, limit?: number): Promise<Array<{
    id: string;
    testCaseId: string;
    caseName: string;
    winner: string;
    modelARating: number | null;
    modelBRating: number | null;
    modelAComment: string | null;
    modelBComment: string | null;
    gradedAt: Date;
    createdAt: Date;
  }>>;
}

import { randomUUID } from "crypto";

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private comparisons: Map<string, Comparison>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.comparisons = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createChatSession(insertChatSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const chatSession: ChatSession = {
      ...insertChatSession,
      id,
      createdAt: new Date(),
    };
    this.chatSessions.set(id, chatSession);
    return chatSession;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const existing = this.chatSessions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.chatSessions.set(id, updated);
    return updated;
  }

  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const id = randomUUID();
    const comparison: Comparison = {
      ...insertComparison,
      id,
      createdAt: new Date(),
    };
    this.comparisons.set(id, comparison);
    return comparison;
  }

  async getComparisonsByUser(userId: string): Promise<Comparison[]> {
    return Array.from(this.comparisons.values()).filter(
      (comparison) => comparison.userId === userId,
    );
  }

  async getComparisonsByChatSession(chatSessionId: string): Promise<Comparison[]> {
    return Array.from(this.comparisons.values()).filter(
      (comparison) => comparison.chatSessionId === chatSessionId,
    );
  }

  // Stub implementations for evaluation methods (MemStorage doesn't support these)
  async createEvaluationTestCase(testCase: InsertEvaluationTestCase): Promise<EvaluationTestCase> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getEvaluationTestCase(id: string): Promise<EvaluationTestCase | undefined> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async createAgentResponse(response: InsertAgentResponse): Promise<AgentResponse> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getAgentResponse(id: string): Promise<AgentResponse | undefined> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getAgentResponseById(id: string): Promise<AgentResponse | undefined> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async createHumanGrade(grade: InsertHumanGrade): Promise<HumanGrade> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getHumanGradesByResponse(responseId: string): Promise<HumanGrade[]> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getEvaluationStatsByUser(graderId: string): Promise<{
    totalComparisons: number;
    averageScore: number;
    modelAWins: number;
    modelBWins: number;
    preferredModel: string;
  }> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }

  async getRecentGradesByUser(graderId: string, limit?: number): Promise<Array<{
    id: string;
    testCaseId: string;
    caseName: string;
    winner: string;
    modelARating: number | null;
    modelBRating: number | null;
    modelAComment: string | null;
    modelBComment: string | null;
    gradedAt: Date;
    createdAt: Date;
  }>> {
    throw new Error("Evaluation methods not supported in MemStorage");
  }
}

// Database connection - lazy initialization
let db: any = null;
let client: pg.Client | null = null;
let isInitialized = false;

function initializeDatabase() {
  if (!isInitialized) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    client = new pg.Client({ connectionString: databaseUrl });
    client.connect();
    db = drizzle(client);
    isInitialized = true;
  }
  return db;
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const database = initializeDatabase();
    const result = await database.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createChatSession(insertChatSession: InsertChatSession): Promise<ChatSession> {
    const database = initializeDatabase();
    const result = await database.insert(chatSessions).values(insertChatSession).returning();
    return result[0];
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(chatSessions).where(eq(chatSessions.id, id));
    return result[0];
  }

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    const database = initializeDatabase();
    return await database.select().from(chatSessions).where(eq(chatSessions.userId, userId));
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const database = initializeDatabase();
    const result = await database.update(chatSessions).set(updates).where(eq(chatSessions.id, id)).returning();
    return result[0];
  }

  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const database = initializeDatabase();
    const result = await database.insert(comparisons).values(insertComparison).returning();
    return result[0];
  }

  async getComparisonsByUser(userId: string): Promise<Comparison[]> {
    const database = initializeDatabase();
    return await database.select().from(comparisons).where(eq(comparisons.userId, userId));
  }

  async getComparisonsByChatSession(chatSessionId: string): Promise<Comparison[]> {
    const database = initializeDatabase();
    return await database.select().from(comparisons).where(eq(comparisons.chatSessionId, chatSessionId));
  }

  // Evaluation methods
  async createEvaluationTestCase(insertTestCase: InsertEvaluationTestCase): Promise<EvaluationTestCase> {
    const database = initializeDatabase();
    const result = await database.insert(evaluationTestCases).values(insertTestCase).returning();
    return result[0];
  }

  async getEvaluationTestCase(id: string): Promise<EvaluationTestCase | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(evaluationTestCases).where(eq(evaluationTestCases.id, id));
    return result[0];
  }

  async createAgentResponse(insertResponse: InsertAgentResponse): Promise<AgentResponse> {
    const database = initializeDatabase();
    const result = await database.insert(agentResponses).values(insertResponse).returning();
    return result[0];
  }

  async getAgentResponse(id: string): Promise<AgentResponse | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(agentResponses).where(eq(agentResponses.id, id));
    return result[0];
  }

  async getAgentResponseById(id: string): Promise<AgentResponse | undefined> {
    // Alias for getAgentResponse for consistency
    return this.getAgentResponse(id);
  }

  async createHumanGrade(insertGrade: InsertHumanGrade): Promise<HumanGrade> {
    const database = initializeDatabase();
    const result = await database.insert(humanGrades).values(insertGrade).returning();
    return result[0];
  }

  async getHumanGradesByResponse(responseId: string): Promise<HumanGrade[]> {
    const database = initializeDatabase();
    return await database.select().from(humanGrades).where(eq(humanGrades.responseId, responseId));
  }

  async getEvaluationStatsByUser(graderId: string): Promise<{
    totalComparisons: number;
    averageScore: number;
    modelAWins: number;
    modelBWins: number;
    preferredModel: string;
  }> {
    const database = initializeDatabase();
    
    // Get all grades for the user, grouped by grading session
    const grades = await database
      .select({
        gradingSessionId: humanGrades.gradingSessionId,
        score: humanGrades.score,
        gradingCriteria: humanGrades.gradingCriteria,
      })
      .from(humanGrades)
      .where(eq(humanGrades.graderId, graderId))
      .orderBy(desc(humanGrades.gradedAt));

    // Group by grading session to get comparisons
    const sessionMap = new Map<string, Array<{ score: number; gradingCriteria: any }>>();
    grades.forEach(grade => {
      if (grade.gradingSessionId) {
        if (!sessionMap.has(grade.gradingSessionId)) {
          sessionMap.set(grade.gradingSessionId, []);
        }
        sessionMap.get(grade.gradingSessionId)!.push({ 
          score: grade.score, 
          gradingCriteria: grade.gradingCriteria 
        });
      }
    });

    let totalComparisons = 0;
    let modelAWins = 0;
    let modelBWins = 0;
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    // Process each comparison session
    sessionMap.forEach(sessionGrades => {
      if (sessionGrades.length === 2) { // Only count complete comparisons
        totalComparisons++;
        
        const response1Grade = sessionGrades.find(g => 
          g.gradingCriteria?.responseName === "Response 1"
        );
        const response2Grade = sessionGrades.find(g => 
          g.gradingCriteria?.responseName === "Response 2"
        );

        if (response1Grade && response2Grade) {
          if (response1Grade.score >= response2Grade.score) {
            modelAWins++;
          } else {
            modelBWins++;
          }
          
          totalScoreSum += response1Grade.score + response2Grade.score;
          totalScoreCount += 2;
        }
      }
    });

    const averageScore = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : 0;
    const preferredModel = modelAWins >= modelBWins ? "Response 1" : "Response 2";

    return {
      totalComparisons,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      modelAWins,
      modelBWins,
      preferredModel,
    };
  }

  async getRecentGradesByUser(graderId: string, limit = 10): Promise<Array<{
    id: string;
    testCaseId: string;
    caseName: string;
    winner: string;
    modelARating: number | null;
    modelBRating: number | null;
    modelAComment: string | null;
    modelBComment: string | null;
    gradedAt: Date;
    createdAt: Date;
  }>> {
    const database = initializeDatabase();
    
    // Get unique grading sessions (no duplicates)
    const uniqueSessions = await database
      .select({
        gradingSessionId: humanGrades.gradingSessionId,
        maxGradedAt: sql<Date>`MAX(${humanGrades.gradedAt})`.as('max_graded_at'),
      })
      .from(humanGrades)
      .where(eq(humanGrades.graderId, graderId))
      .groupBy(humanGrades.gradingSessionId)
      .orderBy(desc(sql`MAX(${humanGrades.gradedAt})`))
      .limit(limit);

    const results = [];

    for (const session of uniqueSessions) {
      if (!session.gradingSessionId) continue;

      // Get all grades for this session
      const sessionGrades = await database
        .select({
          id: humanGrades.id,
          responseId: humanGrades.responseId,
          score: humanGrades.score,
          feedback: humanGrades.feedback,
          gradingCriteria: humanGrades.gradingCriteria,
        })
        .from(humanGrades)
        .where(eq(humanGrades.gradingSessionId, session.gradingSessionId));

      if (sessionGrades.length === 2) {
        // Get test case info from one of the responses
        const firstResponse = await database
          .select({
            testCaseId: agentResponses.testCaseId,
          })
          .from(agentResponses)
          .where(eq(agentResponses.id, sessionGrades[0].responseId))
          .limit(1);

        if (firstResponse[0]) {
          const testCase = await database
            .select({
              caseName: evaluationTestCases.caseName,
            })
            .from(evaluationTestCases)
            .where(eq(evaluationTestCases.id, firstResponse[0].testCaseId))
            .limit(1);

          // Separate Response 1 and Response 2 grades
          const response1Grade = sessionGrades.find(g => 
            g.gradingCriteria?.responseName === "Response 1"
          );
          const response2Grade = sessionGrades.find(g => 
            g.gradingCriteria?.responseName === "Response 2"
          );

          const winner = (response1Grade?.score || 0) >= (response2Grade?.score || 0) 
            ? "modelA" : "modelB";

          results.push({
            id: session.gradingSessionId,
            testCaseId: firstResponse[0].testCaseId,
            caseName: testCase[0]?.caseName || "Unknown",
            winner,
            modelARating: response1Grade?.score || null,
            modelBRating: response2Grade?.score || null,
            modelAComment: response1Grade?.feedback || null,
            modelBComment: response2Grade?.feedback || null,
            gradedAt: session.maxGradedAt,
            createdAt: session.maxGradedAt, // Add for dashboard compatibility
          });
        }
      }
    }

    return results;
  }
}

export const storage = new PostgreSQLStorage();
