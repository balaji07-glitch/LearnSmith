import {
  Unit,
  Source,
  Objective,
  ObjectiveContract,
  Asset,
  Question,
  QualityCheck,
  VersionRecord,
  AlignmentMatrixRow,
  UnitOverviewSummary,
  ActivityLog,
} from './types/index.ts';

const API_BASE = '/api';

export const api = {
  // Units
  async getUnits(): Promise<{ units: (Unit & { assetCount: number; approvedCount: number; issuesCount: number })[] }> {
    const res = await fetch(`${API_BASE}/units`);
    if (!res.ok) throw new Error('Failed to fetch units');
    return res.json();
  },

  async getUnit(id: string): Promise<{ unit: Unit }> {
    const res = await fetch(`${API_BASE}/units/${id}`);
    if (!res.ok) throw new Error('Failed to fetch unit');
    return res.json();
  },

  async createUnit(data: {
    title: string;
    subject: string;
    grade: string;
    learnerDescription?: string;
    difficulty: string;
    objectives?: { code: string; text: string }[];
  }): Promise<{ unit: Unit }> {
    const res = await fetch(`${API_BASE}/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create unit');
    }
    return res.json();
  },

  async updateUnit(id: string, updates: Partial<Unit>): Promise<{ unit: Unit }> {
    const res = await fetch(`${API_BASE}/units/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update unit');
    return res.json();
  },

  async deleteUnit(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/units/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete unit');
    return res.json();
  },

  async loadDemoUnit(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/units/demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load demo unit');
    return res.json();
  },

  // Source
  async getSource(unitId: string): Promise<{ source: Source | null }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/source`);
    if (!res.ok) throw new Error('Failed to fetch source');
    return res.json();
  },

  async uploadSource(
    unitId: string,
    data: { name?: string; type: 'pdf' | 'text'; rawText?: string; fileBase64?: string }
  ): Promise<{ source: Source; detectedMetadata?: any }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload source');
    }
    return res.json();
  },

  async createUnitFromSource(
    data: { name?: string; type: 'pdf' | 'text'; rawText?: string; fileBase64?: string }
  ): Promise<{ unit: Unit; source: Source; detectedMetadata?: any }> {
    const res = await fetch(`${API_BASE}/units/create-from-source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create unit from source');
    }
    return res.json();
  },

  // Objectives & Contract
  async getObjectives(unitId: string): Promise<{ objectives: Objective[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/objectives`);
    if (!res.ok) throw new Error('Failed to fetch objectives');
    return res.json();
  },

  async setObjectives(
    unitId: string,
    objectives: { code?: string; text: string }[]
  ): Promise<{ objectives: Objective[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/objectives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectives }),
    });
    if (!res.ok) throw new Error('Failed to save objectives');
    return res.json();
  },

  async getContract(unitId: string): Promise<{ contract: ObjectiveContract | null }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/contract`);
    if (!res.ok) throw new Error('Failed to fetch contract');
    return res.json();
  },

  async saveContract(unitId: string, contract: Partial<ObjectiveContract>): Promise<{ contract: ObjectiveContract }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contract),
    });
    if (!res.ok) throw new Error('Failed to save contract');
    return res.json();
  },

  // Generation
  async generateLearningPack(unitId: string): Promise<{ success: boolean; message: string; assets: Asset[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate learning pack');
    }
    return res.json();
  },

  // Assets
  async getAssets(unitId: string): Promise<{ assets: Asset[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async getAsset(unitId: string, assetId: string): Promise<{ asset: Asset }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets/${assetId}`);
    if (!res.ok) throw new Error('Failed to fetch asset');
    return res.json();
  },

  async updateAsset(unitId: string, assetId: string, data: { title?: string; content: any }): Promise<{ asset: Asset }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets/${assetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update asset');
    return res.json();
  },

  async approveAsset(unitId: string, assetId: string, reason?: string): Promise<{ asset: Asset }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets/${assetId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to approve asset');
    return res.json();
  },

  async requestRevision(unitId: string, assetId: string, reason?: string): Promise<{ asset: Asset }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets/${assetId}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to request revision');
    return res.json();
  },

  // Questions
  async getQuestions(unitId: string, assetId?: string): Promise<{ questions: Question[] }> {
    const url = assetId
      ? `${API_BASE}/units/${unitId}/questions?assetId=${assetId}`
      : `${API_BASE}/units/${unitId}/questions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  async updateQuestion(unitId: string, questionId: string, updates: Partial<Question>): Promise<{ question: Question }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update question');
    return res.json();
  },

  async addQuestion(unitId: string, assetId: string, data: Partial<Question>): Promise<{ question: Question }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, assetId }),
    });
    if (!res.ok) throw new Error('Failed to add question');
    return res.json();
  },

  async generatePracticeQuestion(
    unitId: string,
    assetId: string,
    section: 'foundation' | 'extension'
  ): Promise<{ question: Question }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/assets/${assetId}/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate practice question from source');
    }
    return res.json();
  },

  async deleteQuestion(unitId: string, questionId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/questions/${questionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return res.json();
  },

  async reorderQuestions(unitId: string, assetId: string, questionIds: string[]): Promise<{ questions: Question[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/questions/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, questionIds }),
    });
    if (!res.ok) throw new Error('Failed to reorder questions');
    return res.json();
  },

  async regenerateQuestion(
    unitId: string,
    questionId: string,
    reason: string,
    instruction: string
  ): Promise<{ success: boolean; question: Question }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/questions/${questionId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, instruction }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to regenerate question');
    }
    return res.json();
  },

  // Quality
  async getQualityReport(unitId: string): Promise<{ checks: QualityCheck[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/quality`);
    if (!res.ok) throw new Error('Failed to fetch quality report');
    return res.json();
  },

  async runQualityChecks(unitId: string): Promise<{ checks: QualityCheck[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/quality/run`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run quality checks');
    return res.json();
  },

  async overrideQualityCheck(unitId: string, checkId: string, reason: string): Promise<{ check: QualityCheck }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/quality/${checkId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to override check');
    return res.json();
  },

  // Versions
  async getVersions(unitId: string, assetId?: string, questionId?: string): Promise<{ versions: VersionRecord[] }> {
    let url = `${API_BASE}/units/${unitId}/versions?`;
    if (assetId) url += `assetId=${assetId}&`;
    if (questionId) url += `questionId=${questionId}&`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async restoreVersion(unitId: string, versionId: string): Promise<{ restored: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to restore version');
    return res.json();
  },

  // Alignment
  async getAlignmentMap(unitId: string): Promise<{ matrix: AlignmentMatrixRow[]; objectives: Objective[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/alignment`);
    if (!res.ok) throw new Error('Failed to fetch alignment map');
    return res.json();
  },

  // Student Pack
  async getStudentPack(unitId: string, includeDrafts: boolean = true): Promise<{
    unit: { id: string; title: string; subject: string; grade: string };
    assets: Asset[];
    approvedCount: number;
    totalCount: number;
  }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/student?includeDrafts=${includeDrafts}`);
    if (!res.ok) throw new Error('Failed to fetch student pack');
    return res.json();
  },

  async submitStudentAssessment(
    unitId: string,
    assetId: string,
    answers: Record<string, string>
  ): Promise<{
    score: number;
    total: number;
    results: { questionId: string; correct: boolean; correctAnswer: string; explanation: string; incorrectReason: string }[];
  }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/student/assessments/${assetId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit assessment');
    }
    return res.json();
  },

  // Summary
  async getUnitSummary(unitId: string): Promise<UnitOverviewSummary> {
    const res = await fetch(`${API_BASE}/units/${unitId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch unit summary');
    return res.json();
  },

  // Activity Logs
  async getActivityLogs(unitId: string): Promise<{ logs: ActivityLog[] }> {
    const res = await fetch(`${API_BASE}/units/${unitId}/activity`);
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    return res.json();
  },
};
