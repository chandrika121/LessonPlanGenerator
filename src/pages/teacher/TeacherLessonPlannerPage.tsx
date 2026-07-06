import { lazy, Suspense, useEffect } from "react";
import { endDevTimer, startDevTimer } from "../../utils/devTiming";

const LegacyLessonPlanner = lazy(() => import("../../App"));

export function TeacherLessonPlannerPage() {
  useEffect(() => {
    const paintLabel = "[page-paint] teacher-lesson-planner";
    startDevTimer(paintLabel);

    const frame = window.requestAnimationFrame(() => {
      endDevTimer(paintLabel);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      endDevTimer(paintLabel);
    };
  }, []);

  return (
    <div className="rounded-[34px] border border-white/70 bg-white/70 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <Suspense
        fallback={
          <div className="space-y-4 rounded-[30px] border border-white/70 bg-white/70 p-6">
            <div className="h-8 animate-pulse rounded-2xl bg-slate-200/80" />
            <div className="h-48 animate-pulse rounded-[30px] bg-slate-200/70" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-32 animate-pulse rounded-[24px] bg-slate-200/70" />
              <div className="h-32 animate-pulse rounded-[24px] bg-slate-200/70" />
            </div>
          </div>
        }
      >
        <LegacyLessonPlanner />
      </Suspense>
    </div>
  );
}
