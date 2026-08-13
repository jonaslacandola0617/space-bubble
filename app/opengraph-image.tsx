import { ImageResponse } from "next/og";

export const alt = "Space Bubble — a quiet shared space for calmer conversations";
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
          background: "linear-gradient(135deg, #070711 0%, #111027 58%, #080914 100%)",
          color: "#f8f7ff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 999,
            left: -120,
            top: 110,
            background: "rgba(111, 91, 182, 0.18)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 390,
            height: 390,
            borderRadius: 999,
            right: 70,
            top: 80,
            background: "rgba(82, 151, 208, 0.14)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 235,
            height: 235,
            borderRadius: 999,
            right: 255,
            bottom: -55,
            background: "rgba(188, 116, 157, 0.14)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 720,
            paddingLeft: 86,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 38,
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(206,198,255,.75)",
                marginRight: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 999,
                  border: "1px solid rgba(206,198,255,.8)",
                }}
              />
            </div>
            Space Bubble
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 64,
              lineHeight: 1.06,
              letterSpacing: "-0.045em",
              fontWeight: 650,
              maxWidth: 660,
            }}
          >
            A quiet place for what’s floating between you.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 28,
              color: "rgba(240,238,255,.72)",
              fontSize: 23,
              lineHeight: 1.5,
              maxWidth: 620,
            }}
          >
            Share thoughts at your own pace, check in on your energy, and make room for calmer conversations.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
