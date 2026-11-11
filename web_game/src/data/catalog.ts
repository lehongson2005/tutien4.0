import realmsJson from './generated/realms.json';
import originsJson from './generated/origins.json';
import physiquesJson from './generated/physiques.json';
import lucksJson from './generated/lucks.json';
import fatesJson from './generated/fates.json';
import daosJson from './generated/daos.json';
import sectsJson from './generated/sects.json';
import techniquesJson from './generated/techniques.json';
import abilitiesJson from './generated/abilities.json';
import artifactsJson from './generated/artifacts.json';
import elixirsJson from './generated/elixirs.json';
import herbsJson from './generated/herbs.json';
import beastsJson from './generated/beasts.json';
import arraysJson from './generated/arrays.json';
import companionsJson from './generated/companions.json';
import friendsJson from './generated/friends.json';
import secretRealmsJson from './generated/secret_realms.json';
import professionsJson from './generated/professions.json';
import weatherJson from './generated/weather.json';
import tribulationsJson from './generated/tribulations.json';
import innerDemonsJson from './generated/inner_demons.json';
import rankingsJson from './generated/rankings.json';
import calamitiesJson from './generated/calamities.json';
import sectRelicsJson from './generated/sect_relics.json';
import guildsJson from './generated/guilds.json';
import vehiclesJson from './generated/vehicles.json';
import tradeRulesJson from './generated/trade_rules.json';
import outerEnemiesJson from './generated/outer_enemies.json';
import innateTalentsJson from './generated/innate_talents.json';
import mutationsJson from './generated/mutations.json';
import ancientTextsJson from './generated/ancient_texts.json';
import regionsJson from './generated/regions.json';
import sectRanksJson from './generated/sect_ranks.json';
import eventsStage1Json from './generated/events_stage1.json';
import eventsStage2Json from './generated/events_stage2.json';
import eventsStage3Json from './generated/events_stage3.json';
import eventsStage4Json from './generated/events_stage4.json';
import codexMetaJson from './generated/codex_meta.json';

import type {
  FateEntry,
  GameEvent,
  LoreEntry,
  LuckEntry,
  OriginEntry,
  PhysiqueEntry,
  RankingInfo,
  RealmInfo,
  RegionInfo,
  SectRankInfo,
  SpiritRootType,
} from '../types/game';

export const SPIRIT_ROOTS: SpiritRootType[] = [
  {
    id: 'root_phe',
    name: 'Phế Linh Căn',
    description: 'Kinh mạch tắc nghẽn, tốc độ hấp thụ linh khí chậm nhưng mở lối nghịch tập.',
    speedMultiplier: 0.65,
    rarity: 'pham',
  },
  {
    id: 'root_tap',
    name: 'Ngũ Hành Tạp Linh Căn',
    description: 'Có đủ 5 thuộc tính nhưng pha tạp, cần nhiều tài nguyên để trúc cơ.',
    speedMultiplier: 0.9,
    rarity: 'pham',
  },
  {
    id: 'root_song',
    name: 'Song / Tam Chân Linh Căn',
    description: 'Tư chất trung thượng, được hầu hết tông môn Hạ Giới trọng dụng.',
    speedMultiplier: 1.2,
    rarity: 'linh',
  },
  {
    id: 'root_thien',
    name: 'Đơn Hệ Thiên Linh Căn',
    description: 'Thiên tư ngút trời, tu luyện một đường thông suốt không bình cảnh nhỏ.',
    speedMultiplier: 1.55,
    rarity: 'vuong',
  },
  {
    id: 'root_biendi',
    name: 'Biến Dị Linh Căn (Lôi / Băng / Không Gian)',
    description: 'Linh căn đột biến ngàn năm khó gặp, sát thương và tốc độ tu hành vượt cấp.',
    speedMultiplier: 1.8,
    rarity: 'chi_ton',
  },
];

