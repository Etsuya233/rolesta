import type { ApiErrorEnvelope } from "@rolesta/shared";
import { toast, type ExternalToast } from "sonner";
import type { ApiError } from "../api/client";
import { formatApiMessage } from "../i18n/api-error-message";

export type NotificationAction = {
  label: string;
  onClick: () => void;
};

export type NotificationContent = {
  title: string;
  description?: string;
  duration?: number;
  action?: NotificationAction;
};

export type ApiResponseError = ApiError & {
  kind: "response";
  envelope: ApiErrorEnvelope;
};

function toToastOptions({
  description,
  duration,
  action,
}: NotificationContent): ExternalToast {
  return {
    ...(description === undefined ? {} : { description }),
    ...(duration === undefined ? {} : { duration }),
    ...(action === undefined ? {} : { action }),
  };
}

export const notify = {
  success(content: NotificationContent) {
    return toast.success(content.title, toToastOptions(content));
  },

  info(content: NotificationContent) {
    return toast.info(content.title, toToastOptions(content));
  },

  warning(content: NotificationContent) {
    return toast.warning(content.title, toToastOptions(content));
  },

  error(content: NotificationContent) {
    return toast.error(content.title, toToastOptions(content));
  },

  apiError(error: ApiResponseError) {
    return toast.error(
      formatApiMessage(error.envelope.msg, error.envelope.data),
    );
  },
};
