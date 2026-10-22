import fs from 'fs';
import path from 'path';
import type {
  Unit,
  Source,
  SourceChunk,
  Objective,
  ObjectiveContract,
  Asset,
  Question,
  QualityCheck,
  VersionRecord,
  Approval,
  ActivityLog,
  AlignmentMatrixRow,
} from '../src/types/index.ts';

// On Vercel the project root is read-only; use /tmp for writable storage.
// Everywhere else (dev, Railway, Render) use the local .data/ directory.
const DATA_DIR = process.env.VERCEL
  ? '/tmp/learnsmith-data'
  : path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'eduforge-store.json');

interface DatabaseStore {
  units: Record<string, Unit>;
  sources: Record<string, Source>;
  sourceChunks: Record<string, SourceChunk[]>; // unitId -> chunks
  objectives: Record<string, Objective[]>; // unitId -> objectives
  contracts: Record<string, ObjectiveContract>; // unitId -> contract
  assets: Record<string, Asset>; // assetId -> asset
  questions: Record<string, Question>; // questionId -> question
  qualityChecks: Record<string, QualityCheck[]>; // unitId -> checks
  versions: Record<string, VersionRecord[]>; // unitId -> version records
  approvals: Record<string, Approval[]>; // assetId -> approvals
  activityLogs: Record<string, ActivityLog[]>; // unitId -> logs
}

function getInitialStore(): DatabaseStore {
  return {
    units: {},
    sources: {},
    sourceChunks: {},
    objectives: {},
    contracts: {},
    assets: {},
    questions: {},
    qualityChecks: {},
    versions: {},
    approvals: {},
    activityLogs: {},
  };
}

class Database {
  private store: DatabaseStore;

