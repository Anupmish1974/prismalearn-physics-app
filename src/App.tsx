import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { AdaptiveTutorPanel } from './components/AdaptiveTutorPanel';
import { ConceptGraph } from './components/ConceptGraph';
import { DiagnosticQuiz } from './components/DiagnosticQuiz';
import { LearnerModelBars } from './components/LearnerModelBars';
import { ReasoningTracePanel } from './components/ReasoningTracePanel';
import { SpacedRepetitionQueue } from './components/SpacedRepetitionQueue';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AppViewMode, TopBar, TopNavKey } from './components/TopBar';
import {
  createEmptyLearnerState,
  DEMO_STUDENT_AARAV,
  DIAGNOSTIC_QUESTIONS,
  PHYSICS_CONCEPTS,
} from './data/physicsCurriculum';
import {
  AgentReasoningTrace,
  DifficultyLevel,
  LearnerState,
  ReasoningQuality,
} from './types/physics';
import {
  applyLearnerEvidence,
  formatLocalTimestamp,
  getOverallMastery,
  selectNextTargetConcept,
} from './utils/learnerEngine';

type StudentTutorTab = 'diagnostic' | 'adaptive';

const STORAGE_KEY = 'prismalearn_physics_learner_v1';

function loadInitialLearner(): LearnerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyLearnerState('Active Student');
    const parsed = JSON.parse(raw) as LearnerState;
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.masteryByConcept &&
      parsed.schedule &&
      Array.isArray(parsed.traces)
    ) {
      return parsed;
    }
  } catch {
    // Ignore storage read or JSON parse errors
  }
  return createEmptyLearnerState('Active Student');
}

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('student');
  const [activeNav, setActiveNav] = useState<TopNavKey>('student');
  const [learner, setLearner] = useState<LearnerState>(loadInitialLearner);
  const [tutorTab, setTutorTab] = useState<StudentTutorTab>(() =>
    learner.diagnosticCompleted ? 'adaptive' : 'diagnostic'
  );
  const [selectedConceptId, setSelectedConceptId] =
    useState<string>('series-parallel');
  const [pinnedPracticeConceptId, setPinnedPracticeConceptId] = useState<
    string | null
  >(null);
  const [activeTraceIndex, setActiveTraceIndex] = useState<number>(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
    } catch {
      // Ignore storage quota or privacy-mode errors
    }
  }, [learner]);

  const isDemoLoaded = learner.studentId === DEMO_STUDENT_AARAV.studentId;

  const handleLoadDemoStudent = () => {
    const cloned = structuredClone(DEMO_STUDENT_AARAV);
    const now = Date.now();
    cloned.traces = cloned.traces.map((t, idx) => ({
      ...t,
      timestamp: formatLocalTimestamp(now - (idx + 1) * 3 * 60_000),
    }));
    setLearner(cloned);
    setViewMode('student');
    setActiveNav('student');
    setTutorTab('adaptive');
    setSelectedConceptId('series-parallel');
    setPinnedPracticeConceptId(null);
    setActiveTraceIndex(0);
  };

  const handleResetSession = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setLearner(createEmptyLearnerState('Active Student'));
    setActiveNav('student');
    setTutorTab('diagnostic');
    setSelectedConceptId('ohms-law');
    setPinnedPracticeConceptId(null);
    setActiveTraceIndex(0);
  };

  const handleScrollToSection = (sectionId: string) => {
    setViewMode('student');
    window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleSelectNav = (nav: TopNavKey) => {
    setActiveNav(nav);
    if (nav === 'teacher') {
      setViewMode('teacher');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (nav === 'student') {
      setViewMode('student');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (nav === 'tutor-workspace-section') {
      setTutorTab('adaptive');
    }
    handleScrollToSection(nav);
  };

  const recordAttempt = (payload: {
    questionId?: string;
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
  }) => {
    setLearner((prev) => {
      const evidence = applyLearnerEvidence(
        prev,
        payload.conceptId,
        payload.analysis.isCorrect,
        payload.analysis.reasoningQuality,
        payload.difficulty,
        payload.analysis.misconceptionTag
      );

      const delta = evidence.masteryAfter - evidence.masteryBefore;
      const deltaLabel = delta >= 0 ? `+${delta}%` : `${delta}%`;

      const newTrace: AgentReasoningTrace = {
        id: `trace-${Date.now()}`,
        timestamp: formatLocalTimestamp(),
        conceptId: payload.conceptId,
        conceptName: payload.conceptName,
        questionPrompt: payload.questionPrompt,
        selectedOption: `${String.fromCharCode(65 + payload.selectedIndex)}. ${
          payload.options[payload.selectedIndex] ?? ''
        }`,
        correctOption: `${String.fromCharCode(65 + payload.correctIndex)}. ${
          payload.options[payload.correctIndex] ?? ''
        }`,
        studentReasoning: payload.studentReasoning,
        isCorrect: payload.analysis.isCorrect,
        reasoningQuality: payload.analysis.reasoningQuality,
        step1Analysis: payload.analysis.step1Analysis,
        step2Misconception: payload.analysis.step2Misconception,
        misconceptionTag: payload.analysis.misconceptionTag,
        step3ModelImpact: `${payload.analysis.step3ModelImpact} (${payload.conceptName}: ${evidence.masteryBefore}% → ${evidence.masteryAfter}%, ${deltaLabel})`,
        step4Hint: payload.analysis.step4Hint,
        masteryBefore: evidence.masteryBefore,
        masteryAfter: evidence.masteryAfter,
      };

      const nextAttempts = payload.questionId
        ? [
            ...prev.diagnosticAttempts,
            {
              questionId: payload.questionId,
              conceptId: payload.conceptId,
              selectedIndex: payload.selectedIndex,
              reasoning: payload.studentReasoning,
              isCorrect: payload.analysis.isCorrect,
            },
          ]
        : prev.diagnosticAttempts;

      return {
        ...prev,
        masteryByConcept: evidence.nextMasteryByConcept,
        recentDeltas: evidence.nextDeltas,
        diagnosticAttempts: nextAttempts,
        traces: [newTrace, ...prev.traces],
        misconceptionsByConcept: evidence.nextMisconceptions,
        schedule: evidence.nextSchedule,
        practicedCount: prev.practicedCount + 1,
      };
    });

    setSelectedConceptId(payload.conceptId);
    setActiveTraceIndex(0);
  };

  const handleAdvanceDiagnostic = () => {
    setLearner((prev) => {
      const nextIdx = prev.diagnosticIndex + 1;
      const done = nextIdx >= DIAGNOSTIC_QUESTIONS.length;
      if (done) {
        setTutorTab('adaptive');
      }
      return {
        ...prev,
        diagnosticIndex: nextIdx,
        diagnosticCompleted: done,
      };
    });
  };

  const handlePracticeConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setPinnedPracticeConceptId(conceptId);
    setTutorTab('adaptive');
    setActiveNav('tutor-workspace-section');
    handleScrollToSection('tutor-workspace-section');
  };

  const overallMastery = getOverallMastery(learner.masteryByConcept);
  const weakestTarget = selectNextTargetConcept(learner.masteryByConcept);
  const totalMisconceptions = Object.values(
    learner.misconceptionsByConcept
  ).flat().length;
  const dueTodayCount = Object.values(learner.schedule).filter(
    (s) => s.bucket === 'Today'
  ).length;

  const currentTrace = learner.traces[activeTraceIndex] ?? null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        viewMode={viewMode}
        activeNav={activeNav}
        onSelectNav={handleSelectNav}
        onLoadDemoStudent={handleLoadDemoStudent}
        isDemoLoaded={isDemoLoaded}
      />

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        {viewMode === 'teacher' ? (
          <TeacherDashboard
            activeStudent={learner}
            onSelectStudentForView={(student) => {
              setLearner(structuredClone(student));
              setViewMode('student');
              setActiveNav('student');
              setTutorTab(student.diagnosticCompleted ? 'adaptive' : 'diagnostic');
              setPinnedPracticeConceptId(null);
              setActiveTraceIndex(0);
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* Student Hero / Context Header + 4-Column KPI Strip */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {learner.studentName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{learner.gradeLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Light, Electricity &amp; Magnetism</span>
                  </div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl text-balance">
                    Adaptive Class 10 Physics Tutor
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Mode Switcher inside Workspace */}
                  <div
                    className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1"
                    role="tablist"
                    aria-label="Tutor workflow mode"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tutorTab === 'diagnostic'}
                      onClick={() => setTutorTab('diagnostic')}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        tutorTab === 'diagnostic'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Diagnostic Test (5Q)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tutorTab === 'adaptive'}
                      onClick={() => setTutorTab('adaptive')}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        tutorTab === 'adaptive'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Autonomous Targeted Tutor
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSession}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset Session</span>
                  </button>
                </div>
              </div>

              {/* 4-Column Full-Width KPI Strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Overall Exam Readiness
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                    {overallMastery}%
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {learner.diagnosticCompleted
                      ? 'Diagnostic baseline calibrated'
                      : `${learner.diagnosticIndex}/5 diagnostic completed`}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Weakest Priority Concept
                  </div>
                  <div className="mt-1.5 font-display text-lg font-semibold text-slate-900 truncate">
                    {weakestTarget.concept.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-rose-700 tabular-nums">
                    {learner.masteryByConcept[weakestTarget.concept.id] ?? 50}% mastery · Calibrated {weakestTarget.difficulty}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Active Misconceptions
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                    {totalMisconceptions}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Detected from reasoning explanations
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Due for Review Today
                  </div>
                  <div className="mt-1.5 font-mono text-2xl font-semibold text-blue-600 tabular-nums">
                    {dueTodayCount}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      of {PHYSICS_CONCEPTS.length} concepts
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Scheduled via forgetting curve
                  </div>
                </div>
              </div>
            </section>

            {/* Primary 2-Zone Tutor Workspace + Dynamic Learner Model */}
            <section
              id="tutor-workspace-section"
              className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
            >
              <div className="space-y-5 lg:col-span-7">
                {tutorTab === 'diagnostic' ? (
                  <DiagnosticQuiz
                    currentIndex={learner.diagnosticIndex}
                    isCompleted={learner.diagnosticCompleted}
                    masteryByConcept={learner.masteryByConcept}
                    latestTrace={currentTrace}
                    onSubmitAttempt={recordAttempt}
                    onAdvanceDiagnostic={handleAdvanceDiagnostic}
                    onRestartDiagnostic={handleResetSession}
                    onStartAdaptivePractice={() => setTutorTab('adaptive')}
                  />
                ) : (
                  <>
                    <AdaptiveTutorPanel
                      masteryByConcept={learner.masteryByConcept}
                      misconceptionsByConcept={learner.misconceptionsByConcept}
                      pinnedConceptId={pinnedPracticeConceptId}
                      onClearPinnedConcept={() => setPinnedPracticeConceptId(null)}
                      latestTrace={null}
                      onSubmitAttempt={recordAttempt}
                    />

                    {/* Visible Reasoning Trace History Carousel when traces exist */}
                    {learner.traces.length > 0 && currentTrace && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums">
                            Agent Reasoning Trace History ({activeTraceIndex + 1} of{' '}
                            {learner.traces.length})
                          </span>
                          {learner.traces.length > 1 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={activeTraceIndex === 0}
                                onClick={() =>
                                  setActiveTraceIndex((i) => Math.max(0, i - 1))
                                }
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                aria-label="Newer trace"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  activeTraceIndex >= learner.traces.length - 1
                                }
                                onClick={() =>
                                  setActiveTraceIndex((i) =>
                                    Math.min(learner.traces.length - 1, i + 1)
                                  )
                                }
                                className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                                aria-label="Older trace"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Render directly via ReasoningTracePanel inside AdaptiveTutorPanel or here */}
                      </div>
                    )}
                  </>
                )}

                {tutorTab === 'adaptive' && currentTrace && (
                  <ReasoningTracePanel trace={currentTrace} />
                )}
              </div>

              <div className="lg:col-span-5">
                <LearnerModelBars
                  masteryByConcept={learner.masteryByConcept}
                  recentDeltas={learner.recentDeltas}
                  selectedConceptId={selectedConceptId}
                  onSelectConcept={setSelectedConceptId}
                />
              </div>
            </section>

            {/* Interactive Concept Graph */}
            <ConceptGraph
              masteryByConcept={learner.masteryByConcept}
              selectedConceptId={selectedConceptId}
              onSelectConcept={setSelectedConceptId}
              onPracticeConcept={handlePracticeConcept}
              misconceptionsByConcept={learner.misconceptionsByConcept}
              schedule={learner.schedule}
            />

            {/* Spaced-Repetition Scheduler */}
            <SpacedRepetitionQueue
              schedule={learner.schedule}
              masteryByConcept={learner.masteryByConcept}
              onReviewConcept={handlePracticeConcept}
            />
          </div>
        )}
      </main>
    </div>
  );
}
