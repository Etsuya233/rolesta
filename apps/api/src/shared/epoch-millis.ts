export type EpochMillis = number;

export function ensureEpochMillis(value: number): EpochMillis {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Epoch millis must be a non-negative safe integer.');
  }

  return value;
}
