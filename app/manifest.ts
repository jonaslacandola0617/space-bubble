import type { MetadataRoute } from "next";
import { siteDescription } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Space Bubble",
    short_name: "Space Bubble",
    description: siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#070711",
    theme_color: "#070711",
    orientation: "portrait-primary",
    categories: ["lifestyle", "social"],
  };
}
