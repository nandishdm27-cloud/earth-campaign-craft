import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play } from "lucide-react";
import type { AudioItem } from "@/lib/campaign";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  item: AudioItem;
  index: number;
  label: string;
  activeId: number | null;
  onPlay: (index: number) => void;
};

export function AudioCard({ item, index, label, activeId, onPlay }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  // Pause when another card takes over.
  useEffect(() => {
    if (activeId !== index && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [activeId, index]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      onPlay(index);
      void el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (el && Number.isFinite(duration) && duration > 0) {
      el.currentTime = (value / 100) * duration;
      setCurrent(el.currentTime);
    }
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <article className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause ${label}` : `Play ${label}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-[1px]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-sm font-semibold text-foreground">{label}</h3>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>

          <div className="relative mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={Number.isFinite(progress) ? progress : 0}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={`Seek ${label}`}
              className="absolute inset-0 h-4 w-full -translate-y-1/3 cursor-pointer opacity-0"
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{item.mimeType}</p>
        </div>

        <a
          href={item.src}
          download={`climate-campaign-${index + 1}`}
          aria-label={`Download ${label}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Download className="size-4" />
        </a>
      </div>

      {failed && (
        <p className="mt-3 text-xs text-destructive">
          This audio track could not be played in your browser. Try downloading it instead.
        </p>
      )}

      <audio
        ref={audioRef}
        src={item.src}
        preload="metadata"
        controls
        className="mt-4 w-full [color-scheme:dark]"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setFailed(true)}
      />
    </article>
  );
}