import { z } from "zod";
import { badRequest } from "./errors.js";

/**
 * Supercell tags use a restricted alphabet. The "0" and "O" are normalised to
 * "0", and lowercase letters are uppercased. The leading "#" is optional in
 * user input but must be URL-encoded as "%23" when sent to the upstream API.
 */
const TAG_ALPHABET = /^[0289PYLQGRJCUV]+$/;
const TAG_LENGTH_RANGE: [number, number] = [3, 15];

const normalize = (raw: string): string =>
  raw
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/O/g, "0")
    .replace(/\s+/g, "");

export function normalizeTag(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) {
    throw badRequest("Tag is required");
  }
  const cleaned = normalize(raw);
  if (
    cleaned.length < TAG_LENGTH_RANGE[0] ||
    cleaned.length > TAG_LENGTH_RANGE[1]
  ) {
    throw badRequest(
      `Tag length must be between ${TAG_LENGTH_RANGE[0]} and ${TAG_LENGTH_RANGE[1]} characters`,
    );
  }
  if (!TAG_ALPHABET.test(cleaned)) {
    throw badRequest(
      "Tag contains invalid characters (allowed: 0, 2, 8, 9, P, Y, L, Q, G, R, J, C, U, V)",
    );
  }
  return cleaned;
}

/** Encode a normalised tag for use as a URL path segment. */
export const encodeTag = (tag: string): string =>
  encodeURIComponent(`#${tag}`);

export const TagSchema = z
  .string()
  .transform((v, ctx) => {
    try {
      return normalizeTag(v);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : "Invalid tag",
      });
      return z.NEVER;
    }
  });
