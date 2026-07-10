import {
  ERROR_CODES,
  I18N_MESSAGE_PREFIX,
  type ApiErrorEnvelope,
} from "@rolesta/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { changeLocale } from "../i18n/i18n";
import { notify, type ApiResponseError } from "./notify";

const sonner = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sonner", () => sonner);

describe("notify", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the supported notification variants with their content", () => {
    const action = { label: "Undo", onClick: vi.fn() };

    notify.success({
      title: "Saved",
      description: "Your changes are available.",
    });
    notify.info({ title: "Import started" });
    notify.warning({ title: "Connection is slow" });
    notify.error({ title: "Could not save", duration: 10_000, action });

    expect(sonner.toast.success).toHaveBeenCalledWith("Saved", {
      description: "Your changes are available.",
    });
    expect(sonner.toast.info).toHaveBeenCalledWith("Import started", {});
    expect(sonner.toast.warning).toHaveBeenCalledWith("Connection is slow", {});
    expect(sonner.toast.error).toHaveBeenCalledWith("Could not save", {
      duration: 10_000,
      action,
    });
  });

  it("translates an API response error before showing it", async () => {
    await changeLocale("en-US");
    const envelope: ApiErrorEnvelope = {
      code: ERROR_CODES.VALIDATION_FAILED,
      msg: `${I18N_MESSAGE_PREFIX}errors.passwordTooShort`,
      data: { min: 8 },
    };
    const error = new ApiError(envelope.msg, {
      kind: "response",
      code: envelope.code,
      envelope,
    }) as ApiResponseError;

    notify.apiError(error);

    expect(sonner.toast.error).toHaveBeenCalledWith(
      "Password must be at least 8 characters.",
    );
  });
});
