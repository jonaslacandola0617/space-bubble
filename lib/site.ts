export const siteName = "Space Bubble";
export const siteTitle = "Space Bubble — A Quiet Space for Better Communication";
export const siteDescription =
  "A private shared space for couples to check in, share thoughts at their own pace, and make room for calmer conversations.";

export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicitUrl) return explicitUrl;

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
