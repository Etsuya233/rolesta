import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { MobileFormSection } from '../../assets/components/mobile-form-section';
import {
  createCharacter,
  getCharacter,
  updateCharacter,
  type CharacterDetailResponse,
  type CharacterCreateValues,
  type CharacterFormValues,
} from '../api/characters-api';
import {
  FieldError,
  NeutralButton,
  PrimaryButton,
  SelectField,
  TextAreaField,
  TextField,
} from './character-form-fields';

export interface CharacterCardFormProps {
  characterId?: string;
  onCreated: (characterId: string) => void;
  onOpenAdvanced: (characterId: string) => void;
  onOpenGreetings: (characterId: string) => void;
}

interface BasicFormState {
  visibility: 'private' | 'public';
  name: string;
  comment: string;
  tagsText: string;
  version: string;
  description: string;
  firstMessage: string;
}

type BasicCharacterFormValues = CharacterFormValues & Pick<CharacterCreateValues, 'name'>;

const emptyBasicForm: BasicFormState = {
  visibility: 'private',
  name: '',
  comment: '',
  tagsText: '',
  version: '',
  description: '',
  firstMessage: '',
};

export function CharacterCardForm({
  characterId,
  onCreated,
  onOpenAdvanced,
  onOpenGreetings,
}: CharacterCardFormProps) {
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BasicFormState>(emptyBasicForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditing = Boolean(characterId);

  const characterQuery = useQuery({
    enabled: isEditing,
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId ?? ''),
  });

  useEffect(() => {
    if (characterQuery.data) {
      setForm(basicFormFromCharacter(characterQuery.data));
    }
  }, [characterQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: BasicCharacterFormValues) =>
      characterId ? updateCharacter(characterId, values) : createCharacter(values),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.setQueryData(['character', character.id], character);

      if (!characterId) {
        onCreated(character.id);
      }
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage('名称不能为空');
      return;
    }

    saveMutation.mutate({
      visibility: form.visibility,
      name: form.name.trim(),
      comment: form.comment,
      tags: tagsFromText(form.tagsText),
      version: form.version,
      description: form.description,
      firstMessage: form.firstMessage,
    });
  }

  const isPending = saveMutation.isPending || characterQuery.isLoading;
  const serverError = saveMutation.isError ? '保存角色卡失败' : null;
  const visibleError = errorMessage ?? serverError;

  return (
    <form className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto" onSubmit={handleSubmit}>
      <MobileFormSection title="基础信息">
        <TextField
          disabled={isPending}
          id={`${fieldPrefix}-name`}
          label="名称"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <TextField
          disabled={isPending}
          id={`${fieldPrefix}-comment`}
          label="注释"
          value={form.comment}
          onChange={(event) => setForm({ ...form, comment: event.target.value })}
        />
        <TextField
          disabled={isPending}
          id={`${fieldPrefix}-tags`}
          label="标签"
          placeholder="用逗号分隔"
          value={form.tagsText}
          onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
        />
        <TextField
          disabled={isPending}
          id={`${fieldPrefix}-version`}
          label="版本号"
          value={form.version}
          onChange={(event) => setForm({ ...form, version: event.target.value })}
        />
        <SelectField
          disabled={isPending}
          id={`${fieldPrefix}-visibility`}
          label="权限"
          value={form.visibility}
          onChange={(event) =>
            setForm({ ...form, visibility: event.target.value as 'private' | 'public' })
          }
        >
          <option value="private">私有</option>
          <option value="public">公开</option>
        </SelectField>
      </MobileFormSection>

      <MobileFormSection title="角色内容">
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-description`}
          label="角色描述"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <TextAreaField
          disabled={isPending}
          id={`${fieldPrefix}-first-message`}
          label="第一条消息"
          value={form.firstMessage}
          onChange={(event) => setForm({ ...form, firstMessage: event.target.value })}
        />
      </MobileFormSection>

      <MobileFormSection title="更多定义">
        <div className="grid gap-2 sm:grid-cols-2">
          <NeutralButton
            disabled={!characterId || isPending}
            onClick={() => characterId && onOpenGreetings(characterId)}
          >
            其他开场
          </NeutralButton>
          <NeutralButton
            disabled={!characterId || isPending}
            onClick={() => characterId && onOpenAdvanced(characterId)}
          >
            高级定义
          </NeutralButton>
        </div>
      </MobileFormSection>

      <div className="space-y-3 px-4 pb-6">
        {visibleError ? <FieldError>{visibleError}</FieldError> : null}
        <PrimaryButton disabled={isPending}>{characterId ? '保存' : '创建'}</PrimaryButton>
      </div>
    </form>
  );
}

function basicFormFromCharacter(character: CharacterDetailResponse): BasicFormState {
  return {
    visibility: character.visibility,
    name: character.name,
    comment: character.comment,
    tagsText: character.tags.join(', '),
    version: character.version,
    description: character.description,
    firstMessage: character.firstMessage,
  };
}

function tagsFromText(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
