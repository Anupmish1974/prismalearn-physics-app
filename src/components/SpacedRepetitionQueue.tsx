import React, { useState } from 'react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import { ReviewBucket, SpacedRepetitionItem } from '../types/physics';
import { computeForgettingCurvePoints } from '../utils/learnerEngine';

interface SpacedRepetitionQueueProps {
  schedule: Record<string, SpacedRepetitionItem>;
  masteryByConcept: Record<string, number>;
  onReviewConcept: (conceptId: string) => void;
}

const BUCKETS: ReviewBucket[] = ['Today', 'In 3 Days', 'In 7 Days'];

export const SpacedRepetitionQueue: React.FC<SpacedRepetitionQueueProps> = ({
  schedule,
  masteryByConcept,
  onReviewConcept,
}) => {
  const [activeBucket, setActiveBucket] = useState<ReviewBucket>('Today');
  const [inspectedConceptId, setInspectedConceptId] = useState<string>('series-parallel');

  const items = Object.values(schedule);
  const bucketCounts: Record<ReviewBucket, number> = {
    Today: items.filter((i) => i.bucket === 'Today').length,
    'In 3 Days': items.filter((i) => i.bucket === 'In 3 Days').length,
    'In 7 Days': items.filter((i) => i.bucket === 'In 7 Days').length,
  };

  const filteredItems = items
    .filter((i) => i.bucket === activeBucket)
    .sort((a, b) => a.retentionPercent - b.retentionPercent);

  const inspectedItem =
    schedule[inspectedConceptId] ??
    filteredItems[0] ??
    items[0];
  const inspectedConcept = PHYSICS_CONCEPTS.find(
    (c) => c.id === inspectedItem?.conceptId
  );

  const curvePoints = inspectedItem
    ? computeForgettingCurvePoints(
        inspectedItem.intervalDays,
        inspectedItem.easeFactor
      )
    : [];

  // SVG polyline path
  const svgWidth = 360;
  const svgHeight = 135;
  const padX = 28;
  const padY = 16;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padY * 2;

  const polylineCoords = curvePoints
    .map((pt) => {
      const x = padX + (pt.day / 10) * plotW;
      const y = padY + ((100 - pt.retention) / 100) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const thresholdY = padY + ((100 - 70) / 100) * plotH;

  return (
    <section
      id="spaced-repetition-section"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Ebbinghaus Forgetting-Curve Scheduler · SM-2 Intervals
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
            Spaced-Repetition Revision Queue
          </h2>
        </div>

        {/* Interactive Bucket Filter Tabs */}
        <div
          className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          role="tablist"
          aria-label="Revision queue timeframes"
        >
          {BUCKETS.map((bucket) => {
            const isActive = activeBucket === bucket;
            return (
              <button
                key={bucket}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveBucket(bucket)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {bucket} ({bucketCounts[bucket]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Revision Queue List */}
        <div className="space-y-3 lg:col-span-7">
          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No concepts currently scheduled for {activeBucket}.
            </div>
          ) : (
            filteredItems.map((item) => {
              const concept = PHYSICS_CONCEPTS.find(
                (c) => c.id === item.conceptId
              );
              if (!concept) return null;
              const mastery = masteryByConcept[concept.id] ?? 50;
              const isInspected = inspectedItem?.conceptId === concept.id;

              return (
                <div
                  key={concept.id}
                  onClick={() => setInspectedConceptId(concept.id)}
                  className={`flex flex-col justify-between gap-3 rounded-lg border p-3.5 transition-colors sm:flex-row sm:items-center cursor-pointer ${
                    isInspected
                      ? 'border-blue-300 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {concept.unit}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Retention {item.retentionPercent}%
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Mastery {mastery}%
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-semibold text-slate-900 truncate">
                      {concept.name}
                    </h4>
                    <p className="text-xs text-slate-600">{item.rationale}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewConcept(concept.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Review Now</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Forgetting Curve Visualizer */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                <span>Forgetting Curve Projection</span>
              </span>
              <span className="font-mono tabular-nums text-slate-500">
                Interval: {inspectedItem?.intervalDays ?? 1}d
              </span>
            </div>
            <h4 className="mt-1 font-display text-sm font-semibold text-slate-900">
              {inspectedConcept?.name}
            </h4>
          </div>

          <div className="my-3">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto"
              role="img"
              aria-label="Forgetting curve showing memory retention over 10 days"
            >
              {/* Threshold line at 70% */}
              <line
                x1={padX}
                y1={thresholdY}
                x2={svgWidth - padX}
                y2={thresholdY}
                stroke="#D97706"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padX}
                y={thresholdY - 4}
                textAnchor="end"
                fill="#B45309"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                70% recall threshold
              </text>

              {/* Axes */}
              <line
                x1={padX}
                y1={padY}
                x2={padX}
                y2={svgHeight - padY}
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <line
                x1={padX}
                y1={svgHeight - padY}
                x2={svgWidth - padX}
                y2={svgHeight - padY}
                stroke="#CBD5E1"
                strokeWidth="1"
              />

              {/* Curve */}
              {polylineCoords && (
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.2"
                  points={polylineCoords}
                />
              )}

              {/* Scheduled Review Marker */}
              {curvePoints[Math.min(10, inspectedItem?.intervalDays ?? 1)] && (
                <circle
                  cx={
                    padX +
                    (Math.min(10, inspectedItem?.intervalDays ?? 1) / 10) * plotW
                  }
                  cy={
                    padY +
                    ((100 -
                      curvePoints[
                        Math.min(10, inspectedItem?.intervalDays ?? 1)
                      ].retention) /
                      100) *
                      plotH
                  }
                  r="4.5"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              )}

              <text
                x={padX}
                y={svgHeight - 3}
                fill="#64748B"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                Day 0
              </text>
              <text
                x={padX + plotW * 0.3}
                y={svgHeight - 3}
                textAnchor="middle"
                fill="#64748B"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                Day 3
              </text>
              <text
                x={padX + plotW * 0.7}
                y={svgHeight - 3}
                textAnchor="middle"
                fill="#64748B"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                Day 7
              </text>
              <text
                x={svgWidth - padX}
                y={svgHeight - 3}
                textAnchor="end"
                fill="#64748B"
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
              >
                Day 10
              </text>
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-2.5">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Last check: {inspectedItem?.lastReviewedLabel}</span>
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              Ease {inspectedItem?.easeFactor.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
