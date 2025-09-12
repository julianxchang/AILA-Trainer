-- =====================================
-- AI AGENT EVALUATION SYSTEM
-- PostgreSQL Database Schema
-- =====================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- GRADING DATABASE SCHEMA
-- =====================================

-- Table to store evaluation test cases for human grading
CREATE TABLE evaluation_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_name VARCHAR(255) NOT NULL,
    input_text TEXT NOT NULL,
    context_data JSONB, -- Additional context for the AI agent
    expected_behavior TEXT, -- Description of expected behavior (for human graders)
    category VARCHAR(100), -- e.g., 'reasoning', 'factual', 'creative'
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table to store AI agent responses for evaluation
CREATE TABLE agent_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_case_id UUID NOT NULL REFERENCES evaluation_test_cases(id) ON DELETE CASCADE,
    agent_version VARCHAR(50) NOT NULL, -- e.g., 'v1.2.3', 'gpt-4-turbo'
    response_text TEXT NOT NULL,
    response_metadata JSONB, -- tokens used, response time, etc.
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100), -- for grouping related evaluations
    experiment_id UUID -- for A/B testing support
);

-- Table to store human grading scores
CREATE TABLE human_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES agent_responses(id) ON DELETE CASCADE,
    grader_id VARCHAR(100) NOT NULL, -- user identifier
    score INTEGER CHECK (score >= 1 AND score <= 10),
    feedback TEXT, -- optional detailed feedback
    grading_criteria JSONB, -- breakdown of scoring criteria
    graded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    grading_session_id VARCHAR(100),
    UNIQUE(response_id, grader_id) -- prevent duplicate grading by same user
);

-- Table for A/B testing experiments
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_name VARCHAR(255) NOT NULL,
    description TEXT,
    variant_a_config JSONB, -- configuration for variant A
    variant_b_config JSONB, -- configuration for variant B
    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100)
);

-- Table to track A/B test assignments
CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES evaluation_test_cases(id) ON DELETE CASCADE,
    variant VARCHAR(10) CHECK (variant IN ('A', 'B')),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, test_case_id)
);

-- Table for A/B test comparisons (user preference)
CREATE TABLE ab_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES evaluation_test_cases(id) ON DELETE CASCADE,
    response_a_id UUID NOT NULL REFERENCES agent_responses(id) ON DELETE CASCADE,
    response_b_id UUID NOT NULL REFERENCES agent_responses(id) ON DELETE CASCADE,
    grader_id VARCHAR(100) NOT NULL,
    preferred_variant VARCHAR(10) CHECK (preferred_variant IN ('A', 'B', 'TIE')),
    comparison_notes TEXT,
    compared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, test_case_id, grader_id)
);

-- =====================================
-- TESTING DATABASE SCHEMA
-- =====================================

-- Table to store unit test cases for automated evaluation
CREATE TABLE unit_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(255) NOT NULL,
    input_text TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    test_category VARCHAR(100), -- e.g., 'regression', 'smoke', 'performance'
    priority INTEGER CHECK (priority >= 1 AND priority <= 5), -- 1 = highest
    timeout_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table to store OpenAI Eval configurations
CREATE TABLE eval_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_name VARCHAR(255) NOT NULL,
    eval_type VARCHAR(50) NOT NULL, -- e.g., 'similarity', 'classification', 'custom'
    openai_eval_id VARCHAR(255), -- OpenAI Eval ID if using predefined eval
    custom_eval_prompt TEXT, -- custom evaluation prompt
    scoring_criteria JSONB, -- detailed scoring criteria
    pass_threshold DECIMAL(5,2), -- minimum score to pass
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table to store test execution results
CREATE TABLE test_execution_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_case_id UUID NOT NULL REFERENCES unit_test_cases(id) ON DELETE CASCADE,
    eval_config_id UUID NOT NULL REFERENCES eval_configurations(id) ON DELETE CASCADE,
    agent_version VARCHAR(50) NOT NULL,
    actual_output TEXT NOT NULL,
    eval_score DECIMAL(5,2), -- score from OpenAI Eval
    pass_status BOOLEAN, -- whether test passed based on threshold
    execution_time_ms INTEGER,
    error_message TEXT, -- if test failed to execute
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    build_id VARCHAR(100), -- for tracking which build/deployment
    git_commit_hash VARCHAR(40) -- for version tracking
);

-- Table to store test suite runs
CREATE TABLE test_suite_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_name VARCHAR(255),
    agent_version VARCHAR(50) NOT NULL,
    total_tests INTEGER,
    passed_tests INTEGER,
    failed_tests INTEGER,
    average_score DECIMAL(5,2),
    run_duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    triggered_by VARCHAR(100), -- CI/CD system, user, etc.
    build_id VARCHAR(100),
    git_commit_hash VARCHAR(40),
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- Table to link test executions to suite runs
CREATE TABLE test_suite_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suite_run_id UUID NOT NULL REFERENCES test_suite_runs(id) ON DELETE CASCADE,
    test_execution_id UUID NOT NULL REFERENCES test_execution_results(id) ON DELETE CASCADE,
    execution_order INTEGER
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

