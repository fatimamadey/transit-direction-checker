"use client";

import Link from "next/link";
import { useRef } from "react";
import type { BoardListItem } from "@/types/dashboard";

type LandingBoardCarouselProps = {
  boards: BoardListItem[];
};

export function LandingBoardCarousel({ boards }: LandingBoardCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: "left" | "right") {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const distance = Math.max(320, Math.round(track.clientWidth * 0.75));
    track.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth"
    });
  }

  if (!boards.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-sm text-violet-100/60">
        No public boards yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="mono text-[11px] uppercase tracking-[0.28em] text-violet-200/65">Public boards</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Browse what people are tracking</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
            onClick={() => scrollByCard("left")}
            type="button"
          >
            ←
          </button>
          <button
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10"
            onClick={() => scrollByCard("right")}
            type="button"
          >
            →
          </button>
        </div>
      </div>

      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {boards.map((board) => (
          <Link
            className="panel block min-w-[320px] flex-1 snap-start rounded-[28px] p-5 transition hover:border-cyan-300/35 hover:bg-white/[0.06] lg:min-w-[380px]"
            href={`/boards/${board.slug}`}
            key={board.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Board name</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{board.name}</h3>
                <p className="mt-2 text-sm leading-6 text-violet-100/68">{board.description ?? "No description."}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {!board.isPublic ? (
                  <span className="mono rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-200">
                    private
                  </span>
                ) : null}
                <span className="mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">open</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">Tracking</p>
              <div className="flex flex-wrap gap-2">
                {board.trackedSources.length ? (
                  board.trackedSources.map((source) => (
                    <span
                      className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-violet-100/85"
                      key={source.id}
                    >
                      {source.displayName}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-violet-100/55">No sources yet</span>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="repos" value={board.repoSourceCount} />
              <Metric label="users" value={board.userSourceCount} />
              <Metric label="events" value={board.summary.totalEvents} />
              <Metric label="members" value={board.memberCount} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="mono text-[10px] uppercase tracking-[0.22em] text-violet-200/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
