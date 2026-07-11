import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="section shell"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div>{children}</div></header>;
}
