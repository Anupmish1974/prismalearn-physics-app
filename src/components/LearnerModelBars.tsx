import React from 'react';
import { PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import { PhysicsUnit } from '../types/physics';
import { getMasteryStatus, getOverallMastery } from '../utils/learnerEngine';

interface LearnerModelBarsProps {
  masteryByConcept: Record<string, number>;
  recentDeltas: Record<string, number>;
  selectedConceptId: string;
  onSelectConcept: (conceptId: string) => void;
}

const UNITS: PhysicsUnit[] = ['Electricity', 'Light', 'Magnetism'];

export const LearnerModelBars: React.FC<LearnerModelBarsProps> = ({
  masteryByConcept,
  recentDeltas,
  selectedConceptId,
  onSelectConcept,
}) => {
  const overall = getOverallMastery(masteryByConcept);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Bayesian Knowledge Estimate · Recalculates Live
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
            Dynamic Learner Model
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Overall Readiness</div>
          <div className="font-mono text-xl font-semibold text-slate-900 tabular-nums">
            {overall}%
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        {UNITS.map((unit) => {
          const concepts = PHYSICS_CONCEPTS.filter((c) => c.unit === unit);
          return (
            <div key={unit} className="space-y-2.5">
              <h3 className="text-xs font-semibold tracking-wide text-slate-500">
                {unit}
              </h3>
              <div className="space-y-2.5">
                {concepts.map((concept) => {
                  const score = masteryByConcept[concept.id] ?? 50;
                  const status = getMasteryStatus(score);
                  const delta = recentDeltas[concept.id];
                  const isSelected = concept.id === selectedConceptId;

                  const barColor =
                    status === 'Weak'
                      ? 'bg-rose-600'
                      : status === 'Developing'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600';

                  const statusTextClass =
                    status === 'Weak'
                      ? 'text-rose-700'
                      : status === 'Developing'
                      ? 'text-amber-700'
                      : 'text-emerald-700';

                  return (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => onSelectConcept(concept.id)}
                      className={`w-full rounded-lg p-2.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 ring-1 ring-slate-300'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-900 truncate">
                          {concept.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                          {typeof delta === 'number' && delta !== 0 && (
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {delta > 0 ? `+${delta}%` : `${delta}%`}
                            </span>
                          )}
                          <span className={`font-medium ${statusTextClass}`}>
                            {status}
                          </span>
                          <span className="font-mono font-semibold text-slate-900 w-9 text-right">
                            {score}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