  constructor() {
    this.ensureDataDir();
    this.store = this.load();
    if (Object.keys(this.store.units).length === 0) {
      this.seedDemoData();
    }
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseStore {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const saved = JSON.parse(raw) as Partial<DatabaseStore>;
        const initial = getInitialStore();
        return {
          ...initial,
          ...saved,
          units: saved.units || initial.units,
          sources: saved.sources || initial.sources,
          sourceChunks: saved.sourceChunks || initial.sourceChunks,
          objectives: saved.objectives || initial.objectives,
          contracts: saved.contracts || initial.contracts,
          assets: saved.assets || initial.assets,
          questions: saved.questions || initial.questions,
          qualityChecks: saved.qualityChecks || initial.qualityChecks,
          versions: saved.versions || initial.versions,
          approvals: saved.approvals || initial.approvals,
          activityLogs: saved.activityLogs || initial.activityLogs,
        };
      }
    } catch (err) {
      console.error('Failed to load database file, initializing clean store:', err);
    }
    return getInitialStore();
  }

  private save() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  // --- UNITS ---
  public getUnits(): Unit[] {
    return Object.values(this.store.units).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getUnit(id: string): Unit | undefined {
    return this.store.units[id];
  }

  public createUnit(data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Unit {
    const id = `unit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const unit: Unit = {
      ...data,
      id,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };
    this.store.units[id] = unit;
    this.store.objectives[id] = [];
    this.store.sourceChunks[id] = [];
    this.store.qualityChecks[id] = [];
    this.store.versions[id] = [];
    this.store.activityLogs[id] = [];

    // Default contract
    this.store.contracts[id] = {
      unitId: id,
      vocabularyPolicy: 'source_only',
      vocabularyTerms: [],
      maxExplanationLength: 450,
      questionCount: 5,
      answerRevealPolicy: 'never',
      practiceLevels: ['Foundation', 'Extension'],
      teacherInstructions: 'Focus on clear scientific reasoning and avoid trivia.',
    };

    this.logActivity(id, 'Created Unit', `Created unit "${unit.title}" (${unit.grade})`);
    this.save();
    return unit;
  }

  public updateUnit(id: string, updates: Partial<Unit>): Unit | undefined {
    const unit = this.store.units[id];
    if (!unit) return undefined;
    const updated: Unit = {
      ...unit,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.store.units[id] = updated;
    this.save();
    return updated;
  }

  public deleteUnit(id: string): boolean {
    if (!this.store.units[id]) return false;
    delete this.store.units[id];
    delete this.store.sources[id];
    delete this.store.sourceChunks[id];
    delete this.store.objectives[id];
    delete this.store.contracts[id];
    delete this.store.qualityChecks[id];
    delete this.store.versions[id];
    delete this.store.activityLogs[id];

    // Remove assets & questions
    for (const [assetId, asset] of Object.entries(this.store.assets)) {
      if (asset.unitId === id) {
        delete this.store.assets[assetId];
        delete this.store.approvals[assetId];
      }
    }
    for (const [qId, q] of Object.entries(this.store.questions)) {
      if (q.unitId === id) {
        delete this.store.questions[qId];
      }
    }
    this.save();
    return true;
  }

  // --- SOURCE ---
  public getSource(unitId: string): Source | undefined {
    const src = this.store.sources[unitId];
    if (src) {
      src.chunks = this.store.sourceChunks[unitId] || [];
    }
    return src;
  }

  public saveSource(
    unitId: string,
    name: string,
    type: 'pdf' | 'text',
    rawText: string,
    pageCount: number,
    chunks: Omit<SourceChunk, 'id' | 'sourceId' | 'unitId'>[],
    metadata?: {
      detectedTopics?: string[];
      detectedSubject?: string;
      detectedGrade?: string;
      suggestedTitle?: string;
      suggestedObjectives?: { code: string; text: string }[];
      verified?: boolean;
    }
  ): Source {
    const sourceId = `src_${Date.now()}`;
    const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
    const source: Source = {
      id: sourceId,
      unitId,
      name,
      type,
      rawText,
      pageCount,
      wordCount,
      status: 'ready',
      createdAt: new Date().toISOString(),
      detectedTopics: metadata?.detectedTopics,
      detectedSubject: metadata?.detectedSubject,
      detectedGrade: metadata?.detectedGrade,
      suggestedTitle: metadata?.suggestedTitle,
      suggestedObjectives: metadata?.suggestedObjectives,
      verified: metadata?.verified ?? true,
    };

    const savedChunks: SourceChunk[] = chunks.map((c, i) => ({
      ...c,
      id: `chunk_${unitId}_${c.page}_${i + 1}`,
      sourceId,
      unitId,
    }));

    this.store.sources[unitId] = source;
    this.store.sourceChunks[unitId] = savedChunks;
    source.chunks = savedChunks;

    this.logActivity(
      unitId,
      'Source Uploaded',
      `Processed ${name} (${pageCount} page${pageCount > 1 ? 's' : ''}, ${savedChunks.length} chunks, ${wordCount} words)`
    );

    this.updateUnit(unitId, {});
    this.save();
    return source;
  }

  public getSourceChunks(unitId: string): SourceChunk[] {
    return this.store.sourceChunks[unitId] || [];
  }

  // --- OBJECTIVES & CONTRACT ---
  public getObjectives(unitId: string): Objective[] {
    return this.store.objectives?.[unitId] || [];
  }

  public setObjectives(unitId: string, objectives: { code: string; text: string }[]): Objective[] {
    const now = new Date().toISOString();
    const list: Objective[] = objectives.map((o, idx) => ({
      id: `obj_${unitId}_${idx + 1}`,
      unitId,
      code: o.code || `OBJ-${String(idx + 1).padStart(2, '0')}`,
      text: o.text,
      createdAt: now,
    }));
    this.store.objectives[unitId] = list;
    this.logActivity(unitId, 'Objectives Updated', `${list.length} objectives registered`);
    this.save();
    return list;
  }

  public getContract(unitId: string): ObjectiveContract | undefined {
    return this.store.contracts[unitId];
  }

  public saveContract(contract: ObjectiveContract): ObjectiveContract {
    this.store.contracts[contract.unitId] = contract;
    this.logActivity(contract.unitId, 'Contract Updated', 'Objective contract constraints refreshed');
    this.save();
    return contract;
  }

  // --- ASSETS ---
  public getAssets(unitId: string): Asset[] {
    return Object.values(this.store.assets)
      .filter((a) => a.unitId === unitId)
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  public getAsset(assetId: string): Asset | undefined {
    return this.store.assets[assetId];
  }

  public getAssetByType(unitId: string, type: Asset['type']): Asset | undefined {
    return Object.values(this.store.assets).find(
      (a) => a.unitId === unitId && a.type === type
    );
  }

  public saveAsset(asset: Asset): Asset {
    this.store.assets[asset.id] = asset;
    this.save();
    return asset;
  }

  public updateAssetStatus(
    assetId: string,
    status: Asset['status'],
    reason?: string,
    userId: string = 'teacher_demo'
  ): Asset | undefined {
    const asset = this.store.assets[assetId];
    if (!asset) return undefined;
    asset.status = status;
    asset.updatedAt = new Date().toISOString();
    this.store.assets[assetId] = asset;

    // Record approval log
    if (!this.store.approvals[assetId]) {
      this.store.approvals[assetId] = [];
    }
    this.store.approvals[assetId].push({
      id: `appr_${Date.now()}`,
      assetId,
      status,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    });

    this.logActivity(
      asset.unitId,
      `Asset Status: ${status}`,
      `"${asset.title}" marked as ${status}${reason ? ` (${reason})` : ''}`
    );

    // Recalculate unit status
    this.recalculateUnitStatus(asset.unitId);
    this.save();
    return asset;
  }

  // --- QUESTIONS ---
  public getQuestions(unitId: string, assetId?: string): Question[] {
    return Object.values(this.store.questions)
      .filter((q) => q.unitId === unitId && (!assetId || q.assetId === assetId))
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  public getQuestion(id: string): Question | undefined {
    return this.store.questions[id];
  }

  public saveQuestion(question: Question): Question {
    this.store.questions[question.id] = question;
    this.save();
    return question;
  }

  public saveQuestions(questions: Question[]) {
    for (const q of questions) {
      this.store.questions[q.id] = q;
    }
    this.save();
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | undefined {
    const q = this.store.questions[id];
    if (!q) return undefined;
    const updated = { ...q, ...updates };
    this.store.questions[id] = updated;

    // Update parent asset if needed
    const asset = this.store.assets[q.assetId];
    if (asset && asset.content) {
      if (asset.type === 'quiz' && asset.content.questions) {
        asset.content.questions = asset.content.questions.map((item: Question) =>
          item.id === id ? updated : item
        );
      } else if (asset.type === 'practice') {
        if (asset.content.foundationQuestions) {
          asset.content.foundationQuestions = asset.content.foundationQuestions.map(
            (item: Question) => (item.id === id ? updated : item)
          );
        }
        if (asset.content.extensionQuestions) {
          asset.content.extensionQuestions = asset.content.extensionQuestions.map(
            (item: Question) => (item.id === id ? updated : item)
          );
        }
      }
      this.store.assets[q.assetId] = asset;
    }

    this.save();
    return updated;
  }

  public createQuestion(
    unitId: string,
    assetId: string,
    questionData: Partial<Question>
  ): Question {
    const asset = this.store.assets[assetId];
    const existing = this.getQuestions(unitId, assetId);
    const nextNum = existing.length + 1;
    const newId = `q_${unitId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newQ: Question = {
      id: newId,
      unitId,
      assetId,
      section: questionData.section || (asset?.type === 'practice' ? (questionData.difficulty === 'hard' ? 'extension' : 'foundation') : 'quiz'),
      questionNumber: nextNum,
      question: questionData.question || 'New networking assessment question',
      options: questionData.options || [
        'Option A',
        'Option B',
        'Option C',
        'Option D',
      ],
      correctAnswer: questionData.correctAnswer || 'Option A',
      explanation: questionData.explanation || 'Verified from curriculum source.',
      objectiveIds: questionData.objectiveIds || [this.store.objectives[unitId]?.[0]?.id || 'obj_1'],
      sourceRefs: questionData.sourceRefs || (this.store.sourceChunks[unitId]?.slice(0, 1).map(c => ({
        sourceId: c.sourceId,
        chunkId: c.id,
        page: c.page,
        snippet: c.content.slice(0, 60),
      })) || []),
      difficulty: questionData.difficulty || 'medium',
      status: 'APPROVED',
      version: 1,
    };

    this.store.questions[newId] = newQ;

    // Update parent asset content
    if (asset && asset.content) {
      if (asset.type === 'quiz') {
        if (!asset.content.questions) asset.content.questions = [];
        asset.content.questions.push(newQ);
      } else if (asset.type === 'practice') {
        if (newQ.difficulty === 'hard') {
          if (!asset.content.extensionQuestions) asset.content.extensionQuestions = [];
          asset.content.extensionQuestions.push(newQ);
        } else {
          if (!asset.content.foundationQuestions) asset.content.foundationQuestions = [];
          asset.content.foundationQuestions.push(newQ);
        }
      }
      asset.version = asset.version + 1;
      asset.updatedAt = new Date().toISOString();
      this.store.assets[assetId] = asset;
    }

    this.saveVersionRecord({
      unitId,
      questionId: newId,
      versionNumber: 1,
      content: newQ,
      changeType: 'teacher_edited',
      changeReason: 'Teacher added new question',
      createdBy: 'Teacher',
    });

    this.logActivity(unitId, 'Question Added', `Added Q${nextNum} to ${asset?.title || 'Quiz'}`);
    this.save();
    return newQ;
  }

  public deleteQuestion(unitId: string, questionId: string): boolean {
    const q = this.store.questions[questionId];
    if (!q) return false;

    const assetId = q.assetId;
    delete this.store.questions[questionId];

    // Renumber remaining questions for this asset
    const remaining = this.getQuestions(unitId, assetId);
    remaining.forEach((item, idx) => {
      item.questionNumber = idx + 1;
      this.store.questions[item.id] = item;
    });

    // Update parent asset content
    const asset = this.store.assets[assetId];
    if (asset && asset.content) {
      if (asset.type === 'quiz') {
        asset.content.questions = remaining;
      } else if (asset.type === 'practice') {
        if (asset.content.foundationQuestions) {
          asset.content.foundationQuestions = asset.content.foundationQuestions
            .filter((item: Question) => item.id !== questionId)
            .map((item: Question, idx: number) => ({ ...item, questionNumber: idx + 1 }));
        }
        if (asset.content.extensionQuestions) {
          asset.content.extensionQuestions = asset.content.extensionQuestions
            .filter((item: Question) => item.id !== questionId)
            .map((item: Question, idx: number) => ({ ...item, questionNumber: idx + 1 }));
        }
      }
      asset.version = asset.version + 1;
      asset.updatedAt = new Date().toISOString();
      this.store.assets[assetId] = asset;
    }

    this.logActivity(unitId, 'Question Deleted', `Removed Q${q.questionNumber} from ${asset?.title || 'Asset'}`);
    this.save();
    return true;
  }

  public reorderQuestions(unitId: string, assetId: string, questionIds: string[]): Question[] {
    const reordered: Question[] = [];
    questionIds.forEach((id, idx) => {
      const q = this.store.questions[id];
      if (q) {
        q.questionNumber = idx + 1;
        this.store.questions[id] = q;
        reordered.push(q);
      }
    });

    // Update parent asset content
    const asset = this.store.assets[assetId];
    if (asset && asset.content) {
      if (asset.type === 'quiz') {
        asset.content.questions = reordered;
      }
      asset.version = asset.version + 1;
      asset.updatedAt = new Date().toISOString();
      this.store.assets[assetId] = asset;
    }

    this.logActivity(unitId, 'Questions Reordered', `Updated order of ${reordered.length} questions in ${asset?.title || 'Asset'}`);
    this.save();
    return reordered;
  }

  // --- QUALITY CHECKS ---
  public getQualityChecks(unitId: string): QualityCheck[] {
    return this.store.qualityChecks[unitId] || [];
  }

  public saveQualityChecks(unitId: string, checks: QualityCheck[]): QualityCheck[] {
    this.store.qualityChecks[unitId] = checks;
    this.save();
    return checks;
  }

  public overrideQualityCheck(
    checkId: string,
    reason: string
  ): QualityCheck | undefined {
    for (const unitChecks of Object.values(this.store.qualityChecks)) {
      const match = unitChecks.find((c) => c.id === checkId);
      if (match) {
        match.overridden = true;
        match.overrideReason = reason;
        this.logActivity(match.unitId, 'Quality Override', `Override: ${match.message} (${reason})`);
        this.recalculateUnitStatus(match.unitId);
        this.save();
        return match;
      }
    }
    return undefined;
  }

  // --- VERSIONS ---
  public saveVersionRecord(record: Omit<VersionRecord, 'id' | 'createdAt'>): VersionRecord {
    const id = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const full: VersionRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
    };
    if (!this.store.versions[record.unitId]) {
      this.store.versions[record.unitId] = [];
    }
    this.store.versions[record.unitId].unshift(full);
    this.save();
    return full;
  }

  public getVersions(unitId: string, assetId?: string, questionId?: string): VersionRecord[] {
    const list = this.store.versions[unitId] || [];
    return list.filter((v) => {
      if (questionId) return v.questionId === questionId;
      if (assetId) return v.assetId === assetId;
      return true;
    });
  }

  public restoreVersion(unitId: string, versionId: string): { restored: boolean; message: string } {
    const list = this.store.versions[unitId] || [];
    const target = list.find((v) => v.id === versionId);
    if (!target) {
      return { restored: false, message: 'Version not found' };
    }

    if (target.questionId) {
      const q = this.store.questions[target.questionId];
      if (q) {
        const newVer = q.version + 1;
        const restoredQ: Question = {
          ...target.content,
          id: q.id,
          assetId: q.assetId,
          unitId: q.unitId,
          version: newVer,
          status: 'DRAFT',
        };
        this.store.questions[q.id] = restoredQ;
        this.updateQuestion(q.id, restoredQ);

        // Record version restoration
        this.saveVersionRecord({
          unitId,
          questionId: q.id,
          versionNumber: newVer,
          content: restoredQ,
          changeType: 'teacher_edited',
          changeReason: `Restored from version ${target.versionNumber}`,
          createdBy: 'teacher',
        });

        this.logActivity(unitId, 'Version Restored', `Restored question ${q.id} to v${newVer}`);
        return { restored: true, message: `Restored question ${q.id} as v${newVer}` };
      }
    } else if (target.assetId) {
      const asset = this.store.assets[target.assetId];
      if (asset) {
        const newVer = asset.version + 1;
        asset.content = target.content;
        asset.version = newVer;
        asset.status = 'DRAFT';
        asset.updatedAt = new Date().toISOString();
        asset.changeType = 'teacher_edited';
        this.store.assets[asset.id] = asset;

        this.saveVersionRecord({
          unitId,
          assetId: asset.id,
          versionNumber: newVer,
          content: target.content,
          changeType: 'teacher_edited',
          changeReason: `Restored from version ${target.versionNumber}`,
          createdBy: 'teacher',
        });

        this.logActivity(unitId, 'Version Restored', `Restored asset "${asset.title}" to v${newVer}`);
        return { restored: true, message: `Restored asset "${asset.title}" as v${newVer}` };
      }
    }

    return { restored: false, message: 'Could not restore target' };
  }

  // --- ACTIVITY LOGS ---
  public logActivity(unitId: string, action: string, details?: string) {
    if (!this.store.activityLogs[unitId]) {
      this.store.activityLogs[unitId] = [];
    }
    const log: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      unitId,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    this.store.activityLogs[unitId].unshift(log);
    // Keep max 50
    if (this.store.activityLogs[unitId].length > 50) {
      this.store.activityLogs[unitId].pop();
    }
  }

  public getActivityLogs(unitId: string): ActivityLog[] {
    return this.store.activityLogs[unitId] || [];
  }

  // --- UNIT STATUS RECALCULATION ---
  public recalculateUnitStatus(unitId: string) {
    const unit = this.store.units[unitId];
    if (!unit) return;

    const assets = this.getAssets(unitId);
    if (assets.length < 5) {
      unit.status = assets.length > 0 ? 'REVIEW' : 'DRAFT';
      this.store.units[unitId] = unit;
      return;
    }

    const allApproved = assets.every((a) => a.status === 'APPROVED');
    const hasRejected = assets.some((a) => a.status === 'REJECTED' || a.status === 'NEEDS_REVISION');
    const checks = this.getQualityChecks(unitId);
    const hasUnresolvedFails = checks.some(
      (c) => c.severity === 'fail' && !c.overridden
    );

    if (allApproved && !hasUnresolvedFails) {
      unit.status = 'READY';
    } else if (hasRejected) {
      unit.status = 'REVIEW';
    } else {
      unit.status = 'REVIEW';
    }
    this.store.units[unitId] = unit;
  }

  // --- ALIGNMENT MATRIX ---
  public getAlignmentMap(unitId: string): AlignmentMatrixRow[] {
    const objectives = this.getObjectives(unitId);
    const assets = this.getAssets(unitId);
    const questions = this.getQuestions(unitId);
    const rows: AlignmentMatrixRow[] = [];

    // Explanation
    const explanation = assets.find((a) => a.type === 'explanation');
    if (explanation) {
      const cov: Record<string, boolean> = {};
      objectives.forEach((o) => {
        cov[o.id] = explanation.objectiveIds.includes(o.id);
      });
      rows.push({
        itemId: explanation.id,
        itemType: 'Concept Explanation',
        itemLabel: explanation.title,
        objectiveCoverage: cov,
        sourcePages: [1, 2],
        isOrphan: explanation.objectiveIds.length === 0,
      });
    }

    // Worked Example
    const example = assets.find((a) => a.type === 'worked_example');
    if (example) {
      const cov: Record<string, boolean> = {};
      objectives.forEach((o) => {
        cov[o.id] = example.objectiveIds.includes(o.id);
      });
      rows.push({
        itemId: example.id,
        itemType: 'Worked Example',
        itemLabel: example.title,
        objectiveCoverage: cov,
        sourcePages: [2],
        isOrphan: example.objectiveIds.length === 0,
      });
    }

    // Questions
    for (const q of questions) {
      const cov: Record<string, boolean> = {};
      objectives.forEach((o) => {
        cov[o.id] = q.objectiveIds.includes(o.id);
      });
      const pages = Array.from(new Set(q.sourceRefs.map((s) => s.page))).filter(Boolean);
      rows.push({
        itemId: q.id,
        itemType: q.section === 'quiz' ? 'Quiz Question' : `Practice (${q.section})`,
        itemLabel: `Q${q.questionNumber}: ${q.question.substring(0, 50)}...`,
        objectiveCoverage: cov,
        sourcePages: pages.length > 0 ? pages : [1],
        isOrphan: q.objectiveIds.length === 0,
      });
    }

    // Revision Sheet
    const revision = assets.find((a) => a.type === 'revision');
    if (revision) {
      const cov: Record<string, boolean> = {};
      objectives.forEach((o) => {
        cov[o.id] = revision.objectiveIds.includes(o.id);
      });
      rows.push({
        itemId: revision.id,
        itemType: 'Revision Sheet',
        itemLabel: revision.title,
        objectiveCoverage: cov,
        sourcePages: [1, 2, 3],
        isOrphan: revision.objectiveIds.length === 0,
      });
    }

    return rows;
  }

  // --- SEED DEMO UNIT (Networking Fundamentals – Grade 10) ---
  public seedDemoData() {
    const unitId = 'unit_demo_networking';
    const now = new Date().toISOString();

    const unit: Unit = {
      id: unitId,
      title: 'Networking Fundamentals – Grade 10',
      subject: 'Computer Science / Networking',
      grade: 'Grade 10',
      learnerDescription: 'Grade 10 computer science students covering computer networks, topologies, protocols, and network security.',
      difficulty: 'medium',
      status: 'REVIEW',
      createdAt: now,
      updatedAt: now,
    };
    this.store.units[unitId] = unit;

    // Objectives
    const obj1 = {
      id: `obj_${unitId}_1`,
      unitId,
      code: 'OBJ-01',
      text: 'Analyze computer network architectures, network devices, and LAN/MAN/WAN topologies.',
      createdAt: now,
    };
    const obj2 = {
      id: `obj_${unitId}_2`,
      unitId,
      code: 'OBJ-02',
      text: 'Differentiate packet switching, routing, and switching across TCP/IP, DNS, and DHCP protocols.',
      createdAt: now,
    };
    const obj3 = {
      id: `obj_${unitId}_3`,
      unitId,
      code: 'OBJ-03',
      text: 'Evaluate network security mechanisms including encryption, authentication, error detection, and bandwidth/latency metrics.',
      createdAt: now,
    };
    this.store.objectives[unitId] = [obj1, obj2, obj3];

    // Contract
    this.store.contracts[unitId] = {
      unitId,
      vocabularyPolicy: 'source_only',
      vocabularyTerms: [
        'computer networks',
        'packet switching',
        'routing',
        'switching',
        'IP addressing',
        'DNS',
        'TCP/IP',
        'encryption',
        'bandwidth',
        'latency',
      ],
      maxExplanationLength: 450,
      questionCount: 4,
      answerRevealPolicy: 'never',
      practiceLevels: ['Foundation', 'Extension'],
      teacherInstructions:
        'Focus on clear networking models and real-world packet transmission without relying on external domains.',
    };

    // Source & Chunks: Networking Fundamentals
    const rawDemoSource = `A computer network is an interconnected collection of autonomous computing devices capable of exchanging data and sharing digital resources through wired or wireless communication channels. Key hardware network devices include network interface cards (NICs), switches, routers, modems, and wireless access points. Networks are classified by geographic scope into Local Area Networks (LANs), Metropolitan Area Networks (MANs), and Wide Area Networks (WANs). Common physical and logical network topologies include star, bus, ring, and mesh configurations, with the star topology being the predominant design in modern Ethernet deployments due to its fault isolation properties.

Modern digital telecommunications rely primarily on packet switching rather than circuit switching. In packet-switched networks, user data is divided into manageable discrete blocks called packets, each formatted with headers containing source and destination IP addresses, sequencing information, and error-checking checksums. Routers inspect destination IP addresses and consult dynamic routing tables to forward packets across intermediate network segments toward their destination. Layer 2 switches forward frames based on Media Access Control (MAC) hardware addresses within local subnets. IP addressing provides hierarchical logical addressing via IPv4 (32-bit dotted-decimal notation) or IPv6 (128-bit hexadecimal notation), while the Domain Name System (DNS) translates human-readable domain names into numerical IP addresses. Error detection mechanisms like checksums and Cyclic Redundancy Checks (CRC) detect bit errors caused by channel noise.

Network protocols standardize rules for syntactic framing, timing, and error handling. The TCP/IP protocol suite defines essential layers: application layer protocols like HTTP and HTTPS facilitate web document delivery, while the Dynamic Host Configuration Protocol (DHCP) automatically assigns IP addresses and subnet masks to network clients. The Transmission Control Protocol (TCP) ensures reliable, connection-oriented data transfer through sequence acknowledgments, whereas User Datagram Protocol (UDP) offers lightweight, connectionless transport. Network security principles demand robust defenses against unauthorized interception: encryption converts plaintext data into ciphertext using cryptographic ciphers, authentication validates host identities, and access control lists (ACLs) restrict unauthorized network entry. Network performance is quantified by bandwidth (data transfer capacity in bits per second), latency (round-trip transit delay), and packet loss.`;

    const detectedTopics = [
      'Computer Networks',
      'Network Devices',
      'LAN, MAN, WAN',
      'Network Topologies',
      'Wired & Wireless Networking',
      'Packet Switching',
      'Routing & Switching',
      'IP Addressing',
      'DNS',
      'Error Detection & Checksums',
      'Encryption & Authentication',
      'Access Control',
      'Network Protocols (TCP/IP, DHCP, HTTP/HTTPS)',
      'Network Security',
      'Bandwidth, Latency & Packet Loss',
    ];

    const source: Source = {
      id: `src_${unitId}`,
      unitId,
      name: 'Networking_Fundamentals_and_Techniques_Grade_10.pdf',
      type: 'pdf',
      pageCount: 3,
      wordCount: 360,
      rawText: rawDemoSource,
      status: 'ready',
      createdAt: now,
      detectedTopics,
      detectedSubject: 'Computer Science / Networking',
      detectedGrade: 'Grade 10',
      suggestedTitle: 'Networking Fundamentals – Grade 10',
      verified: true,
    };
    this.store.sources[unitId] = source;

    const chunk1: SourceChunk = {
      id: `chunk_${unitId}_1_1`,
      sourceId: source.id,
      unitId,
      page: 1,
      chunkIndex: 0,
      content: rawDemoSource.split('\n\n')[0],
      wordCount: 105,
    };
    const chunk2: SourceChunk = {
      id: `chunk_${unitId}_2_1`,
      sourceId: source.id,
      unitId,
      page: 2,
      chunkIndex: 1,
      content: rawDemoSource.split('\n\n')[1],
      wordCount: 135,
    };
    const chunk3: SourceChunk = {
      id: `chunk_${unitId}_3_1`,
      sourceId: source.id,
      unitId,
      page: 3,
      chunkIndex: 2,
      content: rawDemoSource.split('\n\n')[2],
      wordCount: 120,
    };
    this.store.sourceChunks[unitId] = [chunk1, chunk2, chunk3];
    source.chunks = [chunk1, chunk2, chunk3];

    // Asset 1: Explanation
    const explanationAsset: Asset = {
      id: `asset_${unitId}_exp`,
      unitId,
      type: 'explanation',
      title: 'Core Concept: Computer Networks, Architecture & Protocols',
      status: 'APPROVED',
      version: 1,
      content: {
        title: 'Computer Networks, Architecture & Protocols',
        summary: 'A foundational study of network hardware, LAN/WAN topologies, packet switching, IP addressing, and communication protocols.',
        fullExplanation: `A computer network links independent computers to exchange data and share resources. Local networks (LANs) connect devices in close geographic proximity such as a single classroom or building, while Wide Area Networks (WANs) span cities or global continents. In modern networks, data is transmitted via packet switching: large files are broken into discrete packets carrying source and destination IP addresses. Routers direct these packets along optimal paths across the internet, while switches forward frames within local subnet boundaries. Protocol standards such as TCP/IP ensure that data reaches its destination reliably, while DNS seamlessly maps human-readable names to IP addresses. Network security incorporates encryption to protect data confidentiality, authentication to confirm identity, and error detection checksums to guarantee transmission fidelity.`,
        keyIdeas: [
          'Networks are classified by scale (LAN, MAN, WAN) and topology (Star, Mesh, Bus).',
          'Packet switching fragments data into numbered packets containing IP headers and checksums.',
          'Routers operate at Layer 3 to direct traffic between networks; switches operate within local LANs.',
          'Network performance depends on bandwidth (throughput capacity), latency (delay), and packet loss.',
        ],
        keyVocabulary: [
          { term: 'Packet Switching', definition: 'The process of grouping data into packets that are transmitted independently across digital networks.' },
          { term: 'Router', definition: 'A network device that forwards data packets between different computer networks using IP addresses.' },
          { term: 'DNS (Domain Name System)', definition: 'A hierarchical naming system that translates human-friendly domain names into numerical IP addresses.' },
          { term: 'Latency', definition: 'The total time elapsed for a data packet to travel from source to destination across a network.' },
        ],
        groundingClaims: [
          { claim: 'Networks are classified into LAN, MAN, and WAN based on geographic scope.', status: 'SUPPORTED', sourcePage: 1, sourceChunkId: chunk1.id },
          { claim: 'Packet switching breaks data into packets with source and destination IP headers.', status: 'SUPPORTED', sourcePage: 2, sourceChunkId: chunk2.id },
          { claim: 'DNS translates domain names into numerical IP addresses for routing.', status: 'SUPPORTED', sourcePage: 2, sourceChunkId: chunk2.id },
        ],
      },
      objectiveIds: [obj1.id, obj2.id, obj3.id],
      sourceChunkIds: [chunk1.id, chunk2.id],
      model: 'meta/llama-3.3-70b-instruct',
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    this.store.assets[explanationAsset.id] = explanationAsset;

    // Asset 2: Worked Example
    const exampleAsset: Asset = {
      id: `asset_${unitId}_ex`,
      unitId,
      type: 'worked_example',
      title: 'Guided Problem: Tracing a Web Request from Client to Server',
      status: 'APPROVED',
      version: 1,
      content: {
        title: 'Tracing a Web Request Through Network Layers',
        scenarioProblem: 'A student in a high school computer lab enters a website address into their browser. Trace how network devices, DNS, IP addressing, and packet switching deliver the web page back to their screen.',
        guidedSteps: [
          {
            stepNumber: 1,
            title: 'Domain Name Resolution (DNS)',
            explanation: 'The client computer queries a DNS server to translate the human-readable web address into the destination server numerical IP address.',
            sourceRefSnippet: 'Page 2: DNS translates human-readable domain names into numerical IP addresses.',
          },
          {
            stepNumber: 2,
            title: 'Packetization & Local Switching',
            explanation: 'The operating system formats the HTTP/HTTPS request into TCP packets and appends IP headers. The local switch forwards frames to the school gateway router.',
            sourceRefSnippet: 'Page 2: User data is divided into packets formatted with source and destination IP headers.',
          },
          {
            stepNumber: 3,
            title: 'Inter-Network Routing across the WAN',
            explanation: 'The router examines destination IP addresses and consults dynamic routing tables to forward the packets across intermediate WAN networks to the web server.',
            sourceRefSnippet: 'Page 2: Routers inspect destination IP addresses and consult routing tables to forward packets.',
          },
          {
            stepNumber: 4,
            title: 'Transport Layer Reassembly & Error Checking',
            explanation: 'The receiving server verifies error-detection checksums, reassembles the packets in sequence using TCP, and responds with the requested web page data.',
            sourceRefSnippet: 'Page 3: TCP ensures reliable, connection-oriented data transfer through sequence acknowledgments.',
          },
        ],
        solutionSummary: 'The web request is resolved via DNS, segmented into IP packets, switched locally, routed across the WAN, and reliably reassembled via TCP.',
        commonMisconceptions: [
          {
            misconception: 'The web page travels through a continuous unbroken physical cable connection reserved exclusively for that user.',
            correction: 'Modern networks use packet switching where packets share transmission lines dynamically with other traffic.',
          },
          {
            misconception: 'Routers and switches perform the exact same function.',
            correction: 'Switches connect devices inside a local LAN; routers interconnect entirely different networks using IP routing.',
          },
        ],
      },
      objectiveIds: [obj1.id, obj2.id, obj3.id],
      sourceChunkIds: [chunk1.id, chunk2.id, chunk3.id],
      model: 'meta/llama-3.3-70b-instruct',
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    this.store.assets[exampleAsset.id] = exampleAsset;

    // Asset 3: Quiz Questions
    const q1: Question = {
      id: `q_${unitId}_1`,
      assetId: `asset_${unitId}_quiz`,
      unitId,
      section: 'quiz',
      questionNumber: 1,
      question: 'Which network device is primarily responsible for inspecting destination IP addresses and forwarding packets between distinct networks?',
      options: ['Router', 'Hub', 'Network Interface Card (NIC)', 'Unmanaged Switch'],
      correctAnswer: 'Router',
      explanation: 'According to page 2 of the source material, routers inspect destination IP addresses and consult routing tables to forward packets across networks.',
      hints: ['Think of the Layer 3 device that interconnects different networks.'],
      difficulty: 'easy',
      objectiveIds: [obj1.id],
      sourceRefs: [{ sourceId: source.id, page: 2, chunkId: chunk2.id }],
      version: 1,
      status: 'APPROVED',
    };

    const q2: Question = {
      id: `q_${unitId}_2`,
      assetId: `asset_${unitId}_quiz`,
      unitId,
      section: 'quiz',
      questionNumber: 2,
      question: 'What is the primary function of the Domain Name System (DNS) in computer networking?',
      options: [
        'Translating human-readable domain names into numerical IP addresses',
        'Assigning dynamic IP addresses to newly connected client computers',
        'Encrypting packets as they travel across public communication cables',
        'Physically connecting copper Ethernet cables to fiber optic backbones',
      ],
      correctAnswer: 'Translating human-readable domain names into numerical IP addresses',
      explanation: 'Source passage on page 2 states that DNS translates human-readable domain names into numerical IP addresses for routing.',
      hints: ['Consider how browsers find the numerical server address.'],
      difficulty: 'medium',
      objectiveIds: [obj2.id],
      sourceRefs: [{ sourceId: source.id, page: 2, chunkId: chunk2.id }],
      version: 1,
      status: 'APPROVED',
    };

    const q3: Question = {
      id: `q_${unitId}_3`,
      assetId: `asset_${unitId}_quiz`,
      unitId,
      section: 'quiz',
      questionNumber: 3,
      question: 'Why is the star topology the predominant architecture used in modern local area network (LAN) installations?',
      options: [
        'A single cable failure at a workstation node does not bring down the entire network',
        'It requires no central device such as a switch or hub',
        'It eliminates the need for IP addressing and routing protocols',
        'It uses zero electrical power during high-bandwidth packet transmission',
      ],
      correctAnswer: 'A single cable failure at a workstation node does not bring down the entire network',
      explanation: 'Star topology offers superior fault isolation because each device connects directly to a central switch, preventing single points of cable failure (Source page 1).',
      hints: ['What happens when one node cable is disconnected in a star configuration?'],
      difficulty: 'medium',
      objectiveIds: [obj1.id],
      sourceRefs: [{ sourceId: source.id, page: 1, chunkId: chunk1.id }],
      version: 1,
      status: 'APPROVED',
    };

    const q4: Question = {
      id: `q_${unitId}_4`,
      assetId: `asset_${unitId}_quiz`,
      unitId,
      section: 'quiz',
      questionNumber: 4,
      question: 'Which network performance metric measures the total round-trip time delay required for data to travel across a network path?',
      options: ['Latency', 'Bandwidth', 'Throughput', 'Subnet Mask'],
      correctAnswer: 'Latency',
      explanation: 'Page 3 defines latency as the transit delay for packets to travel from source to destination across a network path.',
      hints: ['The measurement of transit delay or lag in communications.'],
      difficulty: 'medium',
      objectiveIds: [obj3.id],
      sourceRefs: [{ sourceId: source.id, page: 3, chunkId: chunk3.id }],
      version: 1,
      status: 'NEEDS_REVISION',
    };

    const quizAsset: Asset = {
      id: `asset_${unitId}_quiz`,
      unitId,
      type: 'quiz',
      title: 'Formative Assessment: Networking Fundamentals Mastery Quiz',
      status: 'NEEDS_REVISION',
      version: 1,
      content: {
        title: 'Networking Fundamentals Mastery Quiz',
        instructions: 'Choose the correct technical answer based on computer networking principles.',
        questions: [q1, q2, q3, q4],
        answerKeySummary: [
          { questionId: q1.id, questionNumber: 1, answer: 'Router', rationale: 'Forwards packets between networks using IP addresses.' },
          { questionId: q2.id, questionNumber: 2, answer: 'Translating human-readable domain names into numerical IP addresses', rationale: 'DNS name resolution.' },
          { questionId: q3.id, questionNumber: 3, answer: 'A single cable failure at a workstation node does not bring down the entire network', rationale: 'Fault isolation in star topologies.' },
          { questionId: q4.id, questionNumber: 4, answer: 'Latency', rationale: 'Transit delay measurement.' },
        ],
      },
      objectiveIds: [obj1.id, obj2.id, obj3.id],
      sourceChunkIds: [chunk1.id, chunk2.id, chunk3.id],
      model: 'meta/llama-3.3-70b-instruct',
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    this.store.assets[quizAsset.id] = quizAsset;
    this.store.questions[q1.id] = q1;
    this.store.questions[q2.id] = q2;
    this.store.questions[q3.id] = q3;
    this.store.questions[q4.id] = q4;

    // Asset 4: Differentiated Practice
    const pracQ1: Question = {
      id: `q_${unitId}_prac_1`,
      assetId: `asset_${unitId}_prac`,
      unitId,
      section: 'foundation',
      questionNumber: 1,
      question: 'Which protocol is responsible for automatically assigning dynamic IP addresses and configuration parameters to client devices on a local network?',
      options: ['DHCP', 'HTTP', 'DNS', 'FTP'],
      correctAnswer: 'DHCP',
      explanation: 'Page 3 explains that the Dynamic Host Configuration Protocol (DHCP) automatically assigns IP addresses and subnet masks to network clients.',
      difficulty: 'easy',
      objectiveIds: [obj2.id],
      sourceRefs: [{ sourceId: source.id, page: 3, chunkId: chunk3.id }],
      version: 1,
      status: 'APPROVED',
    };

    const pracQ2: Question = {
      id: `q_${unitId}_prac_2`,
      assetId: `asset_${unitId}_prac`,
      unitId,
      section: 'extension',
      questionNumber: 2,
      question: 'An enterprise network experiences a sudden spike in packet loss and jitter during peak operational hours. Which mechanism would most directly ensure data integrity across an unreliable connection?',
      options: [
        'TCP sequence acknowledgments and retransmissions',
        'Replacing all star topologies with bus topologies',
        'Disabling DNS servers on all workstations',
        'Switching from fiber optic cabling to coaxial cables',
      ],
      correctAnswer: 'TCP sequence acknowledgments and retransmissions',
      explanation: 'TCP ensures reliable transport by requiring receiver acknowledgments for received packets and automatically retransmitting missing segments (Page 3).',
      difficulty: 'hard',
      objectiveIds: [obj2.id, obj3.id],
      sourceRefs: [{ sourceId: source.id, page: 3, chunkId: chunk3.id }],
      version: 1,
      status: 'APPROVED',
    };

    const practiceAsset: Asset = {
      id: `asset_${unitId}_prac`,
      unitId,
      type: 'practice',
      title: 'Tiered Practice: Foundation & Extension Challenges',
      status: 'APPROVED',
      version: 1,
      content: {
        title: 'Tiered Practice Exercises',
        foundationQuestions: [pracQ1],
        extensionQuestions: [pracQ2],
      },
      objectiveIds: [obj2.id, obj3.id],
      sourceChunkIds: [chunk1.id, chunk2.id, chunk3.id],
      model: 'meta/llama-3.3-70b-instruct',
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    this.store.assets[practiceAsset.id] = practiceAsset;
    this.store.questions[pracQ1.id] = pracQ1;
    this.store.questions[pracQ2.id] = pracQ2;

    // Asset 5: Revision Sheet
    const revisionAsset: Asset = {
      id: `asset_${unitId}_rev`,
      unitId,
      type: 'revision',
      title: 'Quick Revision Sheet: Networking Fundamentals High-Yield Dossier',
      status: 'APPROVED',
      version: 1,
      content: {
        title: 'Networking Fundamentals High-Yield Revision Sheet',
        coreSummary: 'Computer networks enable distributed computing through packet switching, IP routing, and standardized protocols. Key topics include LAN/WAN scales, star topologies, Layer 2/3 hardware, DNS resolution, and TCP/IP security controls.',
        keyTerms: [
          { term: 'LAN vs WAN', explanation: 'LAN covers local proximity (school, office); WAN spans extensive geographic distances across service providers.', relatedConcepts: ['Network Scale', 'Topology'] },
          { term: 'Router vs Switch', explanation: 'Switches forward frames inside LANs using MAC addresses; routers forward packets between networks using IP addresses.', relatedConcepts: ['Packet Switching', 'Routing Tables'] },
          { term: 'TCP vs UDP', explanation: 'TCP provides reliable connection-oriented transport; UDP offers lightweight connectionless speed.', relatedConcepts: ['Protocols', 'Packet Delivery'] },
          { term: 'Encryption', explanation: 'Cryptographic transformation of plaintext into ciphertext to prevent unauthorized eavesdropping.', relatedConcepts: ['Network Security', 'Authentication'] },
        ],
        criticalRelationships: [
          { conceptA: 'Routers', relationship: 'consult dynamic routing tables to forward packets between', conceptB: 'Distinct IP Networks' },
          { conceptA: 'DNS Servers', relationship: 'translate human-readable URLs into', conceptB: 'Numerical IP Addresses' },
          { conceptA: 'Checksums & CRC', relationship: 'detect transmission errors caused by', conceptB: 'Physical Channel Noise' },
        ],
        essentialFormulasOrRules: [
          'Packet Rule: Packets contain payload data along with header information (source IP, destination IP, sequence number, checksum).',
          'Addressing Rule: Layer 2 uses hardware MAC addresses; Layer 3 uses logical IP addresses.',
          'Performance Rule: Throughput is bounded by bandwidth, and user responsiveness is impacted by round-trip latency.',
        ],
        groundingClaims: [
          { claim: 'Routers use IP routing tables to direct packets across intermediate segments.', status: 'SUPPORTED', sourcePage: 2, sourceChunkId: chunk2.id },
          { claim: 'DNS translates domain names into numerical IP addresses.', status: 'SUPPORTED', sourcePage: 2, sourceChunkId: chunk2.id },
          { claim: 'TCP enforces reliability through acknowledgments and packet sequencing.', status: 'SUPPORTED', sourcePage: 3, sourceChunkId: chunk3.id },
        ],
      },
      objectiveIds: [obj1.id, obj2.id, obj3.id],
      sourceChunkIds: [chunk1.id, chunk2.id, chunk3.id],
      model: 'meta/llama-3.3-70b-instruct',
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    this.store.assets[revisionAsset.id] = revisionAsset;

    // Initial Quality Checks
    const check1: QualityCheck = {
      id: `qc_${unitId}_1`,
      unitId,
      checkType: 'objective_coverage',
      severity: 'none',
      status: 'passed',
      message: '100% Objective Coverage Verified',
      details: 'All defined learning objectives (OBJ-01, OBJ-02, OBJ-03) are represented across explanation, examples, formative quiz, and practice.',
      createdAt: now,
    };

    const check2: QualityCheck = {
      id: `qc_${unitId}_2`,
      unitId,
      checkType: 'answer_key_consistency',
      severity: 'none',
      status: 'passed',
      message: 'Answer Key Perfectly Aligned',
      details: 'All multiple choice questions match their respective answer keys deterministically.',
      createdAt: now,
    };

    const check3: QualityCheck = {
      id: `qc_${unitId}_3`,
      unitId,
      checkType: 'duplicate_questions',
      severity: 'warning',
      status: 'warning',
      message: 'Potential Near-Duplicate Question Detected',
      details: 'Quiz Q4 and practice problem test network performance metrics with related phrasing.',
      evidence: 'Q4: "Which network performance metric measures the total round-trip time delay..." vs Practice: "...experiences a sudden spike in packet loss and jitter".',
      suggestedAction: 'Review or regenerate Q4 with an application-oriented scenario.',
      createdAt: now,
    };

    const check4: QualityCheck = {
      id: `qc_${unitId}_4`,
      unitId,
      checkType: 'answer_leakage',
      severity: 'none',
      status: 'passed',
      message: 'No Answer Leakage Found',
      details: 'Questions do not give away solutions in preceding text or option stems.',
      createdAt: now,
    };

    const check5: QualityCheck = {
      id: `qc_${unitId}_5`,
      unitId,
      checkType: 'source_grounding',
      severity: 'none',
      status: 'passed',
      message: '100% Source Grounding Verified',
      details: 'All generated factual claims match verified text passages on pages 1, 2, and 3.',
      createdAt: now,
    };

    const check6: QualityCheck = {
      id: `qc_${unitId}_6`,
      unitId,
      checkType: 'difficulty_mismatch',
      severity: 'none',
      status: 'passed',
      message: 'Appropriate Grade 10 Difficulty',
      details: 'Content maintains secondary school rigor across network hardware, protocols, and security principles without university mathematical proofs.',
      createdAt: now,
    };

    const check7: QualityCheck = {
      id: `qc_${unitId}_7`,
      unitId,
      checkType: 'cross_artifact_consistency',
      severity: 'none',
      status: 'passed',
      message: 'Cross-Artifact Terminology Consistent',
      details: 'All 5 assets use identical verified terminology: "packet switching", "routing", "IP addressing", "DNS", "TCP/IP".',
      createdAt: now,
    };

    this.store.qualityChecks[unitId] = [check1, check2, check3, check4, check5, check6, check7];

    // Initial Version Records
    this.saveVersionRecord({
      unitId,
      assetId: explanationAsset.id,
      versionNumber: 1,
      content: explanationAsset.content,
      changeType: 'ai_generated',
      changeReason: 'Initial learning pack generation',
      createdBy: 'LearnSmith Pipeline',
    });
    this.saveVersionRecord({
      unitId,
      questionId: q4.id,
      versionNumber: 1,
      content: q4,
      changeType: 'ai_generated',
      changeReason: 'Initial quiz generation',
      createdBy: 'LearnSmith Pipeline',
    });

    // Activity Log
    this.logActivity(unitId, 'Demo Unit Initialized', 'Loaded comprehensive Networking Fundamentals Grade 10 demo learning pack');

    this.save();
  }
}

export const db = new Database();
