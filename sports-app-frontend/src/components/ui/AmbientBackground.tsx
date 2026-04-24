// Ambient drifting orbs + subtle film-grain noise overlay.
// Mounted once globally in App.tsx. Pointer-events-none so it never blocks UI.

const NOISE_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`;

const AmbientBackground = () => {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Drifting orbs */}
      <div
        className="absolute rounded-full blur-3xl opacity-[0.10]"
        style={{
          width: "42rem",
          height: "42rem",
          top: "-10rem",
          left: "-10rem",
          background: "hsl(var(--primary))",
          animation: "drift1 28s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-[0.08]"
        style={{
          width: "36rem",
          height: "36rem",
          bottom: "-8rem",
          right: "-8rem",
          background: "hsl(var(--sport-basketball))",
          animation: "drift2 32s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-[0.07]"
        style={{
          width: "30rem",
          height: "30rem",
          top: "30%",
          left: "50%",
          background: "hsl(var(--sport-volleyball))",
          animation: "drift3 36s ease-in-out infinite",
        }}
      />

      {/* Film-grain noise */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      />
    </div>
  );
};

export default AmbientBackground;
