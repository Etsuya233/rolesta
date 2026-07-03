export type SessionSnapshot = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

export class Session {
  private constructor(private readonly snapshot: SessionSnapshot) {}

  static create(options: {
    tokenHash: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
  }): Session {
    return new Session({
      tokenHash: options.tokenHash,
      userId: options.userId,
      createdAt: options.createdAt,
      expiresAt: options.expiresAt,
    });
  }

  static restore(snapshot: SessionSnapshot): Session {
    return new Session(snapshot);
  }

  isExpired(now: Date): boolean {
    return Date.parse(this.snapshot.expiresAt) <= now.getTime();
  }

  toSnapshot(): SessionSnapshot {
    return this.snapshot;
  }

  get userId(): string {
    return this.snapshot.userId;
  }
}
