import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#24151f",
          color: "#f3e9d7",
          fontFamily: "Georgia, serif",
          fontSize: 22,
        }}
      >
        L
      </div>
    ),
    size,
  );
}
