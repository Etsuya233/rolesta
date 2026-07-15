import type { ZodError, ZodIssue } from "zod";

export const VALIDATION_RULES = {
  REQUIRED: "required",
  INVALID_TYPE: "invalidType",
  MAX_LENGTH: "maxLength",
  INVALID_ENUM: "enum",
  INTEGER: "integer",
  MINIMUM: "minimum",
  MAXIMUM: "maximum",
  UNKNOWN_FIELD: "unknownField",
  AT_LEAST_ONE: "atLeastOne",
} as const;

export type ValidationRule =
  (typeof VALIDATION_RULES)[keyof typeof VALIDATION_RULES];

export interface ValidationIssue {
  field: string;
  rule: ValidationRule;
}

export function validationIssuesFromZodError(
  error: ZodError,
): ValidationIssue[] {
  return error.issues.flatMap(toValidationIssues);
}

function toValidationIssues(issue: ZodIssue): ValidationIssue[] {
  if (issue.code === "unrecognized_keys") {
    const parent = pathToField(issue.path);
    return issue.keys.map((key) => ({
      field: parent === "$" ? key : `${parent}.${key}`,
      rule: VALIDATION_RULES.UNKNOWN_FIELD,
    }));
  }

  return [{ field: pathToField(issue.path), rule: issueRule(issue) }];
}

function issueRule(issue: ZodIssue): ValidationRule {
  if (isValidationRule(issue.message)) {
    return issue.message;
  }

  if (issue.code === "invalid_type") {
    return VALIDATION_RULES.INVALID_TYPE;
  }

  if (issue.code === "invalid_value") {
    return VALIDATION_RULES.INVALID_ENUM;
  }

  if (issue.code === "too_small") {
    return VALIDATION_RULES.MINIMUM;
  }

  if (issue.code === "too_big") {
    return VALIDATION_RULES.MAXIMUM;
  }

  return VALIDATION_RULES.INVALID_TYPE;
}

function isValidationRule(value: string): value is ValidationRule {
  return Object.values(VALIDATION_RULES).some((rule) => rule === value);
}

function pathToField(path: PropertyKey[]): string {
  return path.length === 0 ? "$" : path.map(String).join(".");
}
