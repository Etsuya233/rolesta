export type WorldbookApplicationErrorReason =
  | "not-found"
  | "forbidden"
  | "invalid-import-file"
  | "invalid-worldbook"
  | "duplicate-entry"
  | "unknown-entry";

export class WorldbookApplicationError extends Error {
  constructor(readonly reason: WorldbookApplicationErrorReason) {
    super(reason);
    this.name = "WorldbookApplicationError";
  }
}
