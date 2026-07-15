import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import type { AppConfig } from "./config/app-config.js";
import { ApiExceptionFilter } from "./http/api-exception.filter.js";
import { ResponseEnvelopeInterceptor } from "./http/response-envelope.interceptor.js";
import { HttpLoggingInterceptor } from "./logging/http-logging.interceptor.js";
import { RequestValidationPipe } from "./http/request-validation.pipe.js";

export function configureApp(
  app: NestExpressApplication,
  config: Pick<AppConfig, "corsAllowedOrigins" | "requestBodyLimit">,
): NestExpressApplication {
  app.useBodyParser("json", { limit: config.requestBodyLimit });
  app.useBodyParser("urlencoded", {
    extended: true,
    limit: config.requestBodyLimit,
  });
  app.enableCors({
    origin: config.corsAllowedOrigins,
    allowedHeaders: [
      "Accept",
      "Accept-Language",
      "Authorization",
      "Content-Type",
    ],
  });
  app.use(cookieParser());
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  app.useGlobalInterceptors(
    app.get(HttpLoggingInterceptor),
    new ResponseEnvelopeInterceptor(),
  );
  app.useGlobalPipes(new RequestValidationPipe());

  return app;
}
