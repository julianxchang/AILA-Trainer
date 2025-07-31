import { type User, type InsertUser, type ChatSession, type InsertChatSession, type Comparison, type InsertComparison } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

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
}

export const storage = new MemStorage();
