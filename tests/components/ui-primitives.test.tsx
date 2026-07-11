import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionLink } from "@/components/ui/action-link";
import { ChannelMark } from "@/components/ui/channel-mark";
import { SectionHeading } from "@/components/ui/section-heading";

describe("experience UI primitives", () => {
  it("renders an external action with safe browsing semantics", () => {
    render(
      <ActionLink href="https://example.com" external>
        Visit
      </ActionLink>,
    );
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
    expect(screen.getByRole("link", { name: /visit/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("preserves a logical heading and a text fallback channel mark", () => {
    render(
      <>
        <SectionHeading eyebrow="Watch" title="Teachings for real life" id="watch" />
        <ChannelMark label="YouTube" />
      </>,
    );
    expect(screen.getByRole("heading", { level: 2, name: /teachings/i })).toHaveAttribute(
      "id",
      "watch",
    );
    expect(screen.getByText("YO", { selector: "[aria-hidden=true]" })).toBeVisible();
    expect(screen.getByText("YouTube", { selector: ".sr-only" })).toBeVisible();
  });
});
