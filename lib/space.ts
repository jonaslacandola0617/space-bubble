export type BubbleStatus = "processing" | "shared" | "heard" | "talking" | "settled";
export type BubbleNeed = "listen" | "comfort" | "space" | "solution" | "later";

export type Bubble = {
  id: number;
  author: "you" | "mica";
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

export const seedBubbles: Bubble[] = [
  { id: 1, author: "mica", text: "I miss us lately. I don't need an answer right away — I just want you to know where I am.", status: "heard", need: "listen", x: 18, y: 31, size: "lg", tone: "rose", time: "12 min ago" },
  { id: 2, author: "you", text: "I think I'm more exhausted than upset. I'm still sorting through it, but I don't want my silence to feel like I don't care.", status: "processing", need: "later", x: 62, y: 22, size: "md", tone: "blue", time: "38 min ago" },
  { id: 3, author: "mica", text: "Can we make a little time that's ours this weekend? Even coffee after the kids are asleep.", status: "shared", need: "solution", x: 73, y: 61, size: "lg", tone: "violet", time: "Yesterday" },
  { id: 4, author: "you", text: "Thank you for carrying so much today. I noticed it, even if I didn't say it properly.", status: "settled", need: "comfort", x: 37, y: 70, size: "sm", tone: "pearl", time: "Yesterday" },
];
