import { Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/button";
import { Field, FieldLabel } from "../../../components/ui/field";
import { Textarea } from "../../../components/ui/textarea";
import { MobileFormSection } from "../../assets/components/mobile-form-section";
import { getCharacter, updateCharacter } from "../api/characters-api";
import {
  FormActionButton,
  FormError,
  FormSubmitButton,
} from "./character-form-fields";

export interface CharacterGreetingsEditorProps {
  characterId: string;
}

export function CharacterGreetingsEditor({
  characterId,
}: CharacterGreetingsEditorProps) {
  const fieldPrefix = useId();
  const queryClient = useQueryClient();
  const [greetings, setGreetings] = useState<string[]>([]);

  const characterQuery = useQuery({
    queryKey: ["character", characterId],
    queryFn: () => getCharacter(characterId),
  });

  useEffect(() => {
    if (characterQuery.data) {
      setGreetings(characterQuery.data.alternateGreetings);
    }
  }, [characterQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateCharacter(characterId, { alternateGreetings: greetings }),
    async onSuccess(character) {
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.setQueryData(["character", character.id], character);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  const isPending = saveMutation.isPending || characterQuery.isLoading;

  return (
    <form
      className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <MobileFormSection title="其他开场">
        <div className="flex flex-col gap-3">
          {greetings.map((greeting, index) => (
            <Field key={index}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor={`${fieldPrefix}-greeting-${index}`}>
                  开场 {index + 1}
                </FieldLabel>
                <Button
                  aria-label={`删除开场 ${index + 1}`}
                  disabled={isPending}
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setGreetings(
                      greetings.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <Textarea
                className="min-h-28"
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
            </Field>
          ))}
        </div>

        <FormActionButton
          disabled={isPending}
          onClick={() => setGreetings([...greetings, ""])}
        >
          添加开场
        </FormActionButton>
      </MobileFormSection>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {saveMutation.isError ? <FormError>保存开场失败</FormError> : null}
        <FormSubmitButton disabled={isPending}>保存</FormSubmitButton>
      </div>
    </form>
  );
}
