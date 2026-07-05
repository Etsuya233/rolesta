import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Accordion } from "../../../components/ui/accordion";
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  type CharacterCreateValues,
  type CharacterDetailResponse,
  type CharacterFormValues,
} from "../api/characters-api";
import {
  CharacterFormSection,
  CharacterSelectField,
  CharacterTextAreaField,
  CharacterTextField,
  FormActionButton,
  FormError,
  FormSubmitButton,
} from "./character-form-fields";

export interface CharacterCardFormProps {
  characterId?: string;
  onCreated: (characterId: string) => void;
  onOpenGreetings: (characterId: string) => void;
}

interface CharacterEditorFormState {
  visibility: "private" | "public";
  name: string;
  comment: string;
  tagsText: string;
  version: string;
  description: string;
  firstMessage: string;
  personality: string;
  scenario: string;
  creatorNotes: string;
  messageExample: string;
  systemPrompt: string;
  postHistoryInstructions: string;
  creator: string;
  nickname: string;
}

type EditableCharacterValues = CharacterCreateValues & CharacterFormValues;

const emptyCharacterEditorForm: CharacterEditorFormState = {
  visibility: "private",
  name: "",
  comment: "",
  tagsText: "",
  version: "",
  description: "",
  firstMessage: "",
  personality: "",
  scenario: "",
  creatorNotes: "",
  messageExample: "",
  systemPrompt: "",
  postHistoryInstructions: "",
  creator: "",
  nickname: "",
};

const visibilityOptions: Array<{
  value: CharacterEditorFormState["visibility"];
  label: string;
}> = [
  { value: "private", label: "私有" },
  { value: "public", label: "公开" },
];

export function CharacterCardForm({
  characterId,
  onCreated,
  onOpenGreetings,
}: CharacterCardFormProps) {
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CharacterEditorFormState>(
    emptyCharacterEditorForm,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditing = Boolean(characterId);

  const characterQuery = useQuery({
    enabled: isEditing,
    queryKey: ["character", characterId],
    queryFn: () => getCharacter(characterId ?? ""),
  });

  useEffect(() => {
    if (characterQuery.data) {
      setForm(editorFormFromCharacter(characterQuery.data));
    }
  }, [characterQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: EditableCharacterValues) =>
      characterId
        ? updateCharacter(characterId, values)
        : createCharacter(values),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.setQueryData(["character", character.id], character);

      if (!characterId) {
        onCreated(character.id);
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("名称不能为空");
      return;
    }

    const values = editorValuesFromForm(form);
    if (!values.ok) {
      setErrorMessage(values.message);
      return;
    }

    saveMutation.mutate(values.data);
  }

  const isPending = saveMutation.isPending || characterQuery.isLoading;
  const serverError = saveMutation.isError ? "保存角色卡失败" : null;
  const visibleError = errorMessage ?? serverError;

  return (
    <form
      className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <Accordion
        className="border-b border-border"
        defaultValue={["basic", "content"]}
        type="multiple"
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
            onChange={(event) => setForm({ ...form, name: event.target.value })}
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
          {characterId ? (
            <FormActionButton
              disabled={isPending}
              onClick={() => onOpenGreetings(characterId)}
            >
              其他开场
            </FormActionButton>
          ) : null}
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
              setForm({ ...form, postHistoryInstructions: event.target.value })
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

      <div className="flex flex-col gap-3 px-4 py-4">
        {visibleError ? <FormError>{visibleError}</FormError> : null}
        <FormSubmitButton disabled={isPending}>
          {characterId ? "保存" : "创建"}
        </FormSubmitButton>
      </div>
    </form>
  );
}

function editorFormFromCharacter(
  character: CharacterDetailResponse,
): CharacterEditorFormState {
  return {
    visibility: character.visibility,
    name: character.name,
    comment: character.comment,
    tagsText: character.tags.join(", "),
    version: character.version,
    description: character.description,
    firstMessage: character.firstMessage,
    personality: character.personality,
    scenario: character.scenario,
    creatorNotes: character.creatorNotes,
    messageExample: character.messageExample,
    systemPrompt: character.systemPrompt,
    postHistoryInstructions: character.postHistoryInstructions,
    creator: character.creator ?? "",
    nickname: character.nickname ?? "",
  };
}

function editorValuesFromForm(
  form: CharacterEditorFormState,
):
  { ok: true; data: EditableCharacterValues } | { ok: false; message: string } {
  return {
    ok: true,
    data: {
      visibility: form.visibility,
      name: form.name.trim(),
      comment: form.comment,
      tags: tagsFromText(form.tagsText),
      version: form.version,
      description: form.description,
      firstMessage: form.firstMessage,
      personality: form.personality,
      scenario: form.scenario,
      creatorNotes: form.creatorNotes,
      messageExample: form.messageExample,
      systemPrompt: form.systemPrompt,
      postHistoryInstructions: form.postHistoryInstructions,
      creator: form.creator.trim() ? form.creator.trim() : null,
      nickname: form.nickname.trim() ? form.nickname.trim() : null,
    },
  };
}

function tagsFromText(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
