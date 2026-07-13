import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getFormErrorMessage } from "../../../lib/forms/form-error";
import { notify } from "../../../lib/notifications/notify";
import {
  getAssetDefaults,
  updateAssetDefaults,
} from "../api/chat-preferences-api";

export const assetDefaultsQueryKey = ["chat-preferences", "assets"] as const;
const assetDefaultsLoadErrorNotificationId = "chat-asset-defaults-load-error";

export function useAssetDefaults() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: assetDefaultsQueryKey,
    queryFn: getAssetDefaults,
  });

  useEffect(() => {
    if (query.isError) {
      notify.error({
        id: assetDefaultsLoadErrorNotificationId,
        title: t("chatPreferences.loadFailed"),
      });
    }
  }, [query.isError, t]);

  return query;
}

export function useUpdateAssetDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetDefaults,
    onSuccess(assetDefaults) {
      queryClient.setQueryData(assetDefaultsQueryKey, assetDefaults);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });
}
