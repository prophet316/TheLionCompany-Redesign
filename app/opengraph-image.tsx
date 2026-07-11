import { ImageResponse } from "next/og";

export const alt = "The Lion Company — The Gathering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#f3e9d7",
          color: "#24151f",
          padding: "76px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 760,
            height: 760,
            border: "4px solid #964532",
            borderRadius: "50%",
            right: -250,
            top: -300,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            border: "2px solid #964532",
            borderRadius: "50%",
            right: -70,
            top: -130,
            display: "flex",
            opacity: 0.65,
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: 24,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          The Lion Company
        </div>
        <div style={{ display: "flex", maxWidth: 880, flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 96, lineHeight: 0.94 }}>
            Many lives.
            <br />
            One center: Jesus.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontFamily: "Arial, sans-serif",
              fontSize: 28,
            }}
          >
            Seen → Gathered → Formed → Sent
          </div>
        </div>
      </div>
    ),
    size,
  );
}
