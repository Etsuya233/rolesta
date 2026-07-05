import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { useCharacterDraftSession } from "../hooks/use-character-draft-sessions";
import type { CharacterDetailResponse } from "../api/characters-api";
import type { CharacterEditorFormState } from "../model/character-editor-form";
import {
  CharacterFormSection,
  CharacterSelectField,
  CharacterTextAreaField,
  CharacterTextField,
  FormActionButton,
  FormError,
  FormSubmitButton,
} from "./character-form-fields";

export interface CharacterCardMainEditorProps {
  sessionKey: string;
  characterId?: string;
  submitLabel: string;
  onCreated?: (character: CharacterDetailResponse) => void;
  onOpenGreetings?: () => void;
}

export function CharacterCardMainEditor({
  sessionKey,
  characterId,
  submitLabel,
  onCreated,
  onOpenGreetings,
}: CharacterCardMainEditorProps) {
  const { t } = useTranslation();
  const fieldPrefix = useId();
  const [openSections, setOpenSections] = useState<string[]>([
    "basic",
    "content",
  ]);
  const { form, setForm, isPending, visibleError, submit } =
    useCharacterDraftSession({
      sessionKey,
      ...(characterId ? { characterId } : {}),
      ...(onCreated ? { onCreated } : {}),
    });
  const visibilityOptions: Array<{
    value: CharacterEditorFormState["visibility"];
    label: string;
  }> = [
    { value: "private", label: t("characters.list.privateVisibility") },
    { value: "public", label: t("characters.list.publicVisibility") },
  ];

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div
        aria-label={t("characters.editor.mainEditorLabel")}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <Accordion
          className="border-b border-border"
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          <CharacterFormSection
            description={t("characters.editor.sections.basic.description")}
            title={t("characters.editor.sections.basic.title")}
            value="basic"
          >
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label={t("characters.editor.fields.name")}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-comment`}
              label={t("characters.editor.fields.comment")}
              value={form.comment}
              onChange={(event) =>
                setForm({ ...form, comment: event.target.value })
              }
            />
            <CharacterTextField
              description={t("characters.editor.fields.tagsDescription")}
              disabled={isPending}
              id={`${fieldPrefix}-tags`}
              label={t("characters.editor.fields.tags")}
              value={form.tagsText}
              onChange={(event) =>
                setForm({ ...form, tagsText: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-version`}
              label={t("characters.editor.fields.version")}
              value={form.version}
              onChange={(event) =>
                setForm({ ...form, version: event.target.value })
              }
            />
            <CharacterSelectField
              disabled={isPending}
              id={`${fieldPrefix}-visibility`}
              label={t("characters.editor.fields.visibility")}
              options={visibilityOptions}
              value={form.visibility}
              onChange={(visibility) => setForm({ ...form, visibility })}
            />
          </CharacterFormSection>

          <CharacterFormSection
            description={t("characters.editor.sections.content.description")}
            title={t("characters.editor.sections.content.title")}
            value="content"
          >
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-description`}
              label={t("characters.editor.fields.description")}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-first-message`}
              label={t("characters.editor.fields.firstMessage")}
              value={form.firstMessage}
              onChange={(event) =>
                setForm({ ...form, firstMessage: event.target.value })
              }
            />
            {onOpenGreetings ? (
              <FormActionButton disabled={isPending} onClick={onOpenGreetings}>
                {t("characters.editor.fields.alternateGreetings")}
              </FormActionButton>
            ) : null}
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-personality`}
              label={t("characters.editor.fields.personality")}
              value={form.personality}
              onChange={(event) =>
                setForm({ ...form, personality: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-scenario`}
              label={t("characters.editor.fields.scenario")}
              value={form.scenario}
              onChange={(event) =>
                setForm({ ...form, scenario: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-creator-notes`}
              label={t("characters.editor.fields.creatorNotes")}
              value={form.creatorNotes}
              onChange={(event) =>
                setForm({ ...form, creatorNotes: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-message-example`}
              label={t("characters.editor.fields.messageExample")}
              value={form.messageExample}
              onChange={(event) =>
                setForm({ ...form, messageExample: event.target.value })
              }
            />
          </CharacterFormSection>

          <CharacterFormSection
            description={t("characters.editor.sections.prompts.description")}
            title={t("characters.editor.sections.prompts.title")}
            value="prompts"
          >
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-system-prompt`}
              label={t("characters.editor.fields.systemPrompt")}
              value={form.systemPrompt}
              onChange={(event) =>
                setForm({ ...form, systemPrompt: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-post-history`}
              label={t("characters.editor.fields.postHistoryInstructions")}
              value={form.postHistoryInstructions}
              onChange={(event) =>
                setForm({
                  ...form,
                  postHistoryInstructions: event.target.value,
                })
              }
            />
          </CharacterFormSection>

          <CharacterFormSection
            description={t("characters.editor.sections.metadata.description")}
            title={t("characters.editor.sections.metadata.title")}
            value="metadata"
          >
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-creator`}
              label={t("characters.editor.fields.creator")}
              value={form.creator}
              onChange={(event) =>
                setForm({ ...form, creator: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-nickname`}
              label={t("characters.editor.fields.nickname")}
              value={form.nickname}
              onChange={(event) =>
                setForm({ ...form, nickname: event.target.value })
              }
            />
          </CharacterFormSection>
        </Accordion>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={isPending}>{submitLabel}</FormSubmitButton>
      </div>
    </form>
  );
}
