import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { analyzeLocallyFallback } from '../data/fallbackQuestionBank';
import { DIAGNOSTIC_QUESTIONS, PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import { AgentReasoningTrace, DifficultyLevel, ReasoningQuality } from '../types/physics';
import { ReasoningTracePanel } from './ReasoningTracePanel';

interface DiagnosticQuizProps {
  currentIndex: number;
  isCompleted: boolean;
  masteryByConcept: Record<string, number>;
  latestTrace: AgentReasoningTrace | null;
  onSubmitAttempt: (payload: {
    questionId: string;
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
  onAdvanceDiagnostic: () => void;
  onRestartDiagnostic: () => void;
  onStartAdaptivePractice: () => void;
}

export const DiagnosticQuiz: React.FC<DiagnosticQuizProps> = ({
  currentIndex,
  isCompleted,
  masteryByConcept,
  latestTrace,
  onSubmitAttempt,
  onAdvanceDiagnostic,
  onRestartDiagnostic,
  onStartAdaptivePractice,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [answeredCurrent, setAnsweredCurrent] = useState(false);

  const safeIndex = Math.min(currentIndex, DIAGNOSTIC_QUESTIONS.length - 1);
  const question = DIAGNOSTIC_QUESTIONS[safeIndex];
  const concept = PHYSICS_CONCEPTS.find((c) => c.id === question.conceptId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOption === null || isAnalyzing) return;
    setErrorMsg(null);
    setFallbackNotice(null);
    setIsAnalyzing(true);

    const conceptName = concept?.name ?? question.conceptId;

    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: question.conceptId,
          conceptName,
          questionPrompt: question.prompt,
          options: question.options,
          selectedOptionIndex: selectedOption,
          correctOptionIndex: question.correctIndex,
          studentReasoning: reasoning,
          currentMastery: masteryByConcept[question.conceptId] ?? 50,
          difficulty: question.difficulty,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Agent analysis failed.');
      }

      onSubmitAttempt({
        questionId: question.id,
        conceptId: question.conceptId,
        conceptName,
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
      setAnsweredCurrent(true);
    } catch {
      const localAnalysis = analyzeLocallyFallback({
        conceptId: question.conceptId,
        conceptName,
        questionPrompt: question.prompt,
        selectedIndex: selectedOption,
        correctIndex: question.correctIndex,
        studentReasoning: reasoning,
      });

      onSubmitAttempt({
        questionId: question.id,
        conceptId: question.conceptId,
        conceptName,
        questionPrompt: question.prompt,
        options: question.options,
        selectedIndex: selectedOption,
        correctIndex: question.correctIndex,
        studentReasoning: reasoning.trim() || '(No written explanation provided)',
        difficulty: question.difficulty,
        analysis: localAnalysis,
      });
      setFallbackNotice(
        'Live AI tutor is currently offline or busy — evaluated using the verified local physics engine.'
      );
      setAnsweredCurrent(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setReasoning('');
    setAnsweredCurrent(false);
    setErrorMsg(null);
    setFallbackNotice(null);
    onAdvanceDiagnostic();
  };

  if (isCompleted) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>5-Question Diagnostic Completed</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Baseline Learner Model &amp; Misconceptions Mapped
            </h3>
            <p className="text-sm text-slate-600">
              Your Concept Graph, Mastery Bars, and Spaced-Repetition Queue are calibrated. Launch Autonomous Practice to remediate weak nodes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRestartDiagnostic}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retake Diagnostic</span>
            </button>
            <button
              type="button"
              onClick={onStartAdaptivePractice}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Continue Adaptive Practice</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-600">
                Diagnostic Test · Question {safeIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{question.unit}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{concept?.formula}</span>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {concept?.name}
            </h3>
          </div>

          {/* Step progress indicator */}
          <div className="flex items-center gap-1.5" aria-label="Diagnostic progress">
            {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
              <span
                key={q.id}
                className={`h-2 w-7 rounded-full transition-colors ${
                  idx < currentIndex
                    ? 'bg-emerald-500'
                    : idx === currentIndex
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <p className="text-base font-medium leading-relaxed text-slate-900">
            {question.prompt}
          </p>

          {/* MCQ Options */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {question.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              const isCorrectChoice = answeredCurrent && idx === question.correctIndex;
              const isWrongSelected =
                answeredCurrent && isSelected && idx !== question.correctIndex;

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
                  disabled={answeredCurrent}
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

          {/* Explain your reasoning box */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="diag-reasoning"
                className="text-xs font-semibold text-slate-800"
              >
                Explain your reasoning (AI Tutor analyzes how you think)
              </label>
              {!answeredCurrent && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOption(question.sampleFlawedOptionIndex);
                      setReasoning(question.sampleFlawedReasoning);
                    }}
                    className="text-rose-700 hover:underline font-medium cursor-pointer"
                  >
                    Test Misconception Input
                  </button>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOption(question.correctIndex);
                      setReasoning(question.sampleCorrectReasoning);
                    }}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Fill Sound Reasoning
                  </button>
                </div>
              )}
            </div>
            <textarea
              id="diag-reasoning"
              rows={3}
              disabled={answeredCurrent}
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Write the formula, rule, or intuition you used to reach your answer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none disabled:opacity-75"
            />
          </div>

          {fallbackNotice && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{fallbackNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {!answeredCurrent ? (
              <button
                type="submit"
                disabled={selectedOption === null || isAnalyzing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Analyzing Reasoning...</span>
                  </>
                ) : (
                  <span>Submit &amp; Analyze Reasoning</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {currentIndex + 1 >= DIAGNOSTIC_QUESTIONS.length
                    ? 'Finish Diagnostic & Enter Adaptive Tutor'
                    : 'Next Diagnostic Question'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>

      {answeredCurrent && latestTrace && <ReasoningTracePanel trace={latestTrace} />}
    </div>
  );
};
