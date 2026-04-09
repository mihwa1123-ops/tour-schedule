import { ImageResponse } from "next/og";

// App Router 아이콘 convention
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
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
          background: "#eef2ff",
          fontSize: 24,
          borderRadius: 6,
        }}
      >
        🚌
      </div>
    ),
    { ...size }
  );
}
