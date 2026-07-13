import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Field, FieldLabel } from "../../../components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../components/ui/input-group";
import { cn } from "../../../lib/utils";
import { listApiKeys } from "../api/model-providers-api";
import type { ModelProviderEditorFormState } from "../model/model-provider-editor-form";
import { sortApiKeysByName } from "../model/model-provider-api-key-sort";

export function ModelProviderCredentialField({
  form,
  disabled,
  onChange,
  onManageApiKeys,
}: {
  form: ModelProviderEditorFormState;
  disabled: boolean;
  onChange: (form: ModelProviderEditorFormState) => void;
  onManageApiKeys: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = form.credentialMode === "vault";
  const query = useQuery({
    enabled: menuOpen,
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
  });
  const apiKeys = useMemo(
    () => sortApiKeysByName(query.data?.items ?? [], i18n.language),
    [i18n.language, query.data?.items],
  );

  const clearCredential = () =>
    onChange({
      ...form,
      credentialMode: "manual",
      secret: "",
      apiKeyId: null,
      apiKeyName: null,
    });

  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor="model-provider-secret">
        {t("modelProviders.editor.fields.apiKey")}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            autoComplete="off"
            className={cn(!selected && !visible && "[-webkit-text-security:disc]")}
            disabled={disabled}
            id="model-provider-secret"
            readOnly={selected}
            type="text"
            value={
              selected
                ? t("modelProviders.editor.credentials.selected", {
                    name: form.apiKeyName,
                  })
                : form.secret
            }
            onChange={(event) =>
              onChange({
                ...form,
                credentialMode: "manual",
                secret: event.target.value,
                apiKeyId: null,
                apiKeyName: null,
              })
            }
          />
          <InputGroupAddon>
            <InputGroupButton
              aria-label={
                selected
                  ? t("modelProviders.editor.credentials.clear")
                  : visible
                    ? t("modelProviders.editor.credentials.hide")
                    : t("modelProviders.editor.credentials.show")
              }
              onClick={selected ? clearCredential : () => setVisible((current) => !current)}
            >
              {selected ? <X /> : visible ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("modelProviders.apiKeys.openVault")}
              disabled={disabled}
              size="icon"
              type="button"
              variant="outline"
            >
              <KeyRound />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuRadioGroup
              value={form.apiKeyId ?? ""}
              onValueChange={(apiKeyId) => {
                const apiKey = apiKeys.find((item) => item.id === apiKeyId)!;
                onChange({
                  ...form,
                  credentialMode: "vault",
                  secret: "",
                  apiKeyId: apiKey.id,
                  apiKeyName: apiKey.name,
                });
              }}
            >
              {query.isLoading ? (
                <DropdownMenuItem disabled>{t("modelProviders.apiKeys.loading")}</DropdownMenuItem>
              ) : null}
              {query.isError ? (
                <DropdownMenuItem disabled>{t("modelProviders.apiKeys.loadFailed")}</DropdownMenuItem>
              ) : null}
              {query.isSuccess && apiKeys.length === 0 ? (
                <DropdownMenuItem disabled>{t("modelProviders.apiKeys.empty")}</DropdownMenuItem>
              ) : null}
              {apiKeys.map((apiKey) => (
                <DropdownMenuRadioItem key={apiKey.id} value={apiKey.id}>
                  <span className="truncate">{apiKey.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onManageApiKeys}>
                <Settings />
                {t("modelProviders.apiKeys.manageAction")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Field>
  );
}
