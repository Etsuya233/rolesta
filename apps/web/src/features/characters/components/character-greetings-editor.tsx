import { Trash2 } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Field, FieldLabel } from '../../../components/ui/field';
import { Textarea } from '../../../components/ui/textarea';
import { MobileFormSection } from '../../assets/components/mobile-form-section';
import { FormActionButton } from './character-form-fields';

export interface CharacterGreetingsEditorProps {
  disabled: boolean;
  greetings: string[];
  onChange: (greetings: string[]) => void;
}

export function CharacterGreetingsEditor({
  disabled,
  greetings,
  onChange,
}: CharacterGreetingsEditorProps) {
  const { t } = useTranslation();
  const fieldPrefix = useId();

  return (
    <>
      <MobileFormSection title={t('characters.greetings.sectionTitle')}>
        <div className="flex flex-col gap-3">
          {greetings.map((greeting, index) => (
            <Field key={index}>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel htmlFor={`${fieldPrefix}-greeting-${index}`}>
                  {t('characters.greetings.itemLabel', { index: index + 1 })}
                </FieldLabel>
                <Button
                  aria-label={t('characters.greetings.deleteAction', {
                    index: index + 1,
                  })}
                  disabled={disabled}
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={() => onChange(greetings.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <Textarea
                className="min-h-28 resize-y overflow-auto [field-sizing:fixed]"
                disabled={disabled}
                id={`${fieldPrefix}-greeting-${index}`}
                rows={6}
                style={{ fieldSizing: 'fixed' }}
                value={greeting}
                onChange={(event) =>
                  onChange(
                    greetings.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
              />
            </Field>
          ))}
        </div>

        <FormActionButton disabled={disabled} onClick={() => onChange([...greetings, ''])}>
          {t('characters.greetings.addAction')}
        </FormActionButton>
      </MobileFormSection>
    </>
  );
}
