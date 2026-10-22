import { db } from './db.ts';
import {
  generateExplanation,
  generateWorkedExample,
  generateQuiz,
  generateDifferentiatedPractice,
  generateRevisionSheet,
  generateSinglePracticeQuestion,
  regenerateSingleQuestion,
} from './nvidia.ts';
import { executeQualityEngine } from './qualityEngine.ts';
import type { Asset, Question, VersionRecord } from '../src/types/index.ts';

export async function orchestrateLearningPack(unitId: string): Promise<{
  success: boolean;
  message: string;
  assets: Asset[];
}> {
  const unit = db.getUnit(unitId);
  if (!unit) throw new Error('Unit not found');

  const source = db.getSource(unitId);
  const chunks = db.getSourceChunks(unitId);
  if (!source || chunks.length === 0) {
    throw new Error('Please upload or paste a trusted source document before generating.');
  }

  const objectives = db.getObjectives(unitId) || [];
  if (objectives.length < 2) {
    throw new Error('Please define at least two learning objectives before generating.');
  }

  const contract = db.getContract(unitId);

  db.updateUnit(unitId, { status: 'GENERATING' });
  db.logActivity(unitId, 'Generation Started', 'AI learning pack compilation in progress');

  try {
    const now = new Date().toISOString();
    const modelUsed = process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct';

    // 1. Generate Explanation
    const explanationContent = await generateExplanation(unit, chunks, objectives, contract);
    const explanationAsset: Asset = {
      id: `asset_${unitId}_exp`,
      unitId,
      type: 'explanation',
      title: explanationContent.title || 'Core Concept Explanation',
      status: 'DRAFT',
      version: 1,
      content: explanationContent,
      objectiveIds: objectives.map((o) => o.id),
      sourceChunkIds: chunks.slice(0, 3).map((c) => c.id),
      model: modelUsed,
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    db.saveAsset(explanationAsset);
    db.saveVersionRecord({
      unitId,
      assetId: explanationAsset.id,
      versionNumber: 1,
      content: explanationContent,
      changeType: 'ai_generated',
      changeReason: 'Initial generation',
      createdBy: 'LearnSmith Pipeline',
    });

    // 2. Generate Worked Example
    const exampleContent = await generateWorkedExample(unit, chunks, objectives, contract);
    const exampleAsset: Asset = {
      id: `asset_${unitId}_ex`,
      unitId,
      type: 'worked_example',
      title: exampleContent.title || 'Guided / Worked Example',
      status: 'DRAFT',
      version: 1,
      content: exampleContent,
      objectiveIds: objectives.slice(0, 2).map((o) => o.id),
      sourceChunkIds: chunks.slice(0, 2).map((c) => c.id),
      model: modelUsed,
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    db.saveAsset(exampleAsset);
    db.saveVersionRecord({
      unitId,
      assetId: exampleAsset.id,
      versionNumber: 1,
      content: exampleContent,
      changeType: 'ai_generated',
      changeReason: 'Initial generation',
      createdBy: 'LearnSmith Pipeline',
    });

    // 3. Generate Formative Quiz
    const quizResult = await generateQuiz(unit, chunks, objectives, contract, 4);
    const quizAsset: Asset = {
      id: `asset_${unitId}_quiz`,
      unitId,
      type: 'quiz',
      title: 'Formative Assessment Quiz',
      status: 'DRAFT',
      version: 1,
      content: {
        title: 'Formative Assessment Quiz',
        instructions: 'Answer the following questions to check your understanding.',
        questions: quizResult.questions,
        answerKeySummary: quizResult.answerKeySummary,
      },
      objectiveIds: objectives.map((o) => o.id),
      sourceChunkIds: chunks.map((c) => c.id),
      model: modelUsed,
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    db.saveAsset(quizAsset);

    // Save quiz questions with assetId
    const savedQuizQuestions = quizResult.questions.map((q) => {
      const formatted = { ...q, assetId: quizAsset.id };
      db.saveQuestion(formatted);
      db.saveVersionRecord({
        unitId,
        questionId: formatted.id,
        versionNumber: 1,
        content: formatted,
        changeType: 'ai_generated',
        changeReason: 'Initial quiz generation',
        createdBy: 'LearnSmith Pipeline',
      });
      return formatted;
    });
    quizAsset.content.questions = savedQuizQuestions;
    db.saveAsset(quizAsset);

    // 4. Generate Differentiated Practice
    const practiceResult = await generateDifferentiatedPractice(unit, chunks, objectives, contract);
    const practiceAsset: Asset = {
      id: `asset_${unitId}_prac`,
      unitId,
      type: 'practice',
      title: 'Tiered Practice: Foundation & Extension',
      status: 'DRAFT',
      version: 1,
      content: {
        title: 'Tiered Practice Exercises',
        foundationQuestions: practiceResult.foundationQuestions,
        extensionQuestions: practiceResult.extensionQuestions,
      },
      objectiveIds: objectives.map((o) => o.id),
      sourceChunkIds: chunks.map((c) => c.id),
      model: modelUsed,
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    db.saveAsset(practiceAsset);

    const savedFoundation = practiceResult.foundationQuestions.map((q) => {
      const formatted = { ...q, assetId: practiceAsset.id };
      db.saveQuestion(formatted);
      return formatted;
    });
    const savedExtension = practiceResult.extensionQuestions.map((q) => {
      const formatted = { ...q, assetId: practiceAsset.id };
      db.saveQuestion(formatted);
      return formatted;
    });
    practiceAsset.content.foundationQuestions = savedFoundation;
    practiceAsset.content.extensionQuestions = savedExtension;
    db.saveAsset(practiceAsset);

    // 5. Generate Revision Sheet
    const revisionContent = await generateRevisionSheet(unit, chunks, objectives, contract);
    const revisionAsset: Asset = {
      id: `asset_${unitId}_rev`,
      unitId,
      type: 'revision',
      title: revisionContent.title || 'High-Yield Revision Sheet',
      status: 'DRAFT',
      version: 1,
      content: revisionContent,
      objectiveIds: objectives.map((o) => o.id),
      sourceChunkIds: chunks.map((c) => c.id),
      model: modelUsed,
      changeType: 'ai_generated',
      createdAt: now,
      updatedAt: now,
    };
    db.saveAsset(revisionAsset);
    db.saveVersionRecord({
      unitId,
      assetId: revisionAsset.id,
      versionNumber: 1,
      content: revisionContent,
      changeType: 'ai_generated',
      changeReason: 'Initial generation',
      createdBy: 'LearnSmith Pipeline',
    });

    // 6. Execute Quality Checks
    const allQuestions = db.getQuestions(unitId);
    const allAssets = db.getAssets(unitId);
    const qualityChecks = await executeQualityEngine(
      unit,
      chunks,
      objectives,
      allAssets,
      allQuestions
    );
    db.saveQualityChecks(unitId, qualityChecks);

    db.updateUnit(unitId, { status: 'REVIEW' });
    db.logActivity(unitId, 'Pack Ready', 'Generated 5 assets and completed automated quality audit');

    return {
      success: true,
      message: 'Learning pack generated successfully with full quality checks.',
      assets: allAssets,
    };
  } catch (err: any) {
    db.updateUnit(unitId, { status: 'DRAFT' });
    db.logActivity(unitId, 'Generation Error', err?.message || 'Failed during generation');
    throw err;
  }
}

/**
 * REGENERATE INDIVIDUAL QUESTION (Strictly preserving the rest of the pack!)
 */
export async function orchestrateQuestionRegeneration(
  unitId: string,
  questionId: string,
  reason: string,
  instruction: string
): Promise<{ success: boolean; question: Question }> {
  const unit = db.getUnit(unitId);
  if (!unit) throw new Error('Unit not found');

  const currentQ = db.getQuestion(questionId);
  if (!currentQ) throw new Error('Question not found');

  const chunks = db.getSourceChunks(unitId);
  const objectives = db.getObjectives(unitId);

  // Generate new content
  const generated = await regenerateSingleQuestion(
    currentQ,
    unit,
    chunks,
    objectives,
    reason,
    instruction
  );

  const newVersion = currentQ.version + 1;
  const updatedQuestion: Question = {
    ...currentQ,
    ...generated,
    version: newVersion,
    status: 'DRAFT',
  };

  const savedQuestion = db.updateQuestion(updatedQuestion.id, updatedQuestion);
  if (!savedQuestion) throw new Error('Question not found');

  // Save version history record
  db.saveVersionRecord({
    unitId,
    questionId: updatedQuestion.id,
    versionNumber: newVersion,
    content: savedQuestion,
    changeType: 'ai_regenerated',
    changeReason: `${reason}: ${instruction}`,
    createdBy: 'Teacher Request',
  });

  // Re-run quality checks
  const allQuestions = db.getQuestions(unitId);
  const allAssets = db.getAssets(unitId);
  const qualityChecks = await executeQualityEngine(
    unit,
    chunks,
    objectives,
    allAssets,
    allQuestions
  );
  db.saveQualityChecks(unitId, qualityChecks);

  db.logActivity(
    unitId,
    'Question Regenerated',
    `Regenerated Q${savedQuestion.questionNumber} to v${newVersion} (${reason})`
  );

  return { success: true, question: savedQuestion };
}

export async function orchestratePracticeQuestionAddition(
  unitId: string,
  assetId: string,
  section: 'foundation' | 'extension'
): Promise<Question> {
  const unit = db.getUnit(unitId);
  if (!unit) throw new Error('Unit not found');

  const asset = db.getAsset(assetId);
  if (!asset || asset.unitId !== unitId || asset.type !== 'practice') {
    throw new Error('Practice asset not found');
  }

  const chunks = db.getSourceChunks(unitId);
  if (chunks.length === 0) throw new Error('Upload source material before generating a practice question.');

  const existingTierQuestions = section === 'foundation'
    ? asset.content.foundationQuestions || []
    : asset.content.extensionQuestions || [];
  const generated = await generateSinglePracticeQuestion(
    unit,
    chunks,
    db.getObjectives(unitId),
    section,
    existingTierQuestions.length
  );

  return db.createQuestion(unitId, assetId, {
    ...generated,
    section,
    difficulty: section === 'foundation' ? 'easy' : 'hard',
  });
}
