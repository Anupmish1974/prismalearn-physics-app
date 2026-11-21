import React, { useState } from 'react';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import {
  CLASS_TOP_MISCONCEPTIONS,
  PHYSICS_CONCEPTS,
  SAMPLE_COHORT_STUDENTS,
} from '../data/physicsCurriculum';
import { LearnerState } from '../types/physics';
import { getMasteryStatus, getOverallMastery } from '../utils/learnerEngine';
import { ReasoningTracePanel } from './ReasoningTracePanel';

interface TeacherDashboardProps {
  activeStudent: LearnerState;
  onSelectStudentForView: (student: LearnerState) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeStudent,
  onSelectStudentForView,
}) => {
  // Combine cohort sample profiles + active session student (deduped by studentId)
  const cohortList: LearnerState[] = [
    activeStudent,
    ...SAMPLE_COHORT_STUDENTS.filter(
      (s) => s.studentId !== activeStudent.studentId
    ),
  ];

  const [inspectedId, setInspectedId] = useState<string>(cohortList[0].studentId);
  const inspectedStudent =
    cohortList.find((s) => s.studentId === inspectedId) ?? cohortList[0];

  // Aggregate class-wide concept averages
  const conceptAverages = PHYSICS_CONCEPTS.map((concept) => {
    const scores = cohortList.map((s) => s.masteryByConcept[concept.id] ?? 50);
    const avg = Math.round(
      scores.reduce((sum, val) => sum + val, 0) / scores.length
    );
    const weakCount = scores.filter((sc) => sc < 50).length;
    return { concept, avg, weakCount };
  });

  const classAverage = Math.round(
    conceptAverages.reduce((sum, item) => sum + item.avg, 0) /
      conceptAverages.length
  );

  const studentsNeedingIntervention = cohortList.filter(
    (s) => getOverallMastery(s.masteryByConcept) < 65
  ).length;

  const weakestClassConcept = [...conceptAverages].sort(
    (a, b) => a.avg - b.avg
  )[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Class 10 Physics · Class of 32 Students (4 Sample Profiles) · Misconception Telemetry
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Teacher Analytics Dashboard
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Inspect cohort mastery gaps or click any sample student profile to step into their adaptive tutor view.
        </p>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Class Average Mastery
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {classAverage}%
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Class of 32 Students (4 Sample Profiles)
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Students Needing Support
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-rose-700 tabular-nums">
            {studentsNeedingIntervention} / {cohortList.length}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Sample profiles below 65% readiness
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Weakest Cohort Concept
          </div>
          <div className="mt-2 font-display text-base font-semibold text-slate-900 truncate">
            {weakestClassConcept?.concept.name}
          </div>
          <div className="mt-1 font-mono text-xs text-amber-700 tabular-nums">
            {weakestClassConcept?.avg}% average mastery
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">
            Top Misconception Cluster
          </div>
          <div className="mt-2 font-display text-base font-semibold text-slate-900 truncate">
            {CLASS_TOP_MISCONCEPTIONS[0].tag}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            {CLASS_TOP_MISCONCEPTIONS[0].affectedStudents} of{' '}
            {CLASS_TOP_MISCONCEPTIONS[0].totalStudents} students affected
          </div>
        </div>
      </div>

      {/* Main 2-Column Cohort Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Class-Wide Concept Mastery Distribution */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-medium text-slate-500">
              Light, Electricity &amp; Magnetism
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
              Class Average Mastery by Concept
            </h2>
          </div>

          <div className="mt-5 space-y-3.5">
            {conceptAverages.map(({ concept, avg, weakCount }) => {
              const status = getMasteryStatus(avg);
              const barColor =
                status === 'Weak'
                  ? 'bg-rose-600'
                  : status === 'Developing'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600';

              return (
                <div key={concept.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900">
                        {concept.name}
                      </span>
                      <span className="ml-2 text-slate-400">·</span>
                      <span className="ml-2 text-slate-500">{concept.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      {weakCount > 0 && (
                        <span className="text-rose-700 font-medium">
                          {weakCount} weak
                        </span>
                      )}
                      <span className="font-mono font-semibold text-slate-900 w-9 text-right">
                        {avg}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Top Class-Wide Misconceptions */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-medium text-slate-500">
              Extracted from Student Reasoning Explanations
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
              Top Class-Wide Misconceptions
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            {CLASS_TOP_MISCONCEPTIONS.map((item, idx) => {
              const pct = Math.round(
                (item.affectedStudents / item.totalStudents) * 100
              );
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          0{idx + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.unit}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.conceptName}</span>
                      </div>
                      <h3 className="mt-0.5 font-display text-sm font-semibold text-rose-800">
                        {item.tag}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                      {item.affectedStudents}/{item.totalStudents} ({pct}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">Observed Flaw: </span>
                    {item.diagnosticExample}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-blue-700 inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      Suggested Mini-Lesson:
                    </span>{' '}
                    {item.recommendedIntervention}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* One-Click Sample Student Profiles */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              One-Click Profile Inspector
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
              Sample Student Profiles
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Select a student row to inspect or open in Student View</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-2.5 pr-4">Student</th>
                <th className="py-2.5 px-4">Overall Mastery</th>
                <th className="py-2.5 px-4">Weak Concepts</th>
                <th className="py-2.5 px-4">Primary Misconception</th>
                <th className="py-2.5 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohortList.map((student) => {
                const overall = getOverallMastery(student.masteryByConcept);
                const weakTopics = Object.entries(student.masteryByConcept)
                  .filter(([, val]) => val < 50)
                  .map(
                    ([id]) =>
                      PHYSICS_CONCEPTS.find((c) => c.id === id)?.name ?? id
                  );
                const topMisc =
                  Object.values(student.misconceptionsByConcept).flat()[0] ??
                  'None recorded';
                const isInspected = student.studentId === inspectedStudent.studentId;

                return (
                  <tr
                    key={student.studentId}
                    onClick={() => setInspectedId(student.studentId)}
                    className={`transition-colors cursor-pointer ${
                      isInspected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">
                        {student.studentName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.gradeLabel}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {overall}%
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {weakTopics.length > 0 ? weakTopics.join(', ') : 'All clear'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {topMisc}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudentForView(student);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Open in Student View</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Student's Most Recent Reasoning Trace */}
        {inspectedStudent.traces.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="mb-3 text-xs font-semibold text-slate-600">
              Latest Agent Reasoning Trace for {inspectedStudent.studentName}
            </h3>
            <ReasoningTracePanel trace={inspectedStudent.traces[0]} />
          </div>
        )}
      </section>
    </div>
  );
};
