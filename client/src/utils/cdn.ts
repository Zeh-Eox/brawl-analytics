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

/**
 * Chaînes de repli : certains assets n'existent que dans une variante. On tente
 * `borderless` puis `regular` (et inversement) avant de basculer sur un badge.
 */
export const cdnChain = {
  starPower: (id: number) => [
    `${BASE}/star-powers/borderless/${id}.png`,
    `${BASE}/star-powers/regular/${id}.png`,
  ],
  gadget: (id: number) => [
    `${BASE}/gadgets/borderless/${id}.png`,
    `${BASE}/gadgets/regular/${id}.png`,
  ],
  gear: (id: number) => [
    `${BASE}/gears/regular/${id}.png`,
    `${BASE}/gears/borderless/${id}.png`,
  ],
};
