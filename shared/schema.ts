import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
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
  modelAComment: text("model_a_comment"),
  modelBComment: text("model_b_comment"),
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
  modelAComment: true,
  modelBComment: true,
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

// Evaluation schema tables
export const evaluationTestCases = pgTable("evaluation_test_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseName: varchar("case_name", { length: 255 }).notNull(),
  inputText: text("input_text").notNull(),
  contextData: jsonb("context_data"),
  expectedBehavior: text("expected_behavior"),
  category: varchar("category", { length: 100 }),
  difficultyLevel: integer("difficulty_level"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 100 }),
  isActive: boolean("is_active").default(true),
});

export const agentResponses = pgTable("agent_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCaseId: varchar("test_case_id").references(() => evaluationTestCases.id).notNull(),
  agentVersion: varchar("agent_version", { length: 50 }).notNull(),
  responseText: text("response_text").notNull(),
  responseMetadata: jsonb("response_metadata"),
  generatedAt: timestamp("generated_at").defaultNow(),
  sessionId: varchar("session_id", { length: 100 }),
  experimentId: varchar("experiment_id"),
});

export const humanGrades = pgTable("human_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  responseId: varchar("response_id").references(() => agentResponses.id).notNull(),
  graderId: varchar("grader_id", { length: 100 }).notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  gradingCriteria: jsonb("grading_criteria"),
  gradedAt: timestamp("graded_at").defaultNow(),
  gradingSessionId: varchar("grading_session_id", { length: 100 }),
});

// Schema types for evaluation tables
export const insertEvaluationTestCaseSchema = createInsertSchema(evaluationTestCases).pick({
  caseName: true,
  inputText: true,
  contextData: true,
  expectedBehavior: true,
  category: true,
  difficultyLevel: true,
  createdBy: true,
});

export const insertAgentResponseSchema = createInsertSchema(agentResponses).pick({
  testCaseId: true,
  agentVersion: true,
  responseText: true,
  responseMetadata: true,
  sessionId: true,
  experimentId: true,
});

export const insertHumanGradeSchema = createInsertSchema(humanGrades).pick({
  responseId: true,
  graderId: true,
  score: true,
  feedback: true,
  gradingCriteria: true,
  gradingSessionId: true,
});

export type InsertEvaluationTestCase = z.infer<typeof insertEvaluationTestCaseSchema>;
export type EvaluationTestCase = typeof evaluationTestCases.$inferSelect;
export type InsertAgentResponse = z.infer<typeof insertAgentResponseSchema>;
export type AgentResponse = typeof agentResponses.$inferSelect;
export type InsertHumanGrade = z.infer<typeof insertHumanGradeSchema>;
export type HumanGrade = typeof humanGrades.$inferSelect;

// A/B Testing schema tables
export const abExperiments = pgTable("ab_experiments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentName: varchar("experiment_name", { length: 255 }).notNull(),
  description: text("description"),
  variantAConfig: jsonb("variant_a_config"),
  variantBConfig: jsonb("variant_b_config"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 100 }),
});

export const abTestAssignments = pgTable("ab_test_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").references(() => abExperiments.id).notNull(),
  testCaseId: varchar("test_case_id").references(() => evaluationTestCases.id).notNull(),
  variant: varchar("variant", { length: 10 }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

export const abComparisons = pgTable("ab_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  experimentId: varchar("experiment_id").references(() => abExperiments.id).notNull(),
  testCaseId: varchar("test_case_id").references(() => evaluationTestCases.id).notNull(),
  responseAId: varchar("response_a_id").references(() => agentResponses.id).notNull(),
  responseBId: varchar("response_b_id").references(() => agentResponses.id).notNull(),
  graderId: varchar("grader_id", { length: 100 }).notNull(),
  preferredVariant: varchar("preferred_variant", { length: 10 }),
  comparisonNotes: text("comparison_notes"),
  comparedAt: timestamp("compared_at").defaultNow(),
});

// Automated Testing schema tables
export const unitTestCases = pgTable("unit_test_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testName: varchar("test_name", { length: 255 }).notNull(),
  inputText: text("input_text").notNull(),
  expectedOutput: text("expected_output").notNull(),
  testCategory: varchar("test_category", { length: 100 }),
  priority: integer("priority"),
  timeoutSeconds: integer("timeout_seconds").default(30),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by", { length: 100 }),
  isActive: boolean("is_active").default(true),
});

