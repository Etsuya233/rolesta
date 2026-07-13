import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../lib/i18n/i18n";
import { AssetDefaultButton } from "./asset-default-button";

const hookState = vi.hoisted(() => ({
  query: {
    data: undefined as
      | undefined
      | {
          personaCharacterId: string | null;
          presetId: string | null;
          modelProviderId: string | null;
        },
    isError: false,
    isLoading: false,
  },
  mutation: {
    isPending: false,
    mutate: vi.fn(),
  },
}));

vi.mock("../hooks/use-asset-defaults", () => ({
  useAssetDefaults: () => hookState.query,
  useUpdateAssetDefaults: () => hookState.mutation,
}));

describe("AssetDefaultButton", () => {
  afterEach(cleanup);

  beforeEach(async () => {
    await i18n.changeLanguage("en-US");
    hookState.query.data = undefined;
    hookState.query.isError = false;
    hookState.query.isLoading = false;
    hookState.mutation.isPending = false;
    hookState.mutation.mutate.mockReset();
  });

  it("shows a disabled spinner while preferences load", () => {
    hookState.query.isLoading = true;
    const { container } = renderButton();

    expect(
      screen.getByRole("button", { name: "Loading default state" }),
    ).toBeDisabled();
    expect(
      container.querySelector(".lucide-loader-circle"),
    ).toBeInTheDocument();
  });

  it("shows a clickable empty circle after a read failure and sets the default", () => {
    hookState.query.isError = true;
    const { container } = renderButton();
    const button = screen.getByRole("button", {
      name: "Set as default Persona",
    });

    expect(button).toBeEnabled();
    expect(container.querySelector(".lucide-circle")).toBeInTheDocument();
    fireEvent.click(button);
    expect(hookState.mutation.mutate).toHaveBeenCalledWith({
      personaCharacterId: "character",
    });
  });

  it("shows the checked circle and clears the current default", () => {
    hookState.query.data = {
      personaCharacterId: "character",
      presetId: null,
      modelProviderId: null,
    };
    const { container } = renderButton();
    const button = screen.getByRole("button", {
      name: "Remove default Persona",
    });

    expect(container.querySelector(".lucide-circle-check")).toBeInTheDocument();
    fireEvent.click(button);
    expect(hookState.mutation.mutate).toHaveBeenCalledWith({
      personaCharacterId: null,
    });
  });

  it("disables only while its preference patch is pending", () => {
    hookState.mutation.isPending = true;
    renderButton();

    expect(
      screen.getByRole("button", { name: "Set as default Persona" }),
    ).toBeDisabled();
  });

  it("does not render for an asset owned by another user", () => {
    renderButton({ ownerUserId: "other" });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

function renderButton(overrides: { ownerUserId?: string } = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AssetDefaultButton
        assetId="character"
        currentUserId="owner"
        kind="persona"
        ownerUserId={overrides.ownerUserId ?? "owner"}
      />
    </I18nextProvider>,
  );
}
