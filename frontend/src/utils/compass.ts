import type { Vote } from "../types";

export type Cluster = {
  x: number;
  y: number;
  count: number;
};

const GRID_SIZE = 15;

export function clusterVotes(votes: Vote[]): Cluster[] {
  const cells = new Map<string, { sumX: number; sumY: number; count: number }>();

  for (const vote of votes) {
    const col = Math.min(Math.floor(((vote.x + 100) / 200) * GRID_SIZE), GRID_SIZE - 1);
    const row = Math.min(Math.floor(((vote.y + 100) / 200) * GRID_SIZE), GRID_SIZE - 1);
    const key = `${col},${row}`;
    const cell = cells.get(key) ?? { sumX: 0, sumY: 0, count: 0 };
    cell.sumX += vote.x;
    cell.sumY += vote.y;
    cell.count++;
    cells.set(key, cell);
  }

  return Array.from(cells.values()).map(({ sumX, sumY, count }) => ({
    x: sumX / count,
    y: sumY / count,
    count,
  }));
}

export function clusterDotSize(count: number): number {
  return Math.min(8 + Math.sqrt(count - 1) * 6, 32);
}

const PALETTE: [number, number, number][] = [
  [0x4e, 0x8f, 0xc7],
  [0x84, 0xb1, 0x9b],
  [0xc2, 0xb9, 0x7f],
  [0xd9, 0x8c, 0x45],
  [0xc9, 0x56, 0x3a],
  [0x8b, 0x20, 0x20],
];

export function clusterDotColor(count: number, maxCount: number): string {
  const t = maxCount <= 1 ? 1 : (count - 1) / (maxCount - 1);
  const scaled = t * (PALETTE.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, PALETTE.length - 1);
  const u = scaled - lo;
  const [r, g, b] = [0, 1, 2].map((i) =>
    Math.round(PALETTE[lo][i] + (PALETTE[hi][i] - PALETTE[lo][i]) * u)
  );
  return `rgb(${r}, ${g}, ${b})`;
}

export function getOrCreateVoterId(): string {
  const existing = localStorage.getItem("chaoticmeter_voter_id");
  if (existing) return existing;

  const newId = crypto.randomUUID();
  localStorage.setItem("chaoticmeter_voter_id", newId);
  return newId;
}

export function calculateAverage(votes: Vote[]) {
  if (!votes.length) {
    return { x: 0, y: 0 };
  }

  const total = votes.reduce(
    (acc, vote) => {
      acc.x += vote.x;
      acc.y += vote.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: total.x / votes.length,
    y: total.y / votes.length,
  };
}

export function pointToPercent(x: number, y: number) {
  return {
    left: ((x + 100) / 200) * 100,
    top: 100 - ((y + 100) / 200) * 100,
  };
}

export function getVoteFromClick(
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  element: HTMLDivElement
) {
  const rect = element.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  const x = (px / rect.width) * 200 - 100;
  const y = ((rect.height - py) / rect.height) * 200 - 100;

  return {
    x: Math.max(-100, Math.min(100, x)),
    y: Math.max(-100, Math.min(100, y)),
  };
}

type VerdictResult = {
  title: string;
  description: string;
  moralLabel: string;
  funLabel: string;
};

function getMoralLabel(x: number): string {
  if (x <= -60) return "Wholesome";
  if (x <= -20) return "Mostly Right";
  if (x < 20) return "Morally Mixed";
  if (x < 60) return "Questionable";
  return "Deeply Wrong";
}

function getFunLabel(y: number): string {
  if (y >= 60) return "Very Funny";
  if (y >= 20) return "Kinda Funny";
  if (y > -20) return "Mildly Mid";
  if (y > -60) return "Getting Dry";
  return "Bone Dry";
}

function getIntensity(x: number, y: number): "mild" | "strong" | "extreme" {
  const magnitude = Math.max(Math.abs(x), Math.abs(y));
  if (magnitude < 40) return "mild";
  if (magnitude < 70) return "strong";
  return "extreme";
}

export function getVerdict(x: number, y: number): VerdictResult {
  const moralLabel = getMoralLabel(x);
  const funLabel = getFunLabel(y);
  const intensity = getIntensity(x, y);

  // Q1: Wholesome + Funny
  if (x < 0 && y >= 0) {
    const verdicts = {
      mild: { title: "Chaotic Good-ish", description: "Technically fine. Suspiciously fun." },
      strong: { title: "Wholesome Chaos", description: "Pure in spirit, unhinged in execution. Weirdly lovable." },
      extreme: { title: "Certified Feral Angel", description: "Too pure to cancel, too unhinged to trust with scissors." },
    };
    return { ...verdicts[intensity], moralLabel, funLabel };
  }

  // Q2: Questionable + Funny
  if (x >= 0 && y >= 0) {
    const verdicts = {
      mild: { title: "Morally Flexible", description: "You're laughing. You probably shouldn't be." },
      strong: { title: "Criminally Funny", description: "Bad decision. Outstanding comedic value." },
      extreme: { title: "A War Crime, But Make It Comedy", description: "Legal has concerns. The audience is delighted." },
    };
    return { ...verdicts[intensity], moralLabel, funLabel };
  }

  // Q3: Wholesome + Unfunny
  if (x < 0 && y < 0) {
    const verdicts = {
      mild: { title: "Quietly Decent", description: "Nothing wrong here. Nothing funny either." },
      strong: { title: "Pure but Dry", description: "Morally solid. Comedically deceased." },
      extreme: { title: "Corporate Retreat Energy", description: "You could keynote a wellness seminar. No one would laugh. Or remember." },
    };
    return { ...verdicts[intensity], moralLabel, funLabel };
  }

  // Q4: Questionable + Unfunny
  const verdicts = {
    mild: { title: "Mildly Sus", description: "Not funny AND slightly off. Interesting choice." },
    strong: { title: "Pointless Villainy", description: "Wrong and not even entertaining. Bleak." },
    extreme: { title: "Void Energy", description: "A joyless act of chaos. Respect the commitment." },
  };
  return { ...verdicts[intensity], moralLabel, funLabel };
}