import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "#24151f",
          color: "#f3e9d7",
          fontFamily: "Georgia, serif",
          fontSize: 112,
        }}
      >
        L
      </div>
    ),
    size,
  );
}