export const REALMS = realmsJson as RealmInfo[];
export const ORIGINS = originsJson as OriginEntry[];
export const PHYSIQUES = physiquesJson as PhysiqueEntry[];
export const LUCKS = lucksJson as LuckEntry[];
export const FATES = fatesJson as FateEntry[];
export const DAOS = daosJson as LoreEntry[];
export const SECTS = sectsJson as LoreEntry[];
export const TECHNIQUES = techniquesJson as LoreEntry[];
export const ABILITIES = abilitiesJson as LoreEntry[];
export const ARTIFACTS = artifactsJson as LoreEntry[];
export const ELIXIRS = elixirsJson as LoreEntry[];
export const HERBS = herbsJson as LoreEntry[];
export const BEASTS = beastsJson as LoreEntry[];
export const ARRAYS = arraysJson as LoreEntry[];
export const COMPANIONS = companionsJson as LoreEntry[];
export const FRIENDS = friendsJson as LoreEntry[];
export const SECRET_REALMS = secretRealmsJson as LoreEntry[];
export const PROFESSIONS = professionsJson as LoreEntry[];
export const WEATHER_PHENOMENA = weatherJson as LoreEntry[];
export const TRIBULATIONS = tribulationsJson as LoreEntry[];
export const INNER_DEMONS = innerDemonsJson as LoreEntry[];
export const RANKINGS = rankingsJson as RankingInfo[];
export const CALAMITIES = calamitiesJson as LoreEntry[];
export const SECT_RELICS = sectRelicsJson as LoreEntry[];
export const GUILDS = guildsJson as LoreEntry[];
export const VEHICLES = vehiclesJson as LoreEntry[];
export const TRADE_RULES = tradeRulesJson as LoreEntry[];
export const OUTER_ENEMIES = outerEnemiesJson as LoreEntry[];
export const INNATE_TALENTS = innateTalentsJson as LoreEntry[];
export const MUTATIONS = mutationsJson as LoreEntry[];
export const ANCIENT_TEXTS = ancientTextsJson as LoreEntry[];
export const REGIONS = regionsJson as RegionInfo[];
export const SECT_RANKS = sectRanksJson as SectRankInfo[];

export const EVENTS_BY_STAGE = {
  1: eventsStage1Json as GameEvent[],
  2: eventsStage2Json as GameEvent[],
  3: eventsStage3Json as GameEvent[],
  4: eventsStage4Json as GameEvent[],
};

export const CODEX_META = codexMetaJson as {
  counts: Record<string, number>;
  totalLoreEntries: number;
  totalEvents: number;
};

export const CODEX_CATEGORIES = [
  { key: 'thechat', label: '200 Thể Chất', items: PHYSIQUES },
  { key: 'suatthan', label: '100 Xuất Thân', items: ORIGINS },
  { key: 'congphap', label: '200 Công Pháp', items: TECHNIQUES },
  { key: 'thanthong', label: '100 Thần Thông', items: ABILITIES },
  { key: 'phapbao', label: '200 Pháp Bảo', items: ARTIFACTS },
  { key: 'danduoc', label: '200 Đan Dược', items: ELIXIRS },
  { key: 'linhthao', label: '200 Linh Thảo', items: HERBS },
  { key: 'linhthu', label: '200 Linh Thú', items: BEASTS },
  { key: 'tranphap', label: '200 Trận Pháp', items: ARRAYS },
  { key: 'daolu', label: '50 Đạo Lữ', items: COMPANIONS },
  { key: 'banbe', label: '100 Bằng Hữu', items: FRIENDS },
  { key: 'bicanh', label: '100 Bí Cảnh', items: SECRET_REALMS },
  { key: 'thelucbandia', label: '100 Thế Lực', items: SECTS },
  { key: 'chibao', label: '30 Chí Bảo Trấn Phái', items: SECT_RELICS },
  { key: 'khihau', label: '30 Khí Hậu & Địa Hình', items: WEATHER_PHENOMENA },
  { key: 'tamma', label: '30 Tâm Ma & Ảo Cảnh', items: INNER_DEMONS },
  { key: 'dietthe', label: 'Đại Kiếp Diệt Thế', items: CALAMITIES },
  { key: 'truyenthua', label: '30 Văn Tự Cổ', items: ANCIENT_TEXTS },
] as const;

export function getRealmByIndex(index: number): RealmInfo {
  const clamped = Math.max(0, Math.min(REALMS.length - 1, Math.floor(index)));
  return REALMS[clamped];
}