-- Grading DB indexes
CREATE INDEX idx_evaluation_test_cases_category ON evaluation_test_cases(category);
CREATE INDEX idx_evaluation_test_cases_active ON evaluation_test_cases(is_active);
CREATE INDEX idx_evaluation_test_cases_created_at ON evaluation_test_cases(created_at);
CREATE INDEX idx_agent_responses_test_case ON agent_responses(test_case_id);
CREATE INDEX idx_agent_responses_version ON agent_responses(agent_version);
CREATE INDEX idx_agent_responses_experiment ON agent_responses(experiment_id);
CREATE INDEX idx_agent_responses_generated_at ON agent_responses(generated_at);
CREATE INDEX idx_human_grades_response ON human_grades(response_id);
CREATE INDEX idx_human_grades_grader ON human_grades(grader_id);
CREATE INDEX idx_human_grades_score ON human_grades(score);
CREATE INDEX idx_ab_experiments_active ON ab_experiments(is_active);
CREATE INDEX idx_ab_test_assignments_experiment ON ab_test_assignments(experiment_id);
CREATE INDEX idx_ab_comparisons_experiment ON ab_comparisons(experiment_id);

-- Testing DB indexes
CREATE INDEX idx_unit_test_cases_category ON unit_test_cases(test_category);
CREATE INDEX idx_unit_test_cases_active ON unit_test_cases(is_active);
CREATE INDEX idx_unit_test_cases_priority ON unit_test_cases(priority);
CREATE INDEX idx_test_execution_results_test_case ON test_execution_results(test_case_id);
CREATE INDEX idx_test_execution_results_version ON test_execution_results(agent_version);
CREATE INDEX idx_test_execution_results_build ON test_execution_results(build_id);
CREATE INDEX idx_test_execution_results_executed_at ON test_execution_results(executed_at);
CREATE INDEX idx_test_suite_runs_version ON test_suite_runs(agent_version);
CREATE INDEX idx_test_suite_runs_status ON test_suite_runs(status);
CREATE INDEX idx_test_suite_runs_started_at ON test_suite_runs(started_at);
CREATE INDEX idx_test_suite_executions_suite_run ON test_suite_executions(suite_run_id);

-- Composite indexes for common queries
CREATE INDEX idx_agent_responses_test_case_version ON agent_responses(test_case_id, agent_version);
CREATE INDEX idx_human_grades_response_grader ON human_grades(response_id, grader_id);
CREATE INDEX idx_test_execution_results_version_build ON test_execution_results(agent_version, build_id);

-- =====================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_evaluation_test_cases_updated_at 
    BEFORE UPDATE ON evaluation_test_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unit_test_cases_updated_at 
    BEFORE UPDATE ON unit_test_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================
-- SAMPLE DATA INSERTION
-- =====================================

-- Sample evaluation test case
INSERT INTO evaluation_test_cases (case_name, input_text, expected_behavior, category, difficulty_level, created_by) 
VALUES (
    'Basic Reasoning Test',
    'What is 2+2 and explain your reasoning?',
    'Should provide correct answer (4) with clear mathematical reasoning',
    'reasoning',
    1,
    'system'
);

-- Sample unit test case
INSERT INTO unit_test_cases (test_name, input_text, expected_output, test_category, priority, created_by)
VALUES (
    'Math Calculation Test',
    'Calculate 15 * 7',
    '105',
    'regression',
    1,
    'system'
);

-- Sample eval configuration
INSERT INTO eval_configurations (config_name, eval_type, custom_eval_prompt, pass_threshold)
VALUES (
    'Accuracy Eval',
    'similarity',
    'Rate the accuracy of the response compared to the expected output on a scale of 0-100',
    80.0
);

-- =====================================
-- USEFUL POSTGRESQL-SPECIFIC QUERIES
-- =====================================

-- Query to get grading statistics with PostgreSQL aggregation
/*
SELECT 
    etc.category,
    COUNT(hg.id) as total_grades,
    ROUND(AVG(hg.score), 2) as avg_score,
    MIN(hg.score) as min_score,
    MAX(hg.score) as max_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hg.score) as median_score
FROM evaluation_test_cases etc
JOIN agent_responses ar ON etc.id = ar.test_case_id
JOIN human_grades hg ON ar.id = hg.response_id
WHERE etc.is_active = true
GROUP BY etc.category
ORDER BY avg_score DESC;
*/

-- Query to get test execution trends using PostgreSQL date functions
/*
SELECT 
    DATE_TRUNC('day', executed_at) as execution_date,
    agent_version,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN pass_status = true THEN 1 END) as passed_tests,
    ROUND(AVG(eval_score), 2) as avg_score
FROM test_execution_results
WHERE executed_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', executed_at), agent_version
ORDER BY execution_date DESC, agent_version;
*/

-- Query to analyze A/B test results with statistical significance
/*
SELECT 
    exp.experiment_name,
    ab.preferred_variant,
    COUNT(*) as preference_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY exp.id), 2) as percentage
FROM ab_experiments exp
JOIN ab_comparisons ab ON exp.id = ab.experiment_id
WHERE exp.is_active = true
GROUP BY exp.id, exp.experiment_name, ab.preferred_variant
ORDER BY exp.experiment_name, preference_count DESC;
*/