export const evalConfigurations = pgTable("eval_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configName: varchar("config_name", { length: 255 }).notNull(),
  evalType: varchar("eval_type", { length: 50 }).notNull(),
  openaiEvalId: varchar("openai_eval_id", { length: 255 }),
  customEvalPrompt: text("custom_eval_prompt"),
  scoringCriteria: jsonb("scoring_criteria"),
  passThreshold: integer("pass_threshold"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const testExecutionResults = pgTable("test_execution_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCaseId: varchar("test_case_id").references(() => unitTestCases.id).notNull(),
  evalConfigId: varchar("eval_config_id").references(() => evalConfigurations.id).notNull(),
  agentVersion: varchar("agent_version", { length: 50 }).notNull(),
  actualOutput: text("actual_output").notNull(),
  evalScore: integer("eval_score"),
  passStatus: boolean("pass_status"),
  executionTimeMs: integer("execution_time_ms"),
  errorMessage: text("error_message"),
  executedAt: timestamp("executed_at").defaultNow(),
  buildId: varchar("build_id", { length: 100 }),
  gitCommitHash: varchar("git_commit_hash", { length: 40 }),
});

export const testSuiteRuns = pgTable("test_suite_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runName: varchar("run_name", { length: 255 }),
  agentVersion: varchar("agent_version", { length: 50 }).notNull(),
  totalTests: integer("total_tests"),
  passedTests: integer("passed_tests"),
  failedTests: integer("failed_tests"),
  averageScore: integer("average_score"),
  runDurationSeconds: integer("run_duration_seconds"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  triggeredBy: varchar("triggered_by", { length: 100 }),
  buildId: varchar("build_id", { length: 100 }),
  gitCommitHash: varchar("git_commit_hash", { length: 40 }),
  status: varchar("status", { length: 20 }).default("RUNNING"),
});

export const testSuiteExecutions = pgTable("test_suite_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  suiteRunId: varchar("suite_run_id").references(() => testSuiteRuns.id).notNull(),
  testExecutionId: varchar("test_execution_id").references(() => testExecutionResults.id).notNull(),
  executionOrder: integer("execution_order"),
});

// A/B Testing schema types
export const insertAbExperimentSchema = createInsertSchema(abExperiments).pick({
  experimentName: true,
  description: true,
  variantAConfig: true,
  variantBConfig: true,
  startDate: true,
  endDate: true,
  createdBy: true,
});

export const insertAbTestAssignmentSchema = createInsertSchema(abTestAssignments).pick({
  experimentId: true,
  testCaseId: true,
  variant: true,
});

export const insertAbComparisonSchema = createInsertSchema(abComparisons).pick({
  experimentId: true,
  testCaseId: true,
  responseAId: true,
  responseBId: true,
  graderId: true,
  preferredVariant: true,
  comparisonNotes: true,
});

// Automated Testing schema types
export const insertUnitTestCaseSchema = createInsertSchema(unitTestCases).pick({
  testName: true,
  inputText: true,
  expectedOutput: true,
  testCategory: true,
  priority: true,
  timeoutSeconds: true,
  createdBy: true,
});

export const insertEvalConfigurationSchema = createInsertSchema(evalConfigurations).pick({
  configName: true,
  evalType: true,
  openaiEvalId: true,
  customEvalPrompt: true,
  scoringCriteria: true,
  passThreshold: true,
});

export const insertTestExecutionResultSchema = createInsertSchema(testExecutionResults).pick({
  testCaseId: true,
  evalConfigId: true,
  agentVersion: true,
  actualOutput: true,
  evalScore: true,
  passStatus: true,
  executionTimeMs: true,
  errorMessage: true,
  buildId: true,
  gitCommitHash: true,
});

export const insertTestSuiteRunSchema = createInsertSchema(testSuiteRuns).pick({
  runName: true,
  agentVersion: true,
  totalTests: true,
  passedTests: true,
  failedTests: true,
  averageScore: true,
  runDurationSeconds: true,
  completedAt: true,
  triggeredBy: true,
  buildId: true,
  gitCommitHash: true,
  status: true,
});

export const insertTestSuiteExecutionSchema = createInsertSchema(testSuiteExecutions).pick({
  suiteRunId: true,
  testExecutionId: true,
  executionOrder: true,
});

// Export types for new tables
export type InsertAbExperiment = z.infer<typeof insertAbExperimentSchema>;
export type AbExperiment = typeof abExperiments.$inferSelect;
export type InsertAbTestAssignment = z.infer<typeof insertAbTestAssignmentSchema>;
export type AbTestAssignment = typeof abTestAssignments.$inferSelect;
export type InsertAbComparison = z.infer<typeof insertAbComparisonSchema>;
export type AbComparison = typeof abComparisons.$inferSelect;

export type InsertUnitTestCase = z.infer<typeof insertUnitTestCaseSchema>;
export type UnitTestCase = typeof unitTestCases.$inferSelect;
export type InsertEvalConfiguration = z.infer<typeof insertEvalConfigurationSchema>;
export type EvalConfiguration = typeof evalConfigurations.$inferSelect;
export type InsertTestExecutionResult = z.infer<typeof insertTestExecutionResultSchema>;
export type TestExecutionResult = typeof testExecutionResults.$inferSelect;
export type InsertTestSuiteRun = z.infer<typeof insertTestSuiteRunSchema>;
export type TestSuiteRun = typeof testSuiteRuns.$inferSelect;
export type InsertTestSuiteExecution = z.infer<typeof insertTestSuiteExecutionSchema>;
export type TestSuiteExecution = typeof testSuiteExecutions.$inferSelect;
