import { PHYSICS_CONCEPTS } from '../data/physicsCurriculum';
import {
  DifficultyLevel,
  LearnerState,
  MasteryStatus,
  PhysicsConcept,
  ReasoningQuality,
  ReviewBucket,
  SpacedRepetitionItem,
} from '../types/physics';

/** Standard Bayesian Knowledge Tracing (BKT) model parameters */
export const BKT_PARAMS = {
  pGuess: 0.25,
  pSlip: 0.10,
  pTransit: 0.15,
} as const;

export function getMasteryStatus(score: number): MasteryStatus {
  if (score < 50) return 'Weak';
  if (score < 80) return 'Developing';
  return 'Mastered';
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatLocalTimestamp(dateInput: Date | number = new Date()): string {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateStr = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} · ${timeStr}`;
}

export function calibrateDifficulty(mastery: number): DifficultyLevel {
  if (mastery < 45) return 'Easy';
  if (mastery < 75) return 'Medium';
  return 'Hard';
}

/**
 * Selects the highest-priority target concept:
 * Weakest concept whose prerequisites are reasonably satisfied, OR overall lowest mastery concept.
 */
export function selectNextTargetConcept(masteryByConcept: Record<string, number>): {
  concept: PhysicsConcept;
  difficulty: DifficultyLevel;
  reason: string;
} {
  const sorted = [...PHYSICS_CONCEPTS].sort(
    (a, b) => (masteryByConcept[a.id] ?? 50) - (masteryByConcept[b.id] ?? 50)
  );

  const bestCandidate =
    sorted.find((c) => {
      const myScore = masteryByConcept[c.id] ?? 50;
      if (myScore >= 80) return false;
      return c.prerequisites.every((pid) => (masteryByConcept[pid] ?? 50) >= 45);
    }) ?? sorted[0];

  const mastery = masteryByConcept[bestCandidate.id] ?? 50;
  const difficulty = calibrateDifficulty(mastery);

  let reason = '';
  if (mastery < 45) {
    reason = `Lowest mastery detected in ${bestCandidate.name} (${mastery}%). Calibrating to Easy scaffolding to rebuild core intuition.`;
  } else if (mastery < 75) {
    reason = `${bestCandidate.name} is in Developing range (${mastery}%). Calibrating to Medium board-style application.`;
  } else {
    reason = `All prerequisites strong; stretching ${bestCandidate.name} (${mastery}%) with Hard multi-concept synthesis.`;
  }

  return { concept: bestCandidate, difficulty, reason };
}

/**
 * Computes Bayesian Knowledge Tracing (BKT) mastery update.
 * Uses:
 *  - p_guess = 0.25
 *  - p_slip = 0.10
 *  - p_transit = 0.15
 * Posterior P(L_{t-1} | obs) is computed via Bayes' rule, then learning transition
 * P(L_t) = P(L_{t-1} | obs) + (1 - P(L_{t-1} | obs)) * p_transit is applied.
 * A smooth evidence weight modulated by reasoning quality & difficulty prevents cliff jumps
 * while preserving exact BKT directional behavior, clamped cleanly to [0, 100].
 */
export function computeMasteryUpdate(
  current: number,
  isCorrect: boolean,
  reasoningQuality: ReasoningQuality,
  difficulty: DifficultyLevel
): number {
  const { pGuess, pSlip, pTransit } = BKT_PARAMS;
  const pPrior = Math.max(0.02, Math.min(0.98, current / 100));

  // Treat correct MCQ with completely flawed reasoning (lucky guess) as weak negative evidence
  const effectiveCorrect = isCorrect && reasoningQuality !== 'flawed';

  let pPosterior: number;
  if (effectiveCorrect) {
    const num = pPrior * (1 - pSlip);
    const den = num + (1 - pPrior) * pGuess;
    pPosterior = den > 0 ? num / den : pPrior;
  } else {
    const num = pPrior * pSlip;
    const den = num + (1 - pPrior) * (1 - pGuess);
    pPosterior = den > 0 ? num / den : pPrior;
  }

  // Standard BKT transition step
  const pBktNext = pPosterior + (1 - pPosterior) * pTransit;

  // Smooth BKT evidence step weight based on reasoning & difficulty
  let evidenceWeight: number;
  if (isCorrect) {
    if (reasoningQuality === 'sound') {
      evidenceWeight = difficulty === 'Hard' ? 0.55 : difficulty === 'Medium' ? 0.45 : 0.38;
    } else if (reasoningQuality === 'partial') {
      evidenceWeight = difficulty === 'Hard' ? 0.35 : 0.28;
    } else {
      // Correct MCQ but flawed reasoning (lucky guess) -> gentle downward correction
      evidenceWeight = 0.18;
    }
  } else {
    if (reasoningQuality === 'partial') {
      evidenceWeight = 0.32;
    } else {
      evidenceWeight = difficulty === 'Easy' ? 0.46 : difficulty === 'Medium' ? 0.40 : 0.35;
    }
  }

  const pSmoothed = pPrior + evidenceWeight * (pBktNext - pPrior);
  return clampScore(pSmoothed * 100);
}

export function updateSpacedRepetitionItem(
  existing: SpacedRepetitionItem | undefined,
  conceptId: string,
  newMastery: number,
  isCorrect: boolean,
  reasoningQuality: ReasoningQuality,
  misconceptionTag: string
): SpacedRepetitionItem {
  const prevEase = existing?.easeFactor ?? 2.2;
  const reviewedAt = formatLocalTimestamp();

  if (!isCorrect || reasoningQuality === 'flawed') {
    return {
      conceptId,
      bucket: 'Today',
      intervalDays: 1,
      easeFactor: Math.max(1.4, Number((prevEase - 0.3).toFixed(2))),
      retentionPercent: Math.max(30, Math.min(65, newMastery + 12)),
      rationale:
        misconceptionTag && misconceptionTag !== 'None — Sound Reasoning'
          ? `Reset to Today to resolve "${misconceptionTag}".`
          : 'Reset to Today due to incorrect attempt.',
      lastReviewedLabel: `${reviewedAt} (Needs Review)`,
    };
  }

  if (newMastery >= 80 && reasoningQuality === 'sound') {
    return {
      conceptId,
      bucket: 'In 7 Days',
      intervalDays: 7,
      easeFactor: Math.min(2.8, Number((prevEase + 0.15).toFixed(2))),
      retentionPercent: Math.min(98, Math.max(85, newMastery + 6)),
      rationale: 'Sound reasoning verified — expanded along forgetting curve to 7 days.',
      lastReviewedLabel: `${reviewedAt} (Passed)`,
    };
  }

  const bucket: ReviewBucket = newMastery < 50 ? 'Today' : 'In 3 Days';
  return {
    conceptId,
    bucket,
    intervalDays: bucket === 'Today' ? 1 : 3,
    easeFactor: prevEase,
    retentionPercent: Math.min(84, Math.max(55, newMastery + 14)),
    rationale:
      bucket === 'Today'
        ? 'Mastery still below 50% — reinforcing Today.'
        : 'Developing mastery — consolidating memory in 3 days.',
    lastReviewedLabel: `${reviewedAt} (Developing)`,
  };
}

export function applyLearnerEvidence(
  prevState: LearnerState,
  conceptId: string,
  isCorrect: boolean,
  reasoningQuality: ReasoningQuality,
  difficulty: DifficultyLevel,
  misconceptionTag: string
): {
  nextMasteryByConcept: Record<string, number>;
  nextDeltas: Record<string, number>;
  masteryBefore: number;
  masteryAfter: number;
  nextSchedule: Record<string, SpacedRepetitionItem>;
  nextMisconceptions: Record<string, string[]>;
} {
  const masteryBefore = prevState.masteryByConcept[conceptId] ?? 50;
  const masteryAfter = computeMasteryUpdate(
    masteryBefore,
    isCorrect,
    reasoningQuality,
    difficulty
  );
  const delta = masteryAfter - masteryBefore;

  const nextMasteryByConcept = {
    ...prevState.masteryByConcept,
    [conceptId]: masteryAfter,
  };
  const nextDeltas: Record<string, number> = {
    [conceptId]: delta,
  };

  // Propagate subtle Bayesian confidence ripple to direct downstream concepts
  PHYSICS_CONCEPTS.forEach((c) => {
    if (c.prerequisites.includes(conceptId)) {
      const ripple = Math.round(delta * 0.25);
      if (ripple !== 0) {
        const cur = nextMasteryByConcept[c.id] ?? 50;
        const updated = clampScore(cur + ripple);
        nextMasteryByConcept[c.id] = updated;
        nextDeltas[c.id] = updated - cur;
      }
    }
  });

  const nextSchedule = {
    ...prevState.schedule,
    [conceptId]: updateSpacedRepetitionItem(
      prevState.schedule[conceptId],
      conceptId,
      masteryAfter,
      isCorrect,
      reasoningQuality,
      misconceptionTag
    ),
  };

  const prevTags = prevState.misconceptionsByConcept[conceptId] ?? [];
  const nextMisconceptions = { ...prevState.misconceptionsByConcept };
  if (
    (!isCorrect || reasoningQuality === 'flawed') &&
    misconceptionTag &&
    !misconceptionTag.toLowerCase().includes('none')
  ) {
    if (!prevTags.includes(misconceptionTag)) {
      nextMisconceptions[conceptId] = [misconceptionTag, ...prevTags].slice(0, 4);
    }
  }

  return {
    nextMasteryByConcept,
    nextDeltas,
    masteryBefore,
    masteryAfter,
    nextSchedule,
    nextMisconceptions,
  };
}

export function getOverallMastery(masteryByConcept: Record<string, number>): number {
  const vals = Object.values(masteryByConcept);
  if (vals.length === 0) return 0;
  return Math.round(vals.reduce((sum, v) => sum + v, 0) / vals.length);
}

/** Ebbinghaus retention R(t) = exp(-t / S) for SVG forgetting curve */
export function computeForgettingCurvePoints(
  intervalDays: number,
  easeFactor: number
): { day: number; retention: number }[] {
  const stability = intervalDays * (easeFactor / 1.4) + 1.8;
  const points: { day: number; retention: number }[] = [];
  for (let d = 0; d <= 10; d++) {
    const r = Math.round(100 * Math.exp(-d / stability));
    points.push({ day: d, retention: Math.max(18, r) });
  }
  return points;
}
