import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { extractTextFromPdf, parsePlainTextAsSource } from './pdf.ts';
import { detectSourceMetadataAndTopics } from './nvidia.ts';
import { orchestrateLearningPack, orchestratePracticeQuestionAddition, orchestrateQuestionRegeneration } from './orchestrator.ts';
import { executeQualityEngine } from './qualityEngine.ts';
import type { Question } from '../src/types/index.ts';

const router = Router();

// --- UNITS ---
router.get('/units', (_req: Request, res: Response) => {
  try {
    const units = db.getUnits();
    const summaries = units.map((u) => {
      const assets = db.getAssets(u.id);
      const approvedCount = assets.filter((a) => a.status === 'APPROVED').length;
      const issues = db.getQualityChecks(u.id).filter((c) => c.severity !== 'none' && !c.overridden);
      return {
        ...u,
        assetCount: assets.length,
        approvedCount,
        issuesCount: issues.length,
      };
    });
    res.json({ units: summaries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units', (req: Request, res: Response) => {
  try {
    const { title, subject, grade, learnerDescription, difficulty, objectives } = req.body;
    if (!title || !subject || !grade) {
      return res.status(400).json({ error: 'Title, subject, and grade are required.' });
    }
    const unit = db.createUnit({
      title,
      subject,
      grade,
      learnerDescription: learnerDescription || '',
      difficulty: difficulty || 'medium',
    });

    if (objectives && Array.isArray(objectives) && objectives.length > 0) {
      db.setObjectives(unit.id, objectives);
    }

    res.status(201).json({ unit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/units/:id', (req: Request, res: Response) => {
  try {
    const unit = db.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json({ unit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/units/:id', (req: Request, res: Response) => {
  try {
    const unit = db.updateUnit(req.params.id, req.body);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json({ unit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/units/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteUnit(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/demo', (_req: Request, res: Response) => {
  try {
    db.seedDemoData();
    res.json({ success: true, message: 'Demo unit initialized' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SOURCE ---
router.get('/units/:id/source', (req: Request, res: Response) => {
  try {
    const source = db.getSource(req.params.id);
    res.json({ source: source || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/source', async (req: Request, res: Response) => {
  try {
    const unitId = req.params.id;
    const { name, type, rawText, fileBase64 } = req.body;

    let extractedText = '';
    let pageCount = 1;
    let chunks: any[] = [];
    const fileName = name || (type === 'pdf' ? 'Uploaded_Curriculum.pdf' : 'Curriculum_Source_Notes');

    if (type === 'pdf' && fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const extracted = await extractTextFromPdf(buffer);
      extractedText = extracted.rawText;
      pageCount = extracted.pageCount;
      chunks = extracted.chunks;
    } else if (type === 'text' && typeof rawText === 'string' && rawText.trim()) {
      const parsed = parsePlainTextAsSource(rawText);
      extractedText = parsed.rawText;
      pageCount = parsed.pageCount;
      chunks = parsed.chunks;
    } else {
      return res.status(400).json({ error: 'Provide a valid PDF file or non-empty plain text source.' });
    }

    // Dynamic metadata and topic detection strictly from the uploaded content
    const analysis = await detectSourceMetadataAndTopics(extractedText, fileName);

    const source = db.saveSource(
      unitId,
      fileName,
      type === 'pdf' ? 'pdf' : 'text',
      extractedText,
      pageCount,
      chunks,
      {
        detectedTopics: analysis.topics,
        detectedSubject: analysis.subject,
        detectedGrade: analysis.grade,
        suggestedTitle: analysis.title,
        suggestedObjectives: analysis.suggestedObjectives,
        verified: true,
      }
    );

    // If unit has default/empty title or subject, update it with detected values
    const currentUnit = db.getUnit(unitId);
    if (currentUnit) {
      const updates: any = {};
      if (!currentUnit.title || currentUnit.title === 'New Unit' || currentUnit.title.includes('Photosynthesis')) {
        updates.title = analysis.title;
      }
      if (!currentUnit.subject || currentUnit.subject === 'Biology') {
        updates.subject = analysis.subject;
      }
      if (!currentUnit.grade) {
        updates.grade = analysis.grade;
      }
      if (Object.keys(updates).length > 0) {
        db.updateUnit(unitId, updates);
      }

      // If unit has no custom objectives yet, register suggested objectives from the source
      const existingObjs = db.getObjectives(unitId);
      if (existingObjs.length === 0 && analysis.suggestedObjectives?.length > 0) {
        db.setObjectives(unitId, analysis.suggestedObjectives);
      }
    }

    res.json({ source, detectedMetadata: analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// One-click Unit Creation from Uploaded Source
router.post('/units/create-from-source', async (req: Request, res: Response) => {
  try {
    const { name, type, rawText, fileBase64 } = req.body;
    let extractedText = '';
    let pageCount = 1;
    let chunks: any[] = [];
    const fileName = name || (type === 'pdf' ? 'Uploaded_Curriculum.pdf' : 'Curriculum_Source_Notes');

    if (type === 'pdf' && fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const extracted = await extractTextFromPdf(buffer);
      extractedText = extracted.rawText;
      pageCount = extracted.pageCount;
      chunks = extracted.chunks;
    } else if (type === 'text' && typeof rawText === 'string' && rawText.trim()) {
      const parsed = parsePlainTextAsSource(rawText);
      extractedText = parsed.rawText;
      pageCount = parsed.pageCount;
      chunks = parsed.chunks;
    } else {
      return res.status(400).json({ error: 'Provide a valid PDF file or non-empty plain text source.' });
    }

    // Dynamic metadata and topic detection
    const analysis = await detectSourceMetadataAndTopics(extractedText, fileName);

    // Create the unit with detected metadata
    const unit = db.createUnit({
      title: analysis.title,
      subject: analysis.subject,
      grade: analysis.grade,
      learnerDescription: analysis.learnerDescription,
      difficulty: 'medium',
    });

    // Set objectives derived from source
    if (analysis.suggestedObjectives?.length > 0) {
      db.setObjectives(unit.id, analysis.suggestedObjectives);
    }

    // Save source bound strictly to this new unit
    const source = db.saveSource(
      unit.id,
      fileName,
      type === 'pdf' ? 'pdf' : 'text',
      extractedText,
      pageCount,
      chunks,
      {
        detectedTopics: analysis.topics,
        detectedSubject: analysis.subject,
        detectedGrade: analysis.grade,
        suggestedTitle: analysis.title,
        suggestedObjectives: analysis.suggestedObjectives,
        verified: true,
      }
    );

    res.status(201).json({ unit, source, detectedMetadata: analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- OBJECTIVES & CONTRACT ---
router.get('/units/:id/objectives', (req: Request, res: Response) => {
  try {
    const objectives = db.getObjectives(req.params.id);
    res.json({ objectives });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/objectives', (req: Request, res: Response) => {
  try {
    const { objectives } = req.body;
    if (!Array.isArray(objectives)) {
      return res.status(400).json({ error: 'Objectives must be an array' });
    }
    const saved = db.setObjectives(req.params.id, objectives);
    res.json({ objectives: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/units/:id/contract', (req: Request, res: Response) => {
  try {
    const contract = db.getContract(req.params.id);
    res.json({ contract });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/contract', (req: Request, res: Response) => {
  try {
    const contract = db.saveContract({
      ...req.body,
      unitId: req.params.id,
    });
    res.json({ contract });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GENERATION ENGINE ---
router.post('/units/:id/generate', async (req: Request, res: Response) => {
  try {
    const result = await orchestrateLearningPack(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASSETS ---
router.get('/units/:id/assets', (req: Request, res: Response) => {
  try {
    const assets = db.getAssets(req.params.id);
    res.json({ assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/units/:id/assets/:assetId', (req: Request, res: Response) => {
  try {
    const asset = db.getAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/units/:id/assets/:assetId', (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;
    const existing = db.getAsset(req.params.assetId);
    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const newVersion = existing.version + 1;
    const updated = {
      ...existing,
      content,
      title: title || existing.title,
      version: newVersion,
      changeType: 'teacher_edited' as const,
      status: 'DRAFT' as const,
      updatedAt: new Date().toISOString(),
    };
    db.saveAsset(updated);

    db.saveVersionRecord({
      unitId: req.params.id,
      assetId: updated.id,
      versionNumber: newVersion,
      content,
      changeType: 'teacher_edited',
      changeReason: 'Teacher edited asset content',
      createdBy: 'Teacher',
    });

    db.logActivity(req.params.id, 'Asset Edited', `Edited "${updated.title}" to v${newVersion}`);
    res.json({ asset: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/assets/:assetId/approve', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const asset = db.updateAssetStatus(req.params.assetId, 'APPROVED', reason);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/assets/:assetId/revision', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const asset = db.updateAssetStatus(req.params.assetId, 'NEEDS_REVISION', reason);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- QUESTIONS ---
router.get('/units/:id/questions', (req: Request, res: Response) => {
  try {
    const assetId = req.query.assetId as string | undefined;
    const questions = db.getQuestions(req.params.id, assetId);
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/units/:id/questions/reorder', (req: Request, res: Response) => {
  try {
    const { assetId, questionIds } = req.body;
    if (!assetId || !Array.isArray(questionIds)) {
      return res.status(400).json({ error: 'assetId and questionIds array are required' });
    }
    const questions = db.reorderQuestions(req.params.id, assetId, questionIds);
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/units/:id/questions/:questionId', (req: Request, res: Response) => {
  try {
    const currentQ = db.getQuestion(req.params.questionId);
    if (!currentQ) return res.status(404).json({ error: 'Question not found' });

    const newVersion = currentQ.version + 1;
    const updated = db.updateQuestion(req.params.questionId, {
      ...req.body,
      version: newVersion,
    });

    db.saveVersionRecord({
      unitId: req.params.id,
      questionId: currentQ.id,
      versionNumber: newVersion,
      content: updated,
      changeType: 'teacher_edited',
      changeReason: 'Teacher edited question',
      createdBy: 'Teacher',
    });

    db.logActivity(req.params.id, 'Question Edited', `Updated Q${currentQ.questionNumber} to v${newVersion}`);
    res.json({ question: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/questions', (req: Request, res: Response) => {
  try {
    const { assetId, question, options, correctAnswer, explanation, difficulty, objectiveId, section } = req.body;
    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }
    const created = db.createQuestion(req.params.id, assetId, {
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
      section,
      objectiveIds: req.body.objectiveIds || (objectiveId ? [objectiveId] : undefined),
    });
    res.status(201).json({ question: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/assets/:assetId/questions/generate', async (req: Request, res: Response) => {
  try {
    const section = req.body?.section;
    if (section !== 'foundation' && section !== 'extension') {
      return res.status(400).json({ error: 'A valid practice tier is required' });
    }

    const question = await orchestratePracticeQuestionAddition(
      req.params.id,
      req.params.assetId,
      section
    );
    res.status(201).json({ question });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/units/:id/questions/:questionId', (req: Request, res: Response) => {
  try {
    const success = db.deleteQuestion(req.params.id, req.params.questionId);
    if (!success) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/questions/:questionId/regenerate', async (req: Request, res: Response) => {
  try {
    const { reason, instruction } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Reason for regeneration is required' });
    }
    const result = await orchestrateQuestionRegeneration(
      req.params.id,
      req.params.questionId,
      reason,
      instruction || ''
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- QUALITY CHECKS ---
router.get('/units/:id/quality', (req: Request, res: Response) => {
  try {
    const checks = db.getQualityChecks(req.params.id);
    res.json({ checks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/quality/run', async (req: Request, res: Response) => {
  try {
    const unit = db.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const chunks = db.getSourceChunks(req.params.id);
    const objectives = db.getObjectives(req.params.id);
    const assets = db.getAssets(req.params.id);
    const questions = db.getQuestions(req.params.id);

    const checks = await executeQualityEngine(unit, chunks, objectives, assets, questions);
    db.saveQualityChecks(req.params.id, checks);
    db.recalculateUnitStatus(req.params.id);

    res.json({ checks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/quality/:checkId/override', (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const overridden = db.overrideQualityCheck(req.params.checkId, reason || 'Teacher manual override');
    if (!overridden) return res.status(404).json({ error: 'Check not found' });
    res.json({ check: overridden });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- VERSIONS ---
router.get('/units/:id/versions', (req: Request, res: Response) => {
  try {
    const assetId = req.query.assetId as string | undefined;
    const questionId = req.query.questionId as string | undefined;
    const versions = db.getVersions(req.params.id, assetId, questionId);
    res.json({ versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/versions/:versionId/restore', (req: Request, res: Response) => {
  try {
    const result = db.restoreVersion(req.params.id, req.params.versionId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ALIGNMENT MATRIX ---
router.get('/units/:id/alignment', (req: Request, res: Response) => {
  try {
    const matrix = db.getAlignmentMap(req.params.id);
    const objectives = db.getObjectives(req.params.id);
    res.json({ matrix, objectives });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STUDENT PACK (Clean, safe, ONLY approved assets!) ---
router.get('/units/:id/student', (req: Request, res: Response) => {
  try {
    const unit = db.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const assets = db.getAssets(req.params.id);
    const approvedAssets = assets.filter((a) => a.status === 'APPROVED');
    const includeDrafts = req.query.includeDrafts === 'true';
    const displayAssets = includeDrafts ? assets : approvedAssets;

    // Strip answers from quiz and practice for student safety!
    const sanitizedAssets = displayAssets.map((asset) => {
      const copy = JSON.parse(JSON.stringify(asset));
      // Remove teacher metadata
      delete copy.model;
      delete copy.sourceChunkIds;
      delete copy.changeType;

      if (copy.type === 'quiz' && copy.content?.questions) {
        delete copy.content.answerKeySummary;
        copy.content.questions = copy.content.questions.map((q: any) => ({
          id: q.id,
          questionNumber: q.questionNumber,
          question: q.question,
          options: q.options,
          hints: q.hints,
          section: q.section,
          // Do NOT send correctAnswer or explanation in student view!
        }));
      }

      if (copy.type === 'practice') {
        if (copy.content?.foundationQuestions) {
          copy.content.foundationQuestions = copy.content.foundationQuestions.map((q: any) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            question: q.question,
            options: q.options,
            section: q.section,
          }));
        }
        if (copy.content?.extensionQuestions) {
          copy.content.extensionQuestions = copy.content.extensionQuestions.map((q: any) => ({
            id: q.id,
            questionNumber: q.questionNumber,
            question: q.question,
            options: q.options,
            section: q.section,
          }));
        }
      }

      return copy;
    });

    res.json({
      unit: {
        id: unit.id,
        title: unit.title,
        subject: unit.subject,
        grade: unit.grade,
      },
      assets: sanitizedAssets,
      approvedCount: approvedAssets.length,
      totalCount: assets.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/units/:id/student/assessments/:assetId/submit', (req: Request, res: Response) => {
  try {
    const unit = db.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const asset = db.getAsset(req.params.assetId);
    if (!asset || asset.unitId !== unit.id) {
      return res.status(404).json({ error: 'Assessment not found for this unit' });
    }
    if (asset.type !== 'quiz' && asset.type !== 'practice') {
      return res.status(400).json({ error: 'Only quiz and practice assessments can be submitted' });
    }

    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be provided as a question ID map' });
    }

    const questions: Question[] = asset.type === 'quiz'
      ? asset.content.questions || []
      : [
          ...(asset.content.foundationQuestions || []),
          ...(asset.content.extensionQuestions || []),
        ];
    if (questions.length === 0) {
      return res.status(400).json({ error: 'This assessment has no questions' });
    }

    const results = questions.map((question) => {
      const selectedAnswer = typeof answers[question.id] === 'string' ? answers[question.id] : '';
      const correct = typeof question.correctAnswer === 'string'
        && question.correctAnswer.length > 0
        && selectedAnswer === question.correctAnswer;

      return {
        questionId: question.id,
        correct,
        correctAnswer: question.correctAnswer || '',
        explanation: question.explanation || '',
        incorrectReason: correct
          ? ''
          : selectedAnswer
            ? `Your selected answer "${selectedAnswer}" is incorrect. ${question.explanation || 'It does not match the source-supported answer.'}`
            : 'No answer was selected. Review the correct answer and its explanation below.',
      };
    });
    const score = results.filter((result) => result.correct).length;

    res.json({ score, total: questions.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- UNIT FULL SUMMARY ---
router.get('/units/:id/summary', (req: Request, res: Response) => {
  try {
    const unit = db.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const source = db.getSource(req.params.id);
    const objectives = db.getObjectives(req.params.id);
    const contract = db.getContract(req.params.id);
    const assets = db.getAssets(req.params.id);
    const questions = db.getQuestions(req.params.id);
    const qualityChecks = db.getQualityChecks(req.params.id);
    const activityLogs = db.getActivityLogs(req.params.id);

    const approvedCount = assets.filter((a) => a.status === 'APPROVED').length;
    const qualityIssueCount = qualityChecks.filter(
      (c) => c.severity !== 'none' && !c.overridden
    ).length;

    res.json({
      unit,
      source: source || null,
      objectives,
      contract: contract || null,
      assets,
      questions,
      qualityChecks,
      activityLogs,
      approvedAssetCount: approvedCount,
      totalAssetCount: assets.length,
      qualityIssueCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ACTIVITY LOGS ---
router.get('/units/:id/activity', (req: Request, res: Response) => {
  try {
    const logs = db.getActivityLogs(req.params.id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
