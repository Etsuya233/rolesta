import { countPromptTokens } from '@rolesta/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, ListPlus, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { getFormErrorMessage } from '../../../lib/forms/form-error';
import { notify } from '../../../lib/notifications/notify';
import {
  importPreset,
  type PresetDetailResponse,
  type PresetImportResponse,
} from '../api/presets-api';

const SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID = 100001;

export function PresetImportPanel({
  onImported,
}: {
  onImported: (preset: PresetDetailResponse) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PresetImportPreview | null>(null);
  const [result, setResult] = useState<PresetImportResponse | null>(null);
  const importMutation = useMutation({
    mutationFn: (selectedFile: File) => importPreset(selectedFile),
    async onSuccess(importResult) {
      await queryClient.invalidateQueries({ queryKey: ['presets'] });
      queryClient.setQueryData(['preset', importResult.preset.id], importResult.preset);
      setResult(importResult);
    },
    onError(error) {
      notify.error({ title: getFormErrorMessage(error) });
    },
  });

  async function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);

    try {
      setPreview(await previewPreset(selectedFile));
    } catch {
      setPreview(null);
      notify.error({ title: t('presets.import.invalidJson') });
    }
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <label
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border px-4 py-6 text-center"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <Upload aria-hidden="true" className="size-8 text-muted-foreground" />
          <span className="text-sm font-medium">{t('presets.import.chooseFile')}</span>
          <input
            accept="application/json,.json"
            className="sr-only"
            type="file"
            disabled={result !== null}
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
        </label>

        {preview ? (
          <div className="mt-4 rounded-md border border-border p-4">
            <div className="mb-3 text-sm font-semibold">{preview.name}</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <PreviewMetric label={t('presets.metrics.entryCount')} value={preview.entryCount} />
              <PreviewMetric
                label={t('presets.import.enabledEntries')}
                value={preview.enabledCount}
              />
              <PreviewMetric label={t('presets.metrics.tokenCount')} value={preview.tokenCount} />
            </div>
          </div>
        ) : null}
        {result ? (
          <div className="mt-4 flex flex-col gap-3">
            {result.issues.length > 0 ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{t('presets.import.issuesTitle')}</AlertTitle>
                <AlertDescription>
                  <ul className="flex list-disc flex-col gap-1 pl-4">
                    {result.issues.map((issue, index) => (
                      <li key={`${issue.identifier}:${issue.reason}:${index}`}>
                        {issue.name || issue.identifier}:{' '}
                        {t(`presets.import.issues.${issue.reason}`)}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
            {result.supplementedItems.length > 0 ? (
              <Alert>
                <ListPlus />
                <AlertTitle>{t('presets.import.supplementedTitle')}</AlertTitle>
                <AlertDescription>
                  {result.supplementedItems
                    .map((item) => t(`presets.systemItems.names.${item}`))
                    .join(', ')}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-background px-4 py-3">
        <Button
          className="w-full"
          disabled={!file || importMutation.isPending}
          type="button"
          onClick={() =>
            result ? onImported(result.preset) : file ? importMutation.mutate(file) : undefined
          }
        >
          {t(result ? 'presets.import.continue' : 'presets.import.submit')}
        </Button>
      </div>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate text-base font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

interface PresetImportPreview {
  name: string;
  entryCount: number;
  enabledCount: number;
  tokenCount: number;
}

async function previewPreset(file: File): Promise<PresetImportPreview> {
  const input = JSON.parse(await file.text()) as Record<string, unknown>;
  const prompts = Array.isArray(input.prompts) ? input.prompts.filter(isRecord) : [];
  const order = chatCompletionPromptOrder(input);
  const enabledIdentifiers = new Set(
    order
      .filter((item) => item.enabled === true && typeof item.identifier === 'string')
      .map((item) => item.identifier as string),
  );
  const contentByIdentifier = new Map(
    prompts
      .filter((prompt) => typeof prompt.identifier === 'string')
      .map((prompt) => [
        prompt.identifier as string,
        typeof prompt.content === 'string' ? prompt.content : '',
      ]),
  );
  const tokenCount = [...enabledIdentifiers].reduce(
    (total, identifier) => total + countPromptTokens(contentByIdentifier.get(identifier) ?? ''),
    0,
  );

  return {
    name: typeof input.name === 'string' ? input.name : file.name,
    entryCount: prompts.length,
    enabledCount: enabledIdentifiers.size,
    tokenCount,
  };
}

function chatCompletionPromptOrder(input: Record<string, unknown>): Array<Record<string, unknown>> {
  const promptOrder = input.prompt_order;

  if (!Array.isArray(promptOrder)) {
    return [];
  }

  const groups = promptOrder.filter(isRecord);
  const group = groups.find(
    (item) => item.character_id === SILLY_TAVERN_CHAT_COMPLETION_PROMPT_ORDER_ID,
  );

  if (!group || !Array.isArray(group.order)) {
    return [];
  }

  return group.order.filter(isRecord);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
