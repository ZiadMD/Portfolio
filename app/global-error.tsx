"use client"

export default function GlobalError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <html>
      <body
        style={{
          background: "#080808",
          color: "#f0ede8",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "#c9191e",
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Something went wrong
          </p>
          <button
            onClick={reset}
            style={{
              border: "1px solid #333",
              background: "transparent",
              color: "#888",
              padding: "10px 24px",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
