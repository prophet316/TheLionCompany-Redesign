import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Lion Company",
    short_name: "Lion Company",
    description: "Christian unity, authentic discipleship, teaching, prayer, and connection centered on Jesus.",
    start_url: "/",
    display: "minimal-ui",
    background_color: "#f3e9d7",
    theme_color: "#24151f",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }],
  };
}
