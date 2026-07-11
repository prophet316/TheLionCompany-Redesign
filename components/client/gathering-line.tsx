"use client";

import { useLayoutEffect, useRef } from "react";
import { gatheringLineStages } from "@/lib/art/gathering-line";
import styles from "./gathering-line.module.css";

export function GatheringLine({ rootId }: { readonly rootId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const root = document.getElementById(rootId);
    const svg = svgRef.current;
    if (!root || !svg || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let active = true;
    let cleanup = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollModule]) => {
        if (!active) return;
        const gsap = gsapModule.default;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        const context = gsap.context(() => {
          const stages = ["mane", "connection", "waveform", "network"] as const;
          const stagePairs = stages.map((name) => ({
            name,
            art: svg.querySelector(`[data-stage="${name}"]`),
            section: root.querySelector(`[data-gathering-stage="${name}"]`),
          }));
          for (const pair of stagePairs) {
            if (!pair.art || !pair.section) throw new Error(`Gathering stage is incomplete: ${pair.name}`);
          }
          gsap.set(svg.querySelectorAll("[data-stage] path"), { strokeDasharray: 1, strokeDashoffset: 1 });

          media.add("(min-width: 64rem)", () => {
            for (const pair of stagePairs) {
              const paths = pair.art!.matches("path") ? [pair.art] : pair.art!.querySelectorAll("path");
              gsap.to(paths, {
                strokeDashoffset: 0,
                ease: "none",
                scrollTrigger: { trigger: pair.section!, start: "top 78%", end: "bottom 38%", scrub: 0.35 },
              });
            }
            const manifesto = root.querySelector<HTMLElement>("[data-manifesto]");
            if (manifesto) ScrollTrigger.create({ trigger: manifesto, start: "top top", end: "+=110%", pin: true, pinSpacing: true });
            gsap.utils.toArray<HTMLElement>("[data-reveal-mask]", root).forEach((item) => {
              gsap.fromTo(item, { clipPath: "inset(0 0 100% 0)", yPercent: 8, opacity: 0.35 }, {
                clipPath: "inset(0 0 0% 0)", yPercent: 0, opacity: 1,
                scrollTrigger: { trigger: item, start: "top 78%", end: "top 42%", scrub: true },
              });
            });
            const parallax = root.querySelector<HTMLElement>("[data-parallax]");
            if (parallax) gsap.to(parallax, { yPercent: -8, ease: "none", scrollTrigger: { trigger: parallax, start: "top bottom", end: "bottom top", scrub: 0.45 } });
          });

          media.add("(max-width: 63.99rem)", () => {
            for (const pair of stagePairs) {
              const paths = pair.art!.matches("path") ? [pair.art] : pair.art!.querySelectorAll("path");
              gsap.to(paths, { strokeDashoffset: 0, duration: 0.65, ease: "power1.out", scrollTrigger: { trigger: pair.section!, start: "top 82%", toggleActions: "play none none reverse" } });
              gsap.from(pair.section!, { y: 24, opacity: 0.72, duration: 0.55, ease: "power1.out", scrollTrigger: { trigger: pair.section!, start: "top 86%", toggleActions: "play none none reverse" } });
            }
          });
        }, root);
        cleanup = () => {
          media.revert();
          context.revert();
        };
      },
    );
    return () => {
      active = false;
      cleanup();
    };
  }, [rootId]);

  return (
    <svg ref={svgRef} className={styles.line} data-testid="gathering-line" aria-hidden="true" focusable="false" viewBox="0 0 240 1600" preserveAspectRatio="none">
      {gatheringLineStages.map((stage) => (
        <g data-stage={stage.name} key={stage.name}>
          {stage.paths.map((path) => <path d={path} key={path} pathLength="1" />)}
          {stage.circles.map(([cx, cy, radius]) => <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={radius} />)}
        </g>
      ))}
    </svg>
  );
}
