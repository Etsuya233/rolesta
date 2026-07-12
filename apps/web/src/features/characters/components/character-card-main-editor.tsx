import type { TFunction } from "i18next";
import { BadgeInfo, FileText, MessageSquareText, UserRound } from "lucide-react";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Accordion } from "../../../components/ui/accordion";
import { useCharacterDraftSession } from "../hooks/use-character-draft-sessions";
import type { CharacterDetailResponse } from "../api/characters-api";
import { getCharacter } from "../api/characters-api";
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
import { CharacterAvatarEditor } from "./character-avatar-editor";

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
      hydrateFromQueryOnMount: true,
      ...(onCreated ? { onCreated } : {}),
    });
  const visibilityOptions: Array<{
    value: CharacterEditorFormState["visibility"];
    label: string;
  }> = [
    { value: "private", label: t("characters.list.privateVisibility") },
    { value: "public", label: t("characters.list.publicVisibility") },
  ];
  const character = useQuery({
    queryKey: ["characters", characterId],
    queryFn: () => getCharacter(characterId!),
    enabled: characterId !== undefined,
  });

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div
        aria-label={t("characters.editor.mainEditorLabel")}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {characterId && character.data ? <CharacterAvatarEditor avatar={character.data.avatar} characterId={characterId} name={character.data.name} /> : null}
        <Accordion
          className="border-b border-border"
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          <CharacterFormSection
            icon={BadgeInfo}
            summary={characterBasicSummary({
              name: form.name,
              tagsText: form.tagsText,
              visibility: form.visibility,
              t,
            })}
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
            icon={FileText}
            summary={characterContentSummary({
              form,
              t,
            })}
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
            icon={MessageSquareText}
            summary={characterPromptsSummary({
              form,
              t,
            })}
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
            icon={UserRound}
            summary={characterMetadataSummary({
              creator: form.creator,
              nickname: form.nickname,
              t,
            })}
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

function characterBasicSummary({
  name,
  tagsText,
  visibility,
  t,
}: {
  name: string;
  tagsText: string;
  visibility: CharacterEditorFormState["visibility"];
  t: TFunction;
}): string {
  const title = name.trim() || t("characters.editor.summaries.unnamed");
  const visibilityText =
    visibility === "public"
      ? t("characters.list.publicVisibility")
      : t("characters.list.privateVisibility");
  const tags = tagCount(tagsText);
  const tagSummary =
    tags > 0
      ? t("characters.editor.summaries.tags", { count: tags })
      : t("characters.editor.summaries.noTags");

  return `${title} · ${visibilityText} · ${tagSummary}`;
}

function characterContentSummary({
  form,
  t,
}: {
  form: CharacterEditorFormState;
  t: TFunction;
}): string {
  const filledFields = filledCount([
    form.description,
    form.firstMessage,
    form.personality,
    form.scenario,
    form.creatorNotes,
    form.messageExample,
  ]);
  const firstMessageSummary = form.firstMessage.trim()
    ? t("characters.editor.summaries.firstMessageSet")
    : t("characters.editor.summaries.firstMessageEmpty");

  return `${t("characters.editor.summaries.filledFields", {
    count: filledFields,
  })} · ${firstMessageSummary}`;
}

function characterPromptsSummary({
  form,
  t,
}: {
  form: CharacterEditorFormState;
  t: TFunction;
}): string {
  const overrides = filledCount([
    form.systemPrompt,
    form.postHistoryInstructions,
  ]);

  return overrides > 0
    ? t("characters.editor.summaries.promptOverrides", { count: overrides })
    : t("characters.editor.summaries.noPromptOverrides");
}

function characterMetadataSummary({
  creator,
  nickname,
  t,
}: {
  creator: string;
  nickname: string;
  t: TFunction;
}): string {
  const creatorText = creator.trim();
  const nicknameText = nickname.trim();

  if (creatorText && nicknameText) {
    return `${t("characters.editor.summaries.creator", {
      name: creatorText,
    })} · ${t("characters.editor.summaries.nickname", { name: nicknameText })}`;
  }

  if (creatorText) {
    return t("characters.editor.summaries.creator", { name: creatorText });
  }

  if (nicknameText) {
    return t("characters.editor.summaries.nickname", { name: nicknameText });
  }

  return t("characters.editor.summaries.noMetadata");
}

function tagCount(tagsText: string): number {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean).length;
}

function filledCount(values: string[]): number {
  return values.filter((value) => value.trim()).length;
}
