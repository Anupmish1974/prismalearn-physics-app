import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import { PhysicsConcept, SpacedRepetitionItem } from '../types/physics';
import { getMasteryStatus } from '../utils/learnerEngine';

interface ConceptGraphProps {
  masteryByConcept: Record<string, number>;
  selectedConceptId: string;
  onSelectConcept: (conceptId: string) => void;
  onPracticeConcept: (conceptId: string) => void;
  misconceptionsByConcept: Record<string, string[]>;
  schedule: Record<string, SpacedRepetitionItem>;
}

const NODE_WIDTH = 224;
const NODE_HEIGHT = 76;

function getNodePalette(score: number) {
  if (score < 50) {
    return {
      fill: '#FEF2F2',
      stroke: '#FCA5A5',
      activeStroke: '#DC2626',
      textPrimary: '#991B1B',
      barFill: '#DC2626',
      label: 'Weak',
    };
  }
  if (score < 80) {
    return {
      fill: '#FFFBEB',
      stroke: '#FCD34D',
      activeStroke: '#D97706',
      textPrimary: '#92400E',
      barFill: '#D97706',
      label: 'Developing',
    };
  }
  return {
    fill: '#ECFDF5',
    stroke: '#6EE7B7',
    activeStroke: '#059669',
    textPrimary: '#065F46',
    barFill: '#059669',
    label: 'Mastered',
  };
}

function splitTitleLines(name: string): [string, string | null] {
  if (name.length <= 26) return [name, null];
  const ampIdx = name.indexOf(' & ');
  if (ampIdx > 0 && ampIdx <= 22) {
    return [name.slice(0, ampIdx + 2), name.slice(ampIdx + 3)];
  }
  const mid = Math.floor(name.length / 2);
  const spaceAfter = name.indexOf(' ', mid);
  const spaceBefore = name.lastIndexOf(' ', mid);
  const splitIdx = spaceBefore > 6 ? spaceBefore : spaceAfter;
  if (splitIdx > 0) {
    return [name.slice(0, splitIdx), name.slice(splitIdx + 1)];
  }
  return [name, null];
}

