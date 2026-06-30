export type IsoTimestamp = string;

export function createIsoTimestamp(date = new Date()): IsoTimestamp {
  return date.toISOString();
}

export function isIsoTimestamp(value: string): value is IsoTimestamp {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return new Date(parsed).toISOString() === value;
}
