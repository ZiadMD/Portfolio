export default function LavaBlobs() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 3 }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: "45%",
          height: "55%",
          background:
            "radial-gradient(circle, rgba(201,25,30,0.42) 0%, rgba(160,10,15,0.27) 50%, transparent 75%)",
          filter: "blur(28px)",
          top: "10%",
          left: "15%",
          animation: "blob1 9s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "38%",
          height: "42%",
          background:
            "radial-gradient(circle, rgba(180,0,10,0.39) 0%, rgba(140,0,8,0.23) 55%, transparent 78%)",
          filter: "blur(22px)",
          bottom: "8%",
          right: "8%",
          animation: "blob2 11s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "30%",
          height: "35%",
          background:
            "radial-gradient(circle, rgba(220,40,40,0.33) 0%, rgba(190,20,20,0.18) 55%, transparent 78%)",
          filter: "blur(18px)",
          top: "50%",
          left: "55%",
          animation: "blob3 13s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "20%",
          height: "22%",
          background:
            "radial-gradient(circle, rgba(255,60,60,0.48) 0%, rgba(210,20,20,0.24) 60%, transparent 80%)",
          filter: "blur(14px)",
          top: "30%",
          right: "22%",
          animation: "blob4 7s ease-in-out infinite",
        }}
      />
    </div>
  );
}
