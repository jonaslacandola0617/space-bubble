export type BubbleStatus = "processing" | "shared" | "heard" | "talking" | "settled";
export type BubbleNeed = "listen" | "comfort" | "space" | "solution" | "later";

export type Bubble = {
  id: string;
  author: "you" | "partner";
  text: string;
  status: BubbleStatus;
  need: BubbleNeed;
  x: number;
  y: number;
  size: "sm" | "md" | "lg";
  tone: "violet" | "blue" | "rose" | "pearl";
  time: string;
};

export const needLabels: Record<BubbleNeed, string> = {
  listen: "Just listen",
  comfort: "Comfort",
  space: "A little space",
  solution: "Find a solution",
  later: "Talk later",
};

export const statusLabels: Record<BubbleStatus, string> = {
  processing: "Processing",
  shared: "Shared",
  heard: "Heard",
  talking: "Talking",
  settled: "Ready to pop",
};
