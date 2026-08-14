const HomePage = () => (
    <main
        style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "1.5rem",
            maxWidth: "34rem"
        }}
    >
        <h1 style={{ fontSize: "1rem", fontWeight: 500, margin: 0, letterSpacing: "0.02em" }}>
            ALTERED
        </h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>Knowledge orchestration infrastructure.</p>
    </main>
)

export default HomePage
