import React from 'react';
import { Sparkles } from 'lucide-react';

export type AppViewMode = 'student' | 'teacher';

export type TopNavKey =
  | 'student'
  | 'teacher'
  | 'concept-graph-section'
  | 'tutor-workspace-section'
  | 'spaced-repetition-section';

interface TopBarProps {
  viewMode: AppViewMode;
  activeNav: TopNavKey;
  onSelectNav: (nav: TopNavKey) => void;
  onLoadDemoStudent: () => void;
  isDemoLoaded: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  activeNav,
  onSelectNav,
  onLoadDemoStudent,
  isDemoLoaded,
}) => {
  const navBtnClass = (key: TopNavKey) =>
    `whitespace-nowrap shrink-0 pb-0.5 transition-colors cursor-pointer ${
      activeNav === key
        ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
        : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectNav('student')}
          className="text-left font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md px-1 cursor-pointer"
        >
          PrismaLearn
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => onSelectNav('student')}
            className={navBtnClass('student')}
          >
            Student View
          </button>
          <button
            type="button"
            onClick={() => onSelectNav('teacher')}
            className={navBtnClass('teacher')}
          >
            Teacher Dashboard
          </button>
          {viewMode === 'student' && (
            <>
              <button
                type="button"
                onClick={() => onSelectNav('concept-graph-section')}
                className={navBtnClass('concept-graph-section')}
              >
                Concept Graph
              </button>
              <button
                type="button"
                onClick={() => onSelectNav('tutor-workspace-section')}
                className={navBtnClass('tutor-workspace-section')}
              >
                Adaptive Tutor
              </button>
              <button
                type="button"
                onClick={() => onSelectNav('spaced-repetition-section')}
                className={navBtnClass('spaced-repetition-section')}
              >
                Revision Queue
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLoadDemoStudent}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isDemoLoaded
                ? 'Reload Demo Student'
                : 'Load Demo Student (Pre-filled Attempt)'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
