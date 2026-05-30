/**
 * Helpers building image URLs from the Brawlify CDN.
 * Reference: https://github.com/Brawlify/CDN
 *
 * All assets are PNG; Cloudflare auto-serves WebP where supported.
 */
const BASE = "https://cdn.brawlify.com";

export const cdn = {
  /** Brawler portrait with rounded border (200×200). */
  brawlerBorder: (id: number) => `${BASE}/brawlers/borders/${id}.png`,
  /** Brawler portrait without border (170×170). */
  brawlerBorderless: (id: number) => `${BASE}/brawlers/borderless/${id}.png`,
  brawlerEmoji: (id: number) => `${BASE}/brawlers/emoji/${id}.png`,
  brawlerModel: (id: number) => `${BASE}/brawlers/model/${id}.png`,

  /** Player profile icon (200×200). */
  playerIcon: (id: number) => `${BASE}/profile-icons/regular/${id}.png`,
  clubBadge: (id: number) => `${BASE}/club-badges/regular/${id}.png`,

  starPower: (id: number) => `${BASE}/star-powers/borderless/${id}.png`,
  gadget: (id: number) => `${BASE}/gadgets/borderless/${id}.png`,
  gear: (id: number) => `${BASE}/gears/regular/${id}.png`,

  map: (id: number) => `${BASE}/maps/regular/${id}.png`,
  gameMode: (id: number) => `${BASE}/game-modes/regular/${id}.png`,
};
