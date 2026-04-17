// Real sport photography from Unsplash (royalty-free, not AI-generated).
// Each entry includes hero (large), action (medium), tile (square-ish), banner (wide) variants.
import type { SportType } from "./sports";

const u = (id: string, w = 1200, q = 75) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export interface SportImageSet {
  hero: string;
  action: string;
  tile: string;
  banner: string;
}

export const SPORT_IMAGES: Record<SportType, SportImageSet> = {
  football: {
    hero: u("photo-1431324155629-1a6deb1dec8d", 1600),
    action: u("photo-1486286701208-1d58e9338013", 1200),
    tile: u("photo-1517466787929-bc90951d0974", 800),
    banner: u("photo-1508098682722-e99c43a406b2", 1600),
  },
  basketball: {
    hero: u("photo-1546519638-68e109498ffc", 1600),
    action: u("photo-1574623452334-1e0ac2b3ccb4", 1200),
    tile: u("photo-1518605547888-58dffe1f5fdc", 800),
    banner: u("photo-1519861531473-9200262188bf", 1600),
  },
  tennis: {
    hero: u("photo-1551773806-bf7eb8a45a18", 1600),
    action: u("photo-1622279457486-62dcc4a431d6", 1200),
    tile: u("photo-1530915365347-e35b749a0381", 800),
    banner: u("photo-1554068865-24cecd4e34b8", 1600),
  },
  volleyball: {
    hero: u("photo-1612872087720-bb876e2e67d1", 1600),
    action: u("photo-1592656094267-764a45160876", 1200),
    tile: u("photo-1593787406536-3676a152d9ed", 800),
    banner: u("photo-1606761568499-6d2451b23c66", 1600),
  },
  cricket: {
    hero: u("photo-1531415074968-036ba1b575da", 1600),
    action: u("photo-1540747913346-19e32dc3e97e", 1200),
    tile: u("photo-1593341646782-e0b495cff86d", 800),
    banner: u("photo-1571156425562-12341e7c9aae", 1600),
  },
  badminton: {
    hero: u("photo-1626224583764-f87db24ac4ea", 1600),
    action: u("photo-1613918431703-aa50889e3be4", 1200),
    tile: u("photo-1613918108466-292b78a8ef95", 800),
    banner: u("photo-1626224583764-f87db24ac4ea", 1600),
  },
};

// Stadium / crowd shots for hero backgrounds and atmospheric empty states
export const ATMOSPHERE_IMAGES = {
  stadium: u("photo-1459865264687-595d652de67e", 1920),
  crowd: u("photo-1577223625816-7546f13df25d", 1920),
  trophy: u("photo-1567427017947-545c5f8d16ad", 1600),
  lights: u("photo-1543351611-58f69d7c1781", 1600),
};

export const getSportImage = (sport: string, variant: keyof SportImageSet = "banner"): string => {
  const set = SPORT_IMAGES[sport as SportType];
  return set ? set[variant] : ATMOSPHERE_IMAGES.stadium;
};
