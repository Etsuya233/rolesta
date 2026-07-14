import { UseCase } from "../../common/errors/index.js";
import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import type { DomainEventPublisher } from "../../common/events/index.js";
import { ModelProviderApplicationError } from "./model-provider-application-error.js";
import type { ModelProviderClock } from "./model-provider-application-services.js";
import { translateModelProviderError } from "./model-provider-error.mapper.js";
import { ModelProviderDeletedEvent } from "../events/index.js";
import type { ModelProviderStore } from "../ports/model-provider-store.js";

export interface DeleteModelProviderCommand {
  id: string;
  viewerUserId: string;
}

export class DeleteModelProviderUseCase {
  constructor(
    private readonly store: ModelProviderStore,
    private readonly clock: ModelProviderClock,
    private readonly unitOfWork: UnitOfWork,
    private readonly events: DomainEventPublisher,
  ) {}

  @UseCase(translateModelProviderError)
  async execute(command: DeleteModelProviderCommand): Promise<void> {
    await this.unitOfWork.run(async () => {
      const deleted = await this.store.deleteOwned(
        command.id,
        command.viewerUserId,
      );

      if (!deleted) {
        throw new ModelProviderApplicationError("not-found", {});
      }

      await this.events.publish(
        new ModelProviderDeletedEvent({
          modelProviderId: command.id,
          ownerUserId: command.viewerUserId,
          occurredAtMs: this.clock.now().getTime(),
        }),
      );
    });
  }
}
