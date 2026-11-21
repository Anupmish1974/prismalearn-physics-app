import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Lightbulb, Search, TrendingUp } from 'lucide-react';
import { AgentReasoningTrace } from '../types/physics';

interface ReasoningTracePanelProps {
  trace: AgentReasoningTrace;
}

export const ReasoningTracePanel: React.FC<ReasoningTracePanelProps> = ({ trace }) => {
  const isSound = trace.isCorrect && trace.reasoningQuality === 'sound';

  const steps = [
    {
      num: '01',
      title: "Analyzing Student's Explanation",
      body: trace.step1Analysis,
      icon: Search,
      tone: 'text-slate-700',
    },
    {
      num: '02',
      title: 'Identifying Root Misconception',
      body: trace.step2Misconception,
      tag: trace.misconceptionTag,
      icon: isSound ? CheckCircle2 : AlertTriangle,
      tone: isSound ? 'text-emerald-700' : 'text-rose-700',
    },
    {
      num: '03',
      title: 'Updating Learner Model',
      body: trace.step3ModelImpact,
      icon: TrendingUp,
      tone: 'text-blue-700',
    },
    {
      num: '04',
      title: 'Generating Hint',
      body: trace.step4Hint,
      icon: Lightbulb,
      tone: 'text-amber-700',
    },
  ];

  const delta = trace.masteryAfter - trace.masteryBefore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Agent Reasoning Trace</span>
            <span aria-hidden="true">·</span>
            <span>{trace.conceptName}</span>
            <span aria-hidden="true">·</span>
            <span>{trace.timestamp}</span>
          </div>
          <h4 className="font-display text-base font-semibold text-slate-900">
            {isSound
              ? 'Sound Conceptual Model Verified'
              : `Misconception Detected: ${trace.misconceptionTag}`}
          </h4>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium tabular-nums">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              trace.isCorrect ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {trace.isCorrect ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
            {trace.isCorrect ? 'MCQ Correct' : 'MCQ Incorrect'}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            /
          </span>
          <span className="font-mono text-slate-700">
            Mastery {trace.masteryBefore}% → {trace.masteryAfter}% ({delta >= 0 ? `+${delta}` : delta}%)
          </span>
        </div>
      </div>

      {/* Student Response Comparison */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-700 sm:grid-cols-2">
        <div>
          <span className="font-semibold text-slate-900">Student Choice: </span>
          <span className={trace.isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
            {trace.selectedOption}
          </span>
          {!trace.isCorrect && (
            <div className="mt-1 text-slate-600">
              <span className="font-semibold text-slate-800">Correct Answer: </span>
              <span className="text-emerald-700 font-medium">{trace.correctOption}</span>
            </div>
          )}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Student Explanation: </span>
          <span className="italic text-slate-600">“{trace.studentReasoning}”</span>
        </div>
      </div>

      {/* 4-Step Visible Agent Trace */}
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.li
              key={step.num}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: index * 0.06 }}
              className="flex items-start gap-3.5 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700 tabular-nums">
                {step.num}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${step.tone}`} aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                  {step.tag && !isSound && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-rose-700">{step.tag}</span>
                    </>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </motion.div>
  );
};