export const ConceptGraph: React.FC<ConceptGraphProps> = ({
  masteryByConcept,
  selectedConceptId,
  onSelectConcept,
  onPracticeConcept,
  misconceptionsByConcept,
  schedule,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const conceptMap = new Map<string, PhysicsConcept>(
    PHYSICS_CONCEPTS.map((c) => [c.id, c])
  );

  const selectedConcept =
    conceptMap.get(selectedConceptId) ?? PHYSICS_CONCEPTS[0];
  const selectedMastery = masteryByConcept[selectedConcept.id] ?? 50;
  const selectedStatus = getMasteryStatus(selectedMastery);
  const selectedMisconceptions =
    misconceptionsByConcept[selectedConcept.id] ?? [];
  const selectedSchedule = schedule[selectedConcept.id];

  // Build deduplicated prerequisite edges
  const seenEdges = new Set<string>();
  const edges: { from: PhysicsConcept; to: PhysicsConcept }[] = [];
  PHYSICS_CONCEPTS.forEach((concept) => {
    concept.prerequisites.forEach((pid) => {
      const key = `${pid}->${concept.id}`;
      if (seenEdges.has(key)) return;
      const parent = conceptMap.get(pid);
      if (parent) {
        seenEdges.add(key);
        edges.push({ from: parent, to: concept });
      }
    });
  });

  return (
    <section
      id="concept-graph-section"
      className="rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Class 10 Physics Dependency Map · Light, Electricity &amp; Magnetism
          </p>
          <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
            Interactive Concept Graph
          </h2>
        </div>

        {/* Dual-coded legend (never hue-only) */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>Weak (&lt;50%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>Developing (50–79%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Mastered (80%+)</span>
          </span>
        </div>
      </div>

      {/* Responsive Horizontally Scrollable SVG DAG */}
      <p className="mt-3 text-xs text-slate-500 lg:hidden">
        Scroll horizontally to explore the full concept map.
      </p>
      <div className="mt-3 overflow-x-auto pb-2">
        <div className="min-w-[920px]">
          <svg
            viewBox="0 0 1080 436"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Interactive Class 10 Physics Concept Graph showing prerequisites and mastery levels"
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
              </marker>
            </defs>

            {/* Unit Swimlane Containers */}
            <g>
              <rect x="8" y="16" width="1064" height="128" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <text x="24" y="36" fill="#475569" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                UNIT 1 · ELECTRICITY
              </text>

              <rect x="8" y="154" width="1064" height="128" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <text x="24" y="174" fill="#475569" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                UNIT 2 · LIGHT (REFLECTION &amp; REFRACTION)
              </text>

              <rect x="8" y="292" width="1064" height="128" rx="10" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
              <text x="24" y="312" fill="#475569" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
                UNIT 3 · MAGNETISM &amp; DOMESTIC CIRCUITS
              </text>
            </g>

            {/* Clean Within-Unit Prerequisite Arrows (routed strictly in open gaps between boxes) */}
            {edges.map(({ from, to }) => {
              const isConnectedToSelected =
                from.id === selectedConceptId || to.id === selectedConceptId;

              const startX = from.graphPos.x + NODE_WIDTH / 2 + 2;
              const startY = from.graphPos.y;
              const endX = to.graphPos.x - NODE_WIDTH / 2 - 5;
              const endY = to.graphPos.y;
              const pathD = `M ${startX} ${startY} L ${endX} ${endY}`;

              return (
                <path
                  key={`${from.id}->${to.id}`}
                  d={pathD}
                  fill="none"
                  stroke={isConnectedToSelected ? '#2563EB' : '#94A3B8'}
                  strokeWidth={isConnectedToSelected ? 2.2 : 1.6}
                  markerEnd={
                    isConnectedToSelected
                      ? 'url(#arrow-active)'
                      : 'url(#arrow-default)'
                  }
                />
              );
            })}

            {/* Concept Nodes */}
            {PHYSICS_CONCEPTS.map((concept) => {
              const score = masteryByConcept[concept.id] ?? 50;
              const palette = getNodePalette(score);
              const isSelected = concept.id === selectedConceptId;
              const isFocused = concept.id === focusedId;
              const x = concept.graphPos.x - NODE_WIDTH / 2;
              const y = concept.graphPos.y - NODE_HEIGHT / 2;
              const barWidth = Math.max(6, ((NODE_WIDTH - 24) * score) / 100);
              const [line1, line2] = splitTitleLines(concept.name);

              return (
                <g
                  key={concept.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => onSelectConcept(concept.id)}
                  onFocus={() => setFocusedId(concept.id)}
                  onBlur={() => setFocusedId(null)}
                  className="cursor-pointer focus:outline-none"
                  style={{ outline: 'none' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${concept.name}: ${score}% mastery (${palette.label})`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectConcept(concept.id);
                    }
                  }}
                >
                  {(isSelected || isFocused) && (
                    <rect
                      x="-4"
                      y="-4"
                      width={NODE_WIDTH + 8}
                      height={NODE_HEIGHT + 8}
                      rx="13"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  )}
                  <rect
                    x="0"
                    y="0"
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="10"
                    fill={palette.fill}
                    stroke={isSelected ? palette.activeStroke : palette.stroke}
                    strokeWidth={isSelected ? 1.8 : 1.2}
                  />

                  <text
                    x="12"
                    y={line2 ? '18' : '24'}
                    fill="#0F172A"
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {line1}
                  </text>
                  {line2 && (
                    <text
                      x="12"
                      y="32"
                      fill="#0F172A"
                      fontSize="11.5"
                      fontWeight="600"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {line2}
                    </text>
                  )}

                  {/* Explicit Status Text + Tabular Mastery Score */}
                  <text
                    x="12"
                    y="50"
                    fill={palette.textPrimary}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {palette.label}
                  </text>
                  <text
                    x={NODE_WIDTH - 12}
                    y="50"
                    textAnchor="end"
                    fill="#0F172A"
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {score}%
                  </text>

                  {/* Progress Track */}
                  <rect
                    x="12"
                    y="59"
                    width={NODE_WIDTH - 24}
                    height="5"
                    rx="2.5"
                    fill="#E2E8F0"
                  />
                  <rect
                    x="12"
                    y="59"
                    width={barWidth}
                    height="5"
                    rx="2.5"
                    fill={palette.barFill}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Concept Inspector */}
      <div className="mt-4 flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{selectedConcept.unit}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">{selectedConcept.formula}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`font-semibold ${
                selectedStatus === 'Weak'
                  ? 'text-rose-700'
                  : selectedStatus === 'Developing'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {selectedStatus} ({selectedMastery}%)
            </span>
          </div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            {selectedConcept.name}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 max-w-2xl">
            {selectedConcept.description}
          </p>
          {selectedMisconceptions.length > 0 && (
            <p className="text-xs font-medium text-rose-700">
              Active Misconception: {selectedMisconceptions[0]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {selectedSchedule && (
            <div className="text-right text-xs">
              <div className="text-slate-500">Next Scheduled Review</div>
              <div className="font-semibold text-slate-900">{selectedSchedule.bucket}</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => onPracticeConcept(selectedConcept.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Practice This Concept</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
