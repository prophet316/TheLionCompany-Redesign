import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GatheringLine } from "@/components/client/gathering-line";

describe("GatheringLine", () => {
  it("is decorative and cannot hide server content", () => {
    render(<GatheringLine rootId="home-journey" />);
    expect(screen.getByTestId("gathering-line")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("gathering-line")).toHaveAttribute("focusable", "false");
    expect(screen.getByTestId("gathering-line").querySelectorAll("[data-stage]")).toHaveLength(4);
  });
});
