import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  BRAWL_STARS_API_URL: z
    .string()
    .url()
    .default("https://api.brawlstars.com/v1"),
  BRAWL_STARS_API_KEY: z
    .string()
    .min(1, "BRAWL_STARS_API_KEY is required"),

  // Upstream request timeout in ms
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),

  // Comma-separated list of allowed CORS origins. "*" means any (dev only).
  CORS_ORIGINS: z.string().default("*"),

  // Global rate limit (per IP per window)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  // Cache sizing
  CACHE_MAX_ITEMS: z.coerce.number().int().positive().default(2_000),

  // ---- Background capture (tracker) ----
  // Where the tracker persists per-tag battle archives & trophy timelines.
  DATA_DIR: z.string().default("./data"),
  // Master switch for the background poller.
  TRACKER_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // How often the poller sweeps every active tag.
  TRACKER_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 60_000),
  // Pause between two tags within a sweep (spreads upstream load / quota).
  TRACKER_POLL_SPACING_MS: z.coerce.number().int().nonnegative().default(1_500),
  // Max distinct tags kept under active polling (LRU by last request).
  TRACKER_MAX_TAGS: z.coerce.number().int().positive().default(50),
  // A tag not requested for this many days stops being polled.
  TRACKER_INACTIVE_DAYS: z.coerce.number().int().positive().default(14),
  // Per-tag caps.
  TRACKER_BATTLE_CAP: z.coerce.number().int().positive().default(500),
  TRACKER_TIMELINE_CAP: z.coerce.number().int().positive().default(2_000),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Use console here — logger needs config to initialise.
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProd: env.NODE_ENV === "production",
  corsOrigins:
    env.CORS_ORIGINS.trim() === "*"
      ? ("*" as const)
      : env.CORS_ORIGINS.split(",")
          .map((o) => o.trim())
          .filter(Boolean),
} as const;

export type AppConfig = typeof config;
