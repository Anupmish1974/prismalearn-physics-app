export type PhysicsUnit = 'Electricity' | 'Light' | 'Magnetism';

export type MasteryStatus = 'Weak' | 'Developing' | 'Mastered';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type ReviewBucket = 'Today' | 'In 3 Days' | 'In 7 Days';

export type ReasoningQuality = 'sound' | 'partial' | 'flawed';

export interface PhysicsConcept {
  id: string;
  name: string;
  shortName: string;
  unit: PhysicsUnit;
  formula: string;
  description: string;
  prerequisites: string[];
  /** Normalized coordinates (0..1000 width, 0..420 height) for SVG Concept Graph */
  graphPos: { x: number; y: number };
}

export interface DiagnosticQuestion {
  id: string;
  conceptId: string;
  unit: PhysicsUnit;
  difficulty: DifficultyLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  sampleCorrectReasoning: string;
  sampleFlawedReasoning: string;
  sampleFlawedOptionIndex: number;
}

export interface TargetedQuestion {
  id: string;
  conceptId: string;
  difficulty: DifficultyLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  targetSkill: string;
  sampleThoughtHint: string;
  agentRationale: string;
}

export interface AgentReasoningTrace {
  id: string;
  timestamp: string;
  conceptId: string;
  conceptName: string;
  questionPrompt: string;
  selectedOption: string;
  correctOption: string;
  studentReasoning: string;
  isCorrect: boolean;
  reasoningQuality: ReasoningQuality;
  step1Analysis: string;
  step2Misconception: string;
  misconceptionTag: string;
  step3ModelImpact: string;
  step4Hint: string;
  masteryBefore: number;
  masteryAfter: number;
}

export interface SpacedRepetitionItem {
  conceptId: string;
  bucket: ReviewBucket;
  intervalDays: number;
  easeFactor: number;
  retentionPercent: number;
  rationale: string;
  lastReviewedLabel: string;
}

export interface StudentAttemptRecord {
  questionId: string;
  conceptId: string;
  selectedIndex: number;
  reasoning: string;
  isCorrect: boolean;
}

export interface LearnerState {
  studentId: string;
  studentName: string;
  gradeLabel: string;
  masteryByConcept: Record<string, number>;
  recentDeltas: Record<string, number>;
  diagnosticCompleted: boolean;
  diagnosticIndex: number;
  diagnosticAttempts: StudentAttemptRecord[];
  traces: AgentReasoningTrace[];
  misconceptionsByConcept: Record<string, string[]>;
  schedule: Record<string, SpacedRepetitionItem>;
  practicedCount: number;
}

export interface ClassMisconceptionSummary {
  id: string;
  tag: string;
  conceptId: string;
  conceptName: string;
  unit: PhysicsUnit;
  affectedStudents: number;
  totalStudents: number;
  diagnosticExample: string;
  recommendedIntervention: string;
}
