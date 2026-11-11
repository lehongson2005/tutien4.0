export type Rarity = 'pham' | 'linh' | 'vuong' | 'thanh' | 'chi_ton';
export type WorldTier = 'ha_gioi' | 'tien_gioi' | 'than_gioi';
export type LifeStage = 1 | 2 | 3 | 4;
export type DaoAlignment = 'chua_chon' | 'thuan_thien' | 'nghich_thien' | 'trung_lap';

export type StatKey =
  | 'hp'
  | 'maxHp'
  | 'nhucThan'
  | 'ngoTinh'
  | 'tamCanh'
  | 'khiVan'
  | 'tuVi'
  | 'linhThach'
  | 'congDuc'
  | 'nghiepLuc'
  | 'danDoc'
  | 'maxAge'
  | 'sectContribution'
  | 'lawThoiGian'
  | 'lawKhongGian'
  | 'lawNhanQua'
  | 'lawHonDon'
  | 'ancientProgress';

export type ItemCategory =
  | 'artifact'
  | 'elixir'
  | 'herb'
  | 'beast'
  | 'array'
  | 'relic';

export interface LoreEntry {
  id: string;
  name: string;
  description: string;
  group?: string;
  tier: WorldTier;
  rarity: Rarity;
  faction?: string;
  powerReq?: number;
  alignment?: DaoAlignment;
}

export interface RealmInfo {
  index: number;
  id: string;
  name: string;
  description: string;
  tier: WorldTier;
  maxAge: number;
  tuViCap: number;
  powerBase: number;
  requiresTamMa: boolean;
  requiresLoiKiep: boolean;
}

export interface OriginEntry extends LoreEntry {
  bonuses: {
    nhucThan: number;
    ngoTinh: number;
    tamCanh: number;
    khiVan: number;
    linhThach: number;
    congDuc: number;
    nghiepLuc: number;
  };
  spiritRootBias: string;
}

export interface PhysiqueEntry extends LoreEntry {
  tuViMultiplier: number;
  nhucThanBonus: number;
  ngoTinhBonus: number;
  powerBonus: number;
}

export interface LuckEntry extends LoreEntry {
  colorHex: string;
  khiVanBase: number;
}

export interface FateEntry extends LoreEntry {}

export interface SpiritRootType {
  id: string;
  name: string;
  description: string;
  speedMultiplier: number;
  rarity: Rarity;
}

export interface RegionInfo {
  id: string;
  name: string;
  tier: WorldTier;
  description: string;
  dangerLevel: number;
}

export interface SectRankInfo {
  id: string;
  rankOrder: number;
  roleType: 'de_tu' | 'truong_lao';
  name: string;
  minRealm: number;
  salaryMultiplier: number;
}

export interface RankingInfo {
  id: string;
  name: string;
  description: string;
  tier: WorldTier;
  minRealm: number;
}

export interface ChoiceRequirement {
  minStat?: Partial<Record<StatKey, number>>;
  minRealm?: number;
  daoAlignment?: DaoAlignment;
  label: string;
}

export interface ChoiceOutcome {
  narrative: string;
  statDelta: Partial<Record<StatKey, number>>;
  daoShift?: DaoAlignment;
  rewardPool?: string;
}

export interface ChoiceOption {
  key: 'A' | 'B' | 'C';
  label: string;
  requirement?: ChoiceRequirement;
  successRateBase: number;
  onSuccess: ChoiceOutcome;
  onFail: ChoiceOutcome;
}

export interface GameEvent {
  id: string;
  numId: number;
  stage: LifeStage;
  subStage: string;
  title: string;
  oneTime: boolean;
  choices: ChoiceOption[];
}

export interface InventoryItem {
  uid: string;
  catalogId: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  tier: WorldTier;
  quantity: number;
  powerBonus: number;
  level: number;
  description: string;
}

export interface ProfessionProgress {
  id: string;
  name: string;
  tierLevel: number; // 1..11 (Nhat pham -> Than cap)
  exp: number;
}

export interface PlayerLaws {
  thoiGian: number;
  khongGian: number;
  nhanQua: number;
  honDon: number;
}

export interface LogEntry {
  id: string;
  age: number;
  text: string;
  tone: 'info' | 'good' | 'warn' | 'danger' | 'epic';
}

export interface PlayerEnding {
  id: string;
  title: string;
  summary: string;
  type: 'death' | 'ascension' | 'victory';
  daoQuaAwarded: number;
}

export interface ReincarnationLegacy {
  rebirthCount: number;
  daoQuaPoints: number;
  inheritedTechniqueIds: string[];
  unlockedCodexIds: string[];
  bestRealmIndex: number;
  completedEndings: string[];
}

export interface PlayerState {
  version: number;
  name: string;
  age: number;
  maxAge: number;
  stage: LifeStage;
  realmIndex: number;
  tuVi: number;
  tuViCap: number;
  hp: number;
  maxHp: number;
  nhucThan: number;
  ngoTinh: number;
  tamCanh: number;
  khiVan: number;
  congDuc: number;
  nghiepLuc: number;
  danDoc: number;
  linhThach: number;
  origin: OriginEntry;
  physique: PhysiqueEntry;
  spiritRoot: SpiritRootType;
  luck: LuckEntry;
  fate: FateEntry;
  daoAlignment: DaoAlignment;
  selectedDaoId: string | null;
  regionId: string;
  sectId: string | null;
  sectName: string | null;
  sectFaction: string | null;
  sectRankOrder: number;
  sectContribution: number;
  isTanTu: boolean;
  dongPhuLevel: number;
  mineLevel: number;
  inflationMultiplier: number;
  turnsInStage3: number;
  inventory: InventoryItem[];
  equippedArtifactUid: string | null;
  activeArrayUid: string | null;
  activeBeastUid: string | null;
  learnedTechniqueIds: string[];
  learnedAbilityIds: string[];
  companions: LoreEntry[];
  friends: LoreEntry[];
  professions: ProfessionProgress[];
  laws: PlayerLaws;
  ancientProgress: number;
  decipheredAncientIds: string[];
  calamityCountdown: number;
  hasUsedDoatXa: boolean;
  wantedByTranTheMinh: boolean;
  cryoSleepCycles: number;
  ascendedLowerWorld: boolean;
  stage2StepYears: 2 | 5;
  actionPoints: number;
  maxActionPoints: number;
  currentEvent: GameEvent | null;
  usedEventIds: string[];
  survivalCrisisActive: boolean;
  ending: PlayerEnding | null;
  codexUnlocked: string[];
  logs: LogEntry[];
}

export type CombatTactic = 'phap_bao' | 'tran_phap' | 'hop_kich' | 'rut_lui';

export interface BreakthroughTactic {
  innerDemon: 'ngung_than' | 'uong_dan' | 'nho_dao_lu';
  useDoKiepDan: boolean;
  useArrayDefense: boolean;
}
