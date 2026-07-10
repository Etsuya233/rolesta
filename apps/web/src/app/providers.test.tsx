import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "./providers";

vi.mock("../components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

describe("AppProviders", () => {
  it("mounts a single global toaster with the application providers", () => {
    render(
      <AppProviders>
        <div>Application content</div>
      </AppProviders>,
    );

    expect(screen.getByText("Application content")).toBeInTheDocument();
    expect(screen.getAllByTestId("toaster")).toHaveLength(1);
  });
});
