import { HttpStatus } from "@nestjs/common";
import { ERROR_CODES } from "@rolesta/shared";
import { ApiFailure } from "../../http/api-failure.js";
import type { ChatApplicationError } from "../application/chat-application-error.js";

export function toChatApiFailure(error: ChatApplicationError): ApiFailure {
  if (error.reason === "not-found") {
    return new ApiFailure({
      status: HttpStatus.NOT_FOUND,
      code: ERROR_CODES.NOT_FOUND,
    });
  }
  return new ApiFailure({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    code: ERROR_CODES.VALIDATION_FAILED,
    messageKey: "errors.chatAssetUnavailable",
    params: error.params,
  });
}
