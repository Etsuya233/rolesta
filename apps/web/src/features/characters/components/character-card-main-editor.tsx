import { useId, useState } from "react";
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

const visibilityOptions: Array<{
  value: CharacterEditorFormState["visibility"];
  label: string;
}> = [
  { value: "private", label: "私有" },
  { value: "public", label: "公开" },
];

export function CharacterCardMainEditor({
  sessionKey,
  characterId,
  submitLabel,
  onCreated,
  onOpenGreetings,
}: CharacterCardMainEditorProps) {
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

  return (
    <form
      className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden"
      onSubmit={submit}
    >
      <div aria-label="角色卡主编辑" className="min-h-0 flex-1 overflow-y-auto">
        <Accordion
          className="border-b border-border"
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
        >
          <CharacterFormSection
            description="角色卡在列表和聊天选择中的基本识别信息"
            title="基础信息"
            value="basic"
          >
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-name`}
              label="名称"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-comment`}
              label="注释"
              value={form.comment}
              onChange={(event) =>
                setForm({ ...form, comment: event.target.value })
              }
            />
            <CharacterTextField
              description="用逗号分隔多个标签"
              disabled={isPending}
              id={`${fieldPrefix}-tags`}
              label="标签"
              value={form.tagsText}
              onChange={(event) =>
                setForm({ ...form, tagsText: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-version`}
              label="版本号"
              value={form.version}
              onChange={(event) =>
                setForm({ ...form, version: event.target.value })
              }
            />
            <CharacterSelectField
              disabled={isPending}
              id={`${fieldPrefix}-visibility`}
              label="权限"
              options={visibilityOptions}
              value={form.visibility}
              onChange={(visibility) => setForm({ ...form, visibility })}
            />
          </CharacterFormSection>

          <CharacterFormSection
            description="控制角色人设、对话开场和示例语气"
            title="角色内容"
            value="content"
          >
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-description`}
              label="角色描述"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-first-message`}
              label="第一条消息"
              value={form.firstMessage}
              onChange={(event) =>
                setForm({ ...form, firstMessage: event.target.value })
              }
            />
            {onOpenGreetings ? (
              <FormActionButton disabled={isPending} onClick={onOpenGreetings}>
                其他开场
              </FormActionButton>
            ) : null}
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-personality`}
              label="角色设定摘要"
              value={form.personality}
              onChange={(event) =>
                setForm({ ...form, personality: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-scenario`}
              label="情景"
              value={form.scenario}
              onChange={(event) =>
                setForm({ ...form, scenario: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-creator-notes`}
              label="角色备注"
              value={form.creatorNotes}
              onChange={(event) =>
                setForm({ ...form, creatorNotes: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-message-example`}
              label="对话示例"
              value={form.messageExample}
              onChange={(event) =>
                setForm({ ...form, messageExample: event.target.value })
              }
            />
          </CharacterFormSection>

          <CharacterFormSection
            description="覆盖上下文组装时使用的提示词片段"
            title="提示词覆盖"
            value="prompts"
          >
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-system-prompt`}
              label="系统提示词"
              value={form.systemPrompt}
              onChange={(event) =>
                setForm({ ...form, systemPrompt: event.target.value })
              }
            />
            <CharacterTextAreaField
              disabled={isPending}
              id={`${fieldPrefix}-post-history`}
              label="历史后提示"
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
            description="可直接维护的创作者信息"
            title="元数据"
            value="metadata"
          >
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-creator`}
              label="创建者"
              value={form.creator}
              onChange={(event) =>
                setForm({ ...form, creator: event.target.value })
              }
            />
            <CharacterTextField
              disabled={isPending}
              id={`${fieldPrefix}-nickname`}
              label="昵称"
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
