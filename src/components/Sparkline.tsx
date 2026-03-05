export default function Sparkline({ color = "hsl(var(--primary))" }: { color?: string }) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const y = 20 + Math.sin(i * 0.8 + Math.random()) * 12;
    return `${i * 9},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 40" className="w-full h-8 mt-2 opacity-40">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
