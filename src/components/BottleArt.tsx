// រូបដបគំរូ — បង្ហាញពេលផលិតផលមិនទាន់មានរូបថត
export function BottleArt({ tint, className }: { tint: string; className?: string }) {
  return (
    <svg viewBox="0 0 90 200" className={className} aria-hidden="true">
      <rect x="32" y="0" width="26" height="22" rx="5" fill="#10231C" />
      <rect x="26" y="20" width="38" height="20" rx="4" fill="#9FC1B4" />
      <rect x="4" y="40" width="82" height="160" rx="20" fill="#FFFFFF" />
      <rect x="20" y="100" width="50" height="34" rx="4" fill={tint} />
    </svg>
  );
}
