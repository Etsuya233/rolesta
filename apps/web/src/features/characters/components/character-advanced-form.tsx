import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { CollapsibleFieldGroup } from '../../assets/components/collapsible-field-group';
import { MobileFormSection } from '../../assets/components/mobile-form-section';
import {
  getCharacter,
  updateCharacter,
  type CharacterDetailResponse,
  type CharacterFormValues,
} from '../api/characters-api';
import {
  FieldError,
  PrimaryButton,
  TextAreaField,
  TextField,
} from './character-form-fields';

export interface CharacterAdvancedFormProps {
  characterId: string;
}

interface AdvancedFormState {
  systemPrompt: string;
  postHistoryInstructions: string;
  creator: string;
  nickname: string;
  sourceText: string;
  assetsText: string;
  creatorNotesMultilingualText: string;
  personality: string;
  scenario: string;
  creatorNotes: string;
  messageExample: string;
  characterBookText: string;
}

const emptyAdvancedForm: AdvancedFormState = {
  systemPrompt: '',
  postHistoryInstructions: '',
  creator: '',
  nickname: '',
  sourceText: '[]',
  assetsText: '[]',
  creatorNotesMultilingualText: '{}',
  personality: '',
  scenario: '',
  creatorNotes: '',
  messageExample: '',
  characterBookText: 'null',
};

