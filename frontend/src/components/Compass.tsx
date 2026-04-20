import { useEffect, useRef, useState } from "react";
import type { Vote } from "../types";
import {
  calculateAverage,
  clusterDotColor,
  clusterDotSize,
  clusterVotes,
  getVerdict,
  getVoteFromClick,
  pointToPercent,
} from "../utils/compass";

type CompassProps = {
  votes: Vote[];
  onVote: (x: number, y: number) => void;
};

export default function Compass({ votes, onVote }: CompassProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const average = calculateAverage(votes);
  const verdict = getVerdict(average.x, average.y);
  const clusters = clusterVotes(votes);
  const maxCount = clusters.reduce((m, c) => Math.max(m, c.count), 1);

  function quadrantColor(x: number, y: number): string {
    if (x < 0 && y >= 0) return "#5a9e7a";
    if (x >= 0 && y >= 0) return "#c9563a";
    if (x < 0 && y < 0) return "#4e8fc7";
    return "#d98c45";
  }
  const [hoverPos, setHoverPos] = useState<{ color: string; left: number; top: number } | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const lastGifFetch = useRef<number>(0);
  const GIF_COOLDOWN_MS = 15_000;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
    if (!apiKey || votes.length === 0) { setGifUrl(null); return; }

    const now = Date.now();
    if (now - lastGifFetch.current < GIF_COOLDOWN_MS) return;
    lastGifFetch.current = now;

    const query = encodeURIComponent(verdict.title);
    fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=5&rating=g&lang=en`)
      .then((r) => r.json())
      .then((data) => {
        const gifs = data.data;
        if (gifs?.length > 0) {
          const pick = gifs[Math.floor(Math.random() * gifs.length)];
          setGifUrl(pick.images.fixed_height_small.url);
        }
      })
      .catch(() => {});
  }, [verdict.title]);

  function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (!ref.current) return;
    const { x, y } = getVoteFromClick(event, ref.current);
    onVote(x, y);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const { x, y } = getVoteFromClick(event, ref.current);
    const rect = ref.current.getBoundingClientRect();
    const left = ((event.clientX - rect.left) / rect.width) * 100;
    const top = ((event.clientY - rect.top) / rect.height) * 100;
    setHoverPos({ color: quadrantColor(x, y), left, top });
  }

  function handleMouseLeave() {
    setHoverPos(null);
  }

  return (
    <div>
      <div ref={ref} onClick={handleClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="compass">
        <div className="quadrant q1" />
        <div className="quadrant q2" />
        <div className="quadrant q3" />
        <div className="quadrant q4" />
        <div className="axis-horizontal" />
        <div className="axis-vertical" />

        {hoverPos && (
          <div
            className="hover-dot"
            style={{ left: `${hoverPos.left}%`, top: `${hoverPos.top}%`, background: hoverPos.color }}
          />
        )}

        {clusters.map((cluster, i) => {
          const point = pointToPercent(cluster.x, cluster.y);
          const size = clusterDotSize(cluster.count);
          return (
            <div
              key={i}
              className="cluster-dot"
              style={{
                left: `${point.left}%`,
                top: `${point.top}%`,
                width: size,
                height: size,
                background: clusterDotColor(cluster.count, maxCount),
              }}
            />
          );
        })}

        <div className="axis-label axis-label-top">Funny</div>
        <div className="axis-label axis-label-bottom">Dry</div>
        <div className="axis-label axis-label-left">Wholesome</div>
        <div className="axis-label axis-label-right">Questionable</div>
      </div>

      <div className="verdict-card">
        <h2 className="verdict-title">{verdict.title}</h2>

        <p className="verdict-description">{verdict.description}</p>

        <div className="verdict-badges">
          <span
            className="badge"
            style={{ background: `${quadrantColor(average.x, average.y)}22`, borderColor: `${quadrantColor(average.x, average.y)}55` }}
          >
            {verdict.moralLabel}
          </span>
          <span
            className="badge"
            style={{ background: `${quadrantColor(average.x, average.y)}22`, borderColor: `${quadrantColor(average.x, average.y)}55` }}
          >
            {verdict.funLabel}
          </span>
        </div>

        <p className="verdict-vote-count">
          Based on {votes.length} vote{votes.length !== 1 ? "s" : ""}
        </p>

        {gifUrl && (
          <div className="verdict-gif-wrap">
            <img className="verdict-gif" src={gifUrl} alt={verdict.title} />
          </div>
        )}
      </div>
    </div>
  );
}