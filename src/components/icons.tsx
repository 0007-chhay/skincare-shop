type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const MenuIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const SearchIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const TelegramIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M21 4L3 11l6 2 2 6 3-4 5 4z" /></svg>
);
export const BackIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M15 5l-7 7 7 7" /></svg>
);
export const TrashIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></svg>
);
