import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  analyzeLocallyFallback,
  pickFallbackQuestion,
} from '../data/fallbackQuestionBank';
import { PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import {
  AgentReasoningTrace,
  DifficultyLevel,
  ReasoningQuality,
  TargetedQuestion,
} from '../types/physics';
import { calibrateDifficulty, selectNextTargetConcept } from '../utils/learnerEngine';
import { ReasoningTracePanel } from './ReasoningTracePanel';

interface AdaptiveTutorPanelProps {
  masteryByConcept: Record<string, number>;
  misconceptionsByConcept: Record<string, string[]>;
  pinnedConceptId: string | null;
  onClearPinnedConcept: () => void;
  latestTrace: AgentReasoningTrace | null;
  onSubmitAttempt: (payload: {
    conceptId: string;
    conceptName: string;
    questionPrompt: string;
    options: string[];
    selectedIndex: number;
    correctIndex: number;
    studentReasoning: string;
    difficulty: DifficultyLevel;
    analysis: {
      isCorrect: boolean;
      reasoningQuality: ReasoningQuality;
      step1Analysis: string;
      step2Misconception: string;
      misconceptionTag: string;
      step3ModelImpact: string;
      step4Hint: string;
    };
  }) => void;
}

export const AdaptiveTutorPanel: React.FC<AdaptiveTutorPanelProps> = ({
  masteryByConcept,
  misconceptionsByConcept,
  pinnedConceptId,
  onClearPinnedConcept,
  latestTrace,
  onSubmitAttempt,
}) => {
  const autoTarget = selectNextTargetConcept(masteryByConcept);
  const activeConcept =
    (pinnedConceptId
      ? PHYSICS_CONCEPTS.find((c) => c.id === pinnedConceptId)
      : undefined) ?? autoTarget.concept;

  const activeMastery = masteryByConcept[activeConcept.id] ?? 50;
  const calibratedDifficulty = calibrateDifficulty(activeMastery);

  const [overrideDifficulty, setOverrideDifficulty] =
    useState<DifficultyLevel | null>(null);
  const effectiveDifficulty = overrideDifficulty ?? calibratedDifficulty;

  const [question, setQuestion] = useState<TargetedQuestion | null>(null);
  const [previousPrompts, setPreviousPrompts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const generateQuestion = async (
    targetId = activeConcept.id,
    targetDiff = effectiveDifficulty
  ) => {
    const conceptObj =
      PHYSICS_CONCEPTS.find((c) => c.id === targetId) ?? activeConcept;
    const mastery = masteryByConcept[conceptObj.id] ?? 50;

    setIsGenerating(true);
    setErrorMsg(null);
    setFallbackNotice(null);
    setSelectedOption(null);
    setReasoning('');
    setAnswered(false);

    try {
      const res = await fetch('/api/agent/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: conceptObj.id,
          conceptName: conceptObj.name,
          conceptFormula: conceptObj.formula,
          unit: conceptObj.unit,
          difficulty: targetDiff,
          currentMastery: mastery,
          recentMisconceptions: misconceptionsByConcept[conceptObj.id] ?? [],
          previousPrompts,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate targeted question.');
      }

      setQuestion(data);
      setPreviousPrompts((prev) => [...prev, data.prompt].slice(-6));
    } catch {
      const fallbackQ = pickFallbackQuestion(
        conceptObj.id,
        targetDiff,
        previousPrompts
      );
      setQuestion(fallbackQ);
      setPreviousPrompts((prev) => [...prev, fallbackQ.prompt].slice(-6));
      setFallbackNotice(
        'Live AI generator is unavailable right now — loaded a verified physics problem from the local bank.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-refresh when a pinned concept is triggered from Concept Graph or Revision Queue
  useEffect(() => {
    if (pinnedConceptId) {
      const c = PHYSICS_CONCEPTS.find((item) => item.id === pinnedConceptId);
      if (c) {
        const diff = calibrateDifficulty(masteryByConcept[c.id] ?? 50);
        setOverrideDifficulty(null);
        generateQuestion(c.id, diff);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedConceptId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || selectedOption === null || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    const targetConceptObj =
      PHYSICS_CONCEPTS.find((c) => c.id === question.conceptId) ?? activeConcept;

    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: targetConceptObj.id,
          conceptName: targetConceptObj.name,
          questionPrompt: question.prompt,
          options: question.options,
          selectedOptionIndex: selectedOption,
          correctOptionIndex: question.correctIndex,
          studentReasoning: reasoning,
          currentMastery: masteryByConcept[targetConceptObj.id] ?? 50,
          difficulty: question.difficulty,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate reasoning.');
      }

      onSubmitAttempt({
        conceptId: targetConceptObj.id,
        conceptName: targetConceptObj.name,
        questionPrompt: question.prompt,
        options: question.options,
        selectedIndex: selectedOption,
        correctIndex: question.correctIndex,
        studentReasoning: reasoning.trim() || '(No written explanation provided)',
        difficulty: question.difficulty,
        analysis: {
          isCorrect: Boolean(data.isCorrect),
          reasoningQuality: data.reasoningQuality || 'partial',
          step1Analysis: data.step1Analysis,
          step2Misconception: data.step2Misconception,
          misconceptionTag: data.misconceptionTag,
          step3ModelImpact: data.step3ModelImpact,
          step4Hint: data.step4Hint,
        },
      });
      setAnswered(true);
    } catch {
      const localAnalysis = analyzeLocallyFallback({
        conceptId: targetConceptObj.id,
        conceptName: targetConceptObj.name,
        questionPrompt: question.prompt,
        selectedIndex: selectedOption,
        correctIndex: question.correctIndex,
        studentReasoning: reasoning,
      });

      onSubmitAttempt({
        conceptId: targetConceptObj.id,
        conceptName: targetConceptObj.name,
        questionPrompt: question.prompt,
        options: question.options,
        selectedIndex: selectedOption,
        correctIndex: question.correctIndex,
        studentReasoning: reasoning.trim() || '(No written explanation provided)',
        difficulty: question.difficulty,
        analysis: localAnalysis,
      });
      setFallbackNotice(
        'Live AI tutor is unavailable right now — reasoning analyzed and BKT learner model updated locally.'
      );
      setAnswered(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {/* Agent Calibration Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Autonomous Target Selection</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeConcept.unit}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700">
                Mastery {activeMastery}%
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {activeConcept.name}
            </h3>
            <p className="text-xs text-slate-600">
              {pinnedConceptId
                ? `Focused practice requested for ${activeConcept.name}.`
                : autoTarget.reason}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty Calibration Segmented Control */}
            <div
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Difficulty calibration"
            >
              <SlidersHorizontal
                className="ml-2 mr-1 h-3.5 w-3.5 text-slate-500"
                aria-hidden="true"
              />
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((level) => {
                const isActive = effectiveDifficulty === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setOverrideDifficulty(level)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {level}
                    {level === calibratedDifficulty ? ' (Auto)' : ''}
                  </button>
                );
              })}
            </div>

            {pinnedConceptId && (
              <button
                type="button"
                onClick={() => {
                  onClearPinnedConcept();
                  setOverrideDifficulty(null);
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Auto-pick Weakest
              </button>
            )}

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => generateQuestion(activeConcept.id, effectiveDifficulty)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {question ? 'Generate Next Question' : 'Generate Targeted Question'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {fallbackNotice && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>{fallbackNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        {/* Empty / Ready State */}
        {!question && !isGenerating && (
          <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-800">
              Ready to generate {effectiveDifficulty === 'Easy' ? 'an' : 'a'}{' '}
              {effectiveDifficulty} practice problem for{' '}
              <span className="font-semibold">{activeConcept.name}</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              The tutor will calibrate distractors against your active misconceptions and analyze your written reasoning.
            </p>
            <button
              type="button"
              onClick={() => generateQuestion(activeConcept.id, effectiveDifficulty)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <span>Start Targeted Practice</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isGenerating && (
          <div className="mt-5 space-y-3 animate-pulse">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
              <div className="h-12 rounded-lg bg-slate-100" />
              <div className="h-12 rounded-lg bg-slate-100" />
              <div className="h-12 rounded-lg bg-slate-100" />
              <div className="h-12 rounded-lg bg-slate-100" />
            </div>
          </div>
        )}

        {/* Active Generated Question */}
        {question && !isGenerating && (
          <form onSubmit={handleSubmitAnswer} className="mt-5 space-y-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Calibrated Difficulty: {question.difficulty}
                </span>
                <span aria-hidden="true">·</span>
                <span>Target Skill: {question.targetSkill}</span>
              </div>
              <p className="text-xs italic text-slate-500">{question.agentRationale}</p>
            </div>

            <p className="text-base font-medium leading-relaxed text-slate-900">
              {question.prompt}
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {question.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === idx;
                const isCorrectChoice = answered && idx === question.correctIndex;
                const isWrongSelected =
                  answered && isSelected && idx !== question.correctIndex;

                let borderClass = 'border-slate-200 bg-white hover:bg-slate-50';
                if (isCorrectChoice) {
                  borderClass = 'border-emerald-500 bg-emerald-50';
                } else if (isWrongSelected) {
                  borderClass = 'border-rose-500 bg-rose-50';
                } else if (isSelected) {
                  borderClass = 'border-blue-600 bg-blue-50/60';
                }

                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={answered}
                    onClick={() => setSelectedOption(idx)}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors cursor-pointer disabled:cursor-default ${borderClass}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-slate-800 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="adaptive-reasoning"
                className="block text-xs font-semibold text-slate-800"
              >
                Explain your reasoning
              </label>
              <textarea
                id="adaptive-reasoning"
                rows={3}
                disabled={answered}
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder={question.sampleThoughtHint}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-75"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {!answered ? (
                <button
                  type="submit"
                  disabled={selectedOption === null || isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Tracing Reasoning...</span>
                    </>
                  ) : (
                    <span>Submit Answer &amp; Update Model</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClearPinnedConcept();
                    const nextTarget = selectNextTargetConcept(masteryByConcept);
                    setOverrideDifficulty(null);
                    generateQuestion(nextTarget.concept.id, nextTarget.difficulty);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Auto-Calibrate Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {latestTrace && <ReasoningTracePanel trace={latestTrace} />}
    </div>
  );
};