export function CharacterAdvancedForm({ characterId }: CharacterAdvancedFormProps) {
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdvancedFormState>(emptyAdvancedForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const characterQuery = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  });

  useEffect(() => {
    if (characterQuery.data) {
      setForm(advancedFormFromCharacter(characterQuery.data));
    }
  }, [characterQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: CharacterFormValues) => updateCharacter(characterId, values),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.setQueryData(['character', character.id], character);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const values = advancedValuesFromForm(form);
    if (!values.ok) {
      setErrorMessage(values.message);
      return;
    }

    saveMutation.mutate(values.data);
  }

  const isPending = saveMutation.isPending || characterQuery.isLoading;
  const serverError = saveMutation.isError ? '保存高级定义失败' : null;
  const visibleError = errorMessage ?? serverError;

  return (
    <form className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto" onSubmit={handleSubmit}>
      <CollapsibleFieldGroup defaultOpen title="提示词覆盖">
        <div className="space-y-3">
          <TextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-system-prompt`}
            label="系统提示词"
            value={form.systemPrompt}
            onChange={(event) => setForm({ ...form, systemPrompt: event.target.value })}
          />
          <TextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-post-history`}
            label="历史后提示"
            value={form.postHistoryInstructions}
            onChange={(event) =>
              setForm({ ...form, postHistoryInstructions: event.target.value })
            }
          />
        </div>
      </CollapsibleFieldGroup>

      <CollapsibleFieldGroup title="元数据">
        <div className="space-y-3">
          <TextField
            disabled={isPending}
            id={`${fieldPrefix}-creator`}
            label="创建者"
            value={form.creator}
            onChange={(event) => setForm({ ...form, creator: event.target.value })}
          />
          <TextField
            disabled={isPending}
            id={`${fieldPrefix}-nickname`}
            label="昵称"
            value={form.nickname}
            onChange={(event) => setForm({ ...form, nickname: event.target.value })}
          />
          <TextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-source`}
            label="来源 JSON"
            value={form.sourceText}
            onChange={(event) => setForm({ ...form, sourceText: event.target.value })}
          />
          <TextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-assets`}
            label="素材 JSON"
            value={form.assetsText}
            onChange={(event) => setForm({ ...form, assetsText: event.target.value })}
          />
          <TextAreaField
            disabled={isPending}
            id={`${fieldPrefix}-notes-i18n`}
            label="多语言备注 JSON"
            value={form.creatorNotesMultilingualText}
            onChange={(event) =>
              setForm({ ...form, creatorNotesMultilingualText: event.target.value })
            }
          />
        </div>
      </CollapsibleFieldGroup>

      <MobileFormSection title="角色设定">
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-personality`}
          label="角色设定摘要"
          value={form.personality}
          onChange={(event) => setForm({ ...form, personality: event.target.value })}
        />
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-scenario`}
          label="情景"
          value={form.scenario}
          onChange={(event) => setForm({ ...form, scenario: event.target.value })}
        />
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-creator-notes`}
          label="角色备注"
          value={form.creatorNotes}
          onChange={(event) => setForm({ ...form, creatorNotes: event.target.value })}
        />
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-message-example`}
          label="对话示例"
          value={form.messageExample}
          onChange={(event) => setForm({ ...form, messageExample: event.target.value })}
        />
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-character-book`}
          label="角色书 JSON"
          value={form.characterBookText}
          onChange={(event) => setForm({ ...form, characterBookText: event.target.value })}
        />
      </MobileFormSection>

      <div className="space-y-3 px-4 pb-6">
        {visibleError ? <FieldError>{visibleError}</FieldError> : null}
        <PrimaryButton disabled={isPending}>保存</PrimaryButton>
      </div>
    </form>
  );
}

function advancedFormFromCharacter(character: CharacterDetailResponse): AdvancedFormState {
  return {
    systemPrompt: character.systemPrompt,
    postHistoryInstructions: character.postHistoryInstructions,
    creator: character.creator ?? '',
    nickname: character.nickname ?? '',
    sourceText: JSON.stringify(character.source, null, 2),
    assetsText: JSON.stringify(character.assets, null, 2),
    creatorNotesMultilingualText: JSON.stringify(character.creatorNotesMultilingual, null, 2),
    personality: character.personality,
    scenario: character.scenario,
    creatorNotes: character.creatorNotes,
    messageExample: character.messageExample,
    characterBookText: JSON.stringify(character.characterBook, null, 2),
  };
}

function advancedValuesFromForm(
  form: AdvancedFormState,
): { ok: true; data: CharacterFormValues } | { ok: false; message: string } {
  try {
    const source = stringArrayFromText(form.sourceText);
    const assets = arrayFromText(form.assetsText);
    const creatorNotesMultilingual = stringRecordFromText(form.creatorNotesMultilingualText);
    const characterBook = nullableRecordFromText(form.characterBookText);

    return {
      ok: true,
      data: {
        systemPrompt: form.systemPrompt,
        postHistoryInstructions: form.postHistoryInstructions,
        creator: form.creator.trim() ? form.creator.trim() : null,
        nickname: form.nickname.trim() ? form.nickname.trim() : null,
        source,
        assets,
        creatorNotesMultilingual,
        personality: form.personality,
        scenario: form.scenario,
        creatorNotes: form.creatorNotes,
        messageExample: form.messageExample,
        characterBook,
      },
    };
  } catch {
    return { ok: false, message: 'JSON 格式不正确' };
  }
}

function stringArrayFromText(value: string): string[] {
  const data = JSON.parse(value) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Expected string array.');
  }

  const items: unknown[] = data;

  if (items.some((item) => typeof item !== 'string')) {
    throw new Error('Expected string array.');
  }

  return items as string[];
}

function arrayFromText(value: string): unknown[] {
  const data = JSON.parse(value) as unknown;

  if (!Array.isArray(data)) {
    throw new Error('Expected array.');
  }

  return data as unknown[];
}

function stringRecordFromText(value: string): Record<string, string> {
  const data = JSON.parse(value) as unknown;

  if (!isPlainRecord(data) || Object.values(data).some((item) => typeof item !== 'string')) {
    throw new Error('Expected string record.');
  }

  return data as Record<string, string>;
}

function nullableRecordFromText(value: string): Record<string, unknown> | null {
  const data = JSON.parse(value) as unknown;

  if (data === null) {
    return null;
  }

  if (!isPlainRecord(data)) {
    throw new Error('Expected record.');
  }

  return data;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
