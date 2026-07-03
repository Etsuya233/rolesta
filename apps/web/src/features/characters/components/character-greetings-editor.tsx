import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { MobileFormSection } from '../../assets/components/mobile-form-section';
import { getCharacter, updateCharacter } from '../api/characters-api';
import {
  FieldError,
  NeutralButton,
  PrimaryButton,
  textareaClassName,
} from './character-form-fields';

export interface CharacterGreetingsEditorProps {
  characterId: string;
}

export function CharacterGreetingsEditor({ characterId }: CharacterGreetingsEditorProps) {
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [greetings, setGreetings] = useState<string[]>([]);

  const characterQuery = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  });

  useEffect(() => {
    if (characterQuery.data) {
      setGreetings(characterQuery.data.alternateGreetings);
    }
  }, [characterQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => updateCharacter(characterId, { alternateGreetings: greetings }),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.setQueryData(['character', character.id], character);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const isPending = saveMutation.isPending || characterQuery.isLoading;

  return (
    <form className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto" onSubmit={handleSubmit}>
      <MobileFormSection title="其他开场">
        <div className="space-y-3">
          {greetings.map((greeting, index) => (
            <label className="block space-y-2" htmlFor={`${fieldPrefix}-greeting-${index}`} key={index}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium leading-none">开场 {index + 1}</span>
                <button
                  aria-label={`删除开场 ${index + 1}`}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                  disabled={isPending}
                  type="button"
                  onClick={() => setGreetings(greetings.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
              <textarea
                className={textareaClassName}
                disabled={isPending}
                id={`${fieldPrefix}-greeting-${index}`}
                value={greeting}
                onChange={(event) =>
                  setGreetings(
                    greetings.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>

        <NeutralButton disabled={isPending} onClick={() => setGreetings([...greetings, ''])}>
          添加开场
        </NeutralButton>
      </MobileFormSection>

      <div className="space-y-3 px-4 pb-6">
        {saveMutation.isError ? <FieldError>保存开场失败</FieldError> : null}
        <PrimaryButton disabled={isPending}>保存</PrimaryButton>
      </div>
    </form>
  );
}
