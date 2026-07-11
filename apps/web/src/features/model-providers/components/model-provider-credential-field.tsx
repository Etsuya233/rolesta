import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import { Field, FieldLabel } from "../../../components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../../../components/ui/input-group";
import type { ModelProviderEditorFormState } from "../model/model-provider-editor-form";
import { ModelProviderApiKeyVaultDialog } from "./model-provider-api-key-vault-dialog";

export function ModelProviderCredentialField({
  form,
  disabled,
  onChange,
}: {
  form: ModelProviderEditorFormState;
  disabled: boolean;
  onChange: (form: ModelProviderEditorFormState) => void;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const selected = form.credentialMode === "vault";

  return (
    <Field data-disabled={disabled}>
      <FieldLabel htmlFor="model-provider-secret">
        {t("modelProviders.editor.fields.apiKey")}
      </FieldLabel>
      <div className="flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            id="model-provider-secret"
            disabled={disabled}
            readOnly={selected}
            type={selected || visible ? "text" : "password"}
            value={
              selected
                ? t("modelProviders.editor.credentials.selected", {
                    name: form.apiKeyName,
                  })
                : form.secret
            }
            onClick={() => {
              if (selected)
                onChange({
                  ...form,
                  credentialMode: "manual",
                  secret: "",
                  apiKeyId: null,
                  apiKeyName: null,
                });
            }}
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
          {!selected ? (
            <InputGroupAddon>
              <InputGroupButton
                aria-label={
                  visible
                    ? t("modelProviders.editor.credentials.hide")
                    : t("modelProviders.editor.credentials.show")
                }
                onClick={() => setVisible((current) => !current)}
              >
                {visible ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <Button
          aria-label={t("modelProviders.apiKeys.openVault")}
          disabled={disabled}
          size="icon"
          type="button"
          variant="outline"
          onClick={() => setVaultOpen(true)}
        >
          <KeyRound />
        </Button>
      </div>
      <ModelProviderApiKeyVaultDialog
        open={vaultOpen}
        selectedApiKeyId={form.apiKeyId}
        onOpenChange={setVaultOpen}
        onSelect={(apiKey) =>
          onChange({
            ...form,
            credentialMode: "vault",
            secret: "",
            apiKeyId: apiKey.id,
            apiKeyName: apiKey.name,
          })
        }
        onSelectedKeyDeleted={() =>
          onChange({
            ...form,
            credentialMode: "manual",
            secret: "",
            apiKeyId: null,
            apiKeyName: null,
          })
        }
      />
    </Field>
  );
}
