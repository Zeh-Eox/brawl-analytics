import { z } from "zod";

/**
 * The Brawl Stars rankings API accepts ISO-3166-1 alpha-2 country codes plus
 * the special "global" scope. We allowlist the codes published by Supercell
 * (and a handful of common synonyms) to avoid forwarding arbitrary strings.
 */
const ISO_ALPHA2 = /^[A-Z]{2}$/;

export const CountryCodeSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .refine(
    (v) => v === "global" || ISO_ALPHA2.test(v.toUpperCase()),
    "Country code must be 'global' or an ISO-3166-1 alpha-2 code",
  )
  .transform((v) => (v === "global" ? "global" : v.toUpperCase()));

export type CountryCode = z.infer<typeof CountryCodeSchema>;
