export type AssetType = 'explanation' | 'worked_example' | 'quiz' | 'practice' | 'revision';

export type AssetStatus = 'DRAFT' | 'NEEDS_REVISION' | 'APPROVED' | 'REJECTED';

export type UnitStatus = 'DRAFT' | 'GENERATING' | 'REVIEW' | 'READY' | 'PUBLISHED';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin' | 'student';
}

export interface Unit {
  id: string;
  title: string;
  subject: string;
  grade: string;
  learnerDescription?: string;
  difficulty: DifficultyLevel;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  unitId: string;
  page: number;
  chunkIndex: number;
  content: string;
  wordCount: number;
}

export interface Source {
  id: string;
  unitId: string;
  name: string;
  type: 'pdf' | 'text';
  fileUrl?: string;
  pageCount: number;
  wordCount: number;
  rawText: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  createdAt: string;
  chunks?: SourceChunk[];
  detectedTopics?: string[];
  detectedSubject?: string;
  detectedGrade?: string;
  suggestedTitle?: string;
  suggestedObjectives?: { code: string; text: string }[];
  verified?: boolean;
}

export interface Objective {
  id: string;
  unitId: string;
  code: string; // e.g. "OBJ-01"
  text: string;
  createdAt: string;
}

export interface ObjectiveContract {
  unitId: string;
  vocabularyPolicy: 'source_only' | 'teacher_defined' | 'flexible';
  vocabularyTerms: string[];
  maxExplanationLength: number;
  questionCount: number;
  answerRevealPolicy: 'never' | 'hints_allowed' | 'custom';
  practiceLevels: ('Foundation' | 'Standard' | 'Extension')[];
  teacherInstructions: string;
}

export interface SourceReference {
  sourceId: string;
  sourceName?: string;
  page: number;
  chunkId: string;
  snippet?: string;
}

export interface ExplanationContent {
  title: string;
  summary: string;
  fullExplanation: string;
  keyIdeas: string[];
  keyVocabulary: { term: string; definition: string }[];
  groundingClaims: {
    claim: string;
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';
    sourcePage?: number;
    sourceChunkId?: string;
  }[];
}

export interface WorkedExampleStep {
  stepNumber: number;
  title: string;
  explanation: string;
  sourceRefSnippet?: string;
}

export interface WorkedExampleContent {
  title: string;
  scenarioProblem: string;
  guidedSteps: WorkedExampleStep[];
  solutionSummary: string;
  commonMisconceptions: { misconception: string; correction: string }[];
}

export interface Question {
  id: string; // e.g. Q-001
  assetId: string;
  unitId: string;
  section: 'quiz' | 'foundation' | 'extension';
  questionNumber: number;
  question: string;
  options?: string[]; // 4 options for MCQ
  correctAnswer: string;
  explanation: string;
  hints?: string[];
  difficulty: DifficultyLevel;
  objectiveIds: string[];
  sourceRefs: SourceReference[];
  version: number;
  status: AssetStatus;
}

export interface QuizContent {
  title: string;
  instructions: string;
  questions: Question[];
  answerKeySummary?: { questionId: string; questionNumber: number; answer: string; rationale: string }[];
}

export interface PracticeContent {
  title: string;
  foundationQuestions: Question[];
  extensionQuestions: Question[];
}

export interface RevisionSheetContent {
  title: string;
  coreSummary: string;
  keyTerms: { term: string; explanation: string; relatedConcepts: string[] }[];
  criticalRelationships: { conceptA: string; relationship: string; conceptB: string }[];
  essentialFormulasOrRules: string[];
  groundingClaims: {
    claim: string;
    status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';
    sourcePage?: number;
    sourceChunkId?: string;
  }[];
}

export type AssetContent =
  | ExplanationContent
  | WorkedExampleContent
  | QuizContent
  | PracticeContent
  | RevisionSheetContent;

export interface Asset {
  id: string;
  unitId: string;
  type: AssetType;
  title: string;
  status: AssetStatus;
  version: number;
  content: any;
  objectiveIds: string[];
  sourceChunkIds: string[];
  model: string;
  changeType: 'ai_generated' | 'teacher_edited' | 'ai_regenerated';
  changeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheck {
  id: string;
  unitId: string;
  assetId?: string;
  questionId?: string;
  checkType:
    | 'objective_coverage'
    | 'answer_key_consistency'
    | 'duplicate_questions'
    | 'answer_leakage'
    | 'source_grounding'
    | 'difficulty_mismatch'
    | 'cross_artifact_consistency'
    | 'terminology_consistency';
  severity: 'none' | 'warning' | 'fail';
  status: 'passed' | 'warning' | 'failed';
  message: string;
  details: string;
  evidence?: string;
  suggestedAction?: string;
  overridden?: boolean;
  overrideReason?: string;
  createdAt: string;
}

export interface VersionRecord {
  id: string;
  unitId: string;
  assetId?: string;
  questionId?: string;
  versionNumber: number;
  content: any;
  changeType: 'ai_generated' | 'teacher_edited' | 'ai_regenerated';
  changeReason?: string;
  createdAt: string;
  createdBy: string;
}

export interface Approval {
  id: string;
  assetId: string;
  status: AssetStatus;
  userId: string;
  reason?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  unitId: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface AlignmentMatrixRow {
  itemId: string;
  itemType: string;
  itemLabel: string;
  objectiveCoverage: Record<string, boolean>; // objectiveId -> true/false
  sourcePages: number[];
  isOrphan: boolean;
}

export interface UnitOverviewSummary {
  unit: Unit;
  source?: Source;
  objectives: Objective[];
  contract?: ObjectiveContract;
  assets: Asset[];
  questions: Question[];
  qualityChecks: QualityCheck[];
  activityLogs: ActivityLog[];
  approvedAssetCount: number;
  totalAssetCount: number;
  qualityIssueCount: number;
}
