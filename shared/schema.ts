import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  modelAResponse: text("model_a_response"),
  modelBResponse: text("model_b_response"),
  modelAName: text("model_a_name").default("GPT-4 Turbo"),
  modelBName: text("model_b_name").default("Claude 3 Opus"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comparisons = pgTable("comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatSessionId: varchar("chat_session_id").references(() => chatSessions.id),
  winner: text("winner").notNull(), // 'modelA' or 'modelB'
  modelARating: integer("model_a_rating"),
  modelBRating: integer("model_b_rating"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  prompt: true,
  modelAResponse: true,
  modelBResponse: true,
  modelAName: true,
  modelBName: true,
});

export const insertComparisonSchema = createInsertSchema(comparisons).pick({
  chatSessionId: true,
  winner: true,
  modelARating: true,
  modelBRating: true,
  userId: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertComparison = z.infer<typeof insertComparisonSchema>;
export type Comparison = typeof comparisons.$inferSelect;

// Keep existing user schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
