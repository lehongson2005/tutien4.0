import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Backpack,
  BookOpen,
  Compass,
  Flame,
  Globe,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { CodexTab } from './components/CodexTab';
import { CultivationTab } from './components/CultivationTab';
import { InventoryTab } from './components/InventoryTab';
import { JourneyTab } from './components/JourneyTab';
import { ModalOverlay } from './components/ModalOverlay';
import { RoadmapModal } from './components/RoadmapModal';
import { StartScreen } from './components/StartScreen';
import { TopHud } from './components/TopHud';
import { WorldTab } from './components/WorldTab';
import { REGIONS, SECTS } from './data/catalog';
import { rollCharacter } from './engine/character';
import {
  attemptBreakthrough,
  consumeElixir,
  meditate,
  purifyDanDoc,
} from './engine/cultivation';
import {
  buyShopItem,
  craftAction,
  equipInventoryItem,
  learnProfession,
  sellInventoryItem,
  trainProfession,
} from './engine/economy';
import {
  comprehendLaw,
  decipherAncientScript,
  faceCosmicCalamity,
  triggerBodyPossession,
  triggerCryoHibernation,
  triggerReincarnation,
} from './engine/endgame';
import {
  advanceTimeStep,
  pickEventForState,
  resolveChoice,
} from './engine/events';
import { createSeededRng } from './engine/rng';
import {
  importSaveString,
  loadFromLocalStorage,
  saveToLocalStorage,
} from './engine/save';
import {
  challengeRanking,
  chooseTanTuPath,
  exploreSecretRealm,
  foundOwnSect,
  joinSect,
  manageSectMine,
  promoteSectRank,
  stealProdigyLuck,
  travelRegion,
} from './engine/sect';
import type {
  BreakthroughTactic,
  CombatTactic,
  GameEvent,
  ItemCategory,
  LoreEntry,
  PlayerLaws,
  PlayerState,
  ReincarnationLegacy,
} from './types/game';

type ActiveTab = 'journey' | 'cultivation' | 'inventory' | 'world' | 'codex';

interface ToastState {
  text: string;
  tone: 'info' | 'good' | 'warn' | 'danger';
}

export default function App() {
  const [initialData] = useState(() => loadFromLocalStorage());
  const [legacy, setLegacy] = useState<ReincarnationLegacy>(initialData.legacy);
  const [savedRun, setSavedRun] = useState<PlayerState | null>(initialData.state);
  const [activeState, setActiveState] = useState<PlayerState | null>(null);

  const [playerName, setPlayerName] = useState('');
  const [inheritedTechId, setInheritedTechId] = useState(
    initialData.legacy.inheritedTechniqueIds[0] ?? ''
  );
  const [draftChar, setDraftChar] = useState<PlayerState | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('journey');
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modalType, setModalType] = useState<'crisis' | 'ending' | 'save' | null>(null);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const rngRef = useRef(createSeededRng(Date.now() ^ 0x9e3779b9));
  const getRng = () => rngRef.current;

  // Keep savedRun synchronized whenever activeState advances
  useEffect(() => {
    if (activeState) {
      setSavedRun(activeState);
      saveToLocalStorage(activeState, legacy);
    } else {
      saveToLocalStorage(savedRun, legacy);
    }
  }, [activeState, savedRun, legacy]);

  // Ensure default inherited technique tracks legacy changes
  useEffect(() => {
    if (legacy.inheritedTechniqueIds.length > 0 && !inheritedTechId) {
      setInheritedTechId(legacy.inheritedTechniqueIds[0]);
    }
  }, [legacy.inheritedTechniqueIds, inheritedTechId]);

  const notify = (text: string, tone: ToastState['tone'] = 'info') => {
    setToast({ text, tone });
  };

  const commitTransition = (
    prevState: PlayerState,
    nextState: PlayerState,
    message?: string,
    tone: ToastState['tone'] = 'good'
  ) => {
    setActiveState(nextState);
    if (message) notify(message, tone);
    if (!prevState.ending && nextState.ending) {
      setModalType('ending');
    } else if (!prevState.survivalCrisisActive && nextState.survivalCrisisActive) {
      setModalType('crisis');
    }
  };

  const handleRollDraft = () => {
    const rolled = rollCharacter(
      playerName,
      legacy,
      getRng(),
      inheritedTechId || undefined
    );
    setDraftChar(rolled);
  };

  const handleConfirmStart = () => {
    if (!draftChar) return;
    const rng = getRng();
    const cleanName = playerName.trim() || draftChar.name;
    const preparedBase: PlayerState = {
      ...draftChar,
      name: cleanName,
    };
    const firstEvent = pickEventForState(preparedBase, rng);
    const ready: PlayerState = {
      ...preparedBase,
      currentEvent: firstEvent,
    };
    setActiveState(ready);
    setSavedRun(ready);
    setActiveTab('journey');
    setLastOutcome(null);
    setToast({
      text: `Khởi hành kiếp mới [${cleanName}]! Hãy chọn hướng đi A/B/C đầu tiên.`,
      tone: 'good',
    });
  };

  const handleResumeSaved = () => {
    if (!savedRun) return;
    const rng = getRng();
    const withEvent =
      savedRun.currentEvent || savedRun.ending
        ? savedRun
        : { ...savedRun, currentEvent: pickEventForState(savedRun, rng) };
    setActiveState(withEvent);
    setActiveTab('journey');
    setToast({ text: `Chào mừng đạo hữu [${withEvent.name}] trở lại!`, tone: 'info' });
  };

  const handleBackToStart = () => {
    if (activeState) {
      setSavedRun(activeState);
    }
    setActiveState(null);
    setToast(null);
  };

  const handleSelectChoice = (event: GameEvent, key: 'A' | 'B' | 'C') => {
    if (!activeState) return;
    const res = resolveChoice(activeState, event, key, getRng());
    setLastOutcome(res.outcomeText);
    commitTransition(
      activeState,
      res.nextState,
      res.outcomeText,
      res.success ? 'good' : 'warn'
    );
  };

  const handleAdvanceTime = () => {
    if (!activeState) return;
    const next = advanceTimeStep(activeState, getRng());
    commitTransition(
      activeState,
      next,
      `Thời gian trôi qua — hiện tại ${next.age.toLocaleString('vi-VN')} tuổi.`,
      'info'
    );
  };

  const handleSetStage2Step = (step: 2 | 5) => {
    if (!activeState) return;
    setActiveState({ ...activeState, stage2StepYears: step });
    notify(`Đã đổi bước thời gian Giai đoạn 2 thành ${step} năm/lượt.`, 'info');
  };

  const handleMeditate = () => {
    if (!activeState) return;
    const res = meditate(activeState, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handlePurify = () => {
    if (!activeState) return;
    const res = purifyDanDoc(activeState);
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleBreakthrough = (tactic: BreakthroughTactic) => {
    if (!activeState) return;
    const res = attemptBreakthrough(activeState, tactic, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.success ? 'good' : 'danger'
    );
  };

  const handleComprehendLaw = (lawKey: keyof PlayerLaws) => {
    if (!activeState) return;
    const res = comprehendLaw(activeState, lawKey, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleDecipherAncient = (ancientId: string) => {
    if (!activeState) return;
    const res = decipherAncientScript(activeState, ancientId, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleUseElixir = (uid: string) => {
    if (!activeState) return;
    const res = consumeElixir(activeState, uid);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleEquipItem = (uid: string) => {
    if (!activeState) return;
    const res = equipInventoryItem(activeState, uid);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleSellItem = (uid: string) => {
    if (!activeState) return;
    const res = sellInventoryItem(activeState, uid);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleCraft = (
    mode: 'alchemy' | 'forge' | 'array',
    targetUid: string | null
  ) => {
    if (!activeState) return;
    const res = craftAction(activeState, mode, targetUid, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleLearnProfession = (professionId: string) => {
    if (!activeState) return;
    const res = learnProfession(activeState, professionId);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleTrainProfession = (professionId: string) => {
    if (!activeState) return;
    const res = trainProfession(activeState, professionId);
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleBuyShopItem = (
    entry: LoreEntry,
    category: ItemCategory,
    basePrice: number
  ) => {
    if (!activeState) return;
    const res = buyShopItem(activeState, entry, category, basePrice);
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleJoinSect = (sectId: string) => {
    if (!activeState) return;
    const res = joinSect(activeState, sectId);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleChooseTanTu = () => {
    if (!activeState) return;
    const res = chooseTanTuPath(activeState);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleFoundOwnSect = (name: string) => {
    if (!activeState) return;
    const res = foundOwnSect(activeState, name);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handlePromoteSect = () => {
    if (!activeState) return;
    const res = promoteSectRank(activeState);
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.ok ? 'good' : 'warn'
    );
  };

  const handleManageMine = () => {
    if (!activeState) return;
    const res = manageSectMine(activeState, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleStealLuck = () => {
    if (!activeState) return;
    const res = stealProdigyLuck(activeState, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'warn');
  };

  const handleTravelRegion = (regionId: string) => {
    if (!activeState) return;
    const res = travelRegion(activeState, regionId);
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(activeState, res.nextState, res.message, 'info');
  };

  const handleExploreSecretRealm = (realmId: string, tactic: CombatTactic) => {
    if (!activeState) return;
    const res = exploreSecretRealm(activeState, realmId, tactic, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.victory ? 'good' : 'warn'
    );
  };

  const handleChallengeRanking = (rankingId: string, tactic: CombatTactic) => {
    if (!activeState) return;
    const res = challengeRanking(activeState, rankingId, tactic, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.victory ? 'good' : 'warn'
    );
  };

  const handleFaceCalamity = (targetId: string, tactic: CombatTactic) => {
    if (!activeState) return;
    const res = faceCosmicCalamity(activeState, targetId, tactic, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    commitTransition(
      activeState,
      res.nextState,
      res.message,
      res.victory ? 'good' : 'danger'
    );
  };

  const handleDoatXa = () => {
    if (!activeState) return;
    const res = triggerBodyPossession(activeState, getRng());
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    if (res.success) {
      setModalType(null);
      commitTransition(activeState, res.nextState, res.message, 'warn');
    } else {
      commitTransition(activeState, res.nextState, res.message, 'danger');
    }
  };

  const handleCryoSleep = () => {
    if (!activeState) return;
    const res = triggerCryoHibernation(activeState);
    if (!res.ok) {
      notify(res.message, 'warn');
      return;
    }
    setModalType(null);
    commitTransition(activeState, res.nextState, res.message, 'good');
  };

  const handleReincarnate = (chosenTechId?: string) => {
    const source = activeState ?? savedRun;
    if (!source) return;
    const nextLegacy = triggerReincarnation(source, legacy, chosenTechId);
    setLegacy(nextLegacy);
    setActiveState(null);
    setSavedRun(null);
    setDraftChar(null);
    setModalType(null);
    setLastOutcome(null);
    setInheritedTechId(nextLegacy.inheritedTechniqueIds[0] ?? '');
    saveToLocalStorage(null, nextLegacy);
    notify(
      `Nhập Luân Hồi thành công! Đạo Quả tích lũy: ${nextLegacy.daoQuaPoints}.`,
      'good'
    );
  };

  const handleImportSave = (jsonStr: string) => {
    const res = importSaveString(jsonStr);
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    if (res.legacy) {
      setLegacy(res.legacy);
    }
    if (res.state) {
      setSavedRun(res.state);
      setActiveState(res.state);
    } else {
      setSavedRun(null);
      setActiveState(null);
    }
    saveToLocalStorage(res.state ?? null, res.legacy ?? legacy);
    setModalType(null);
    notify('Đã nạp dữ liệu Save JSON thành công!', 'good');
    return { ok: true };
  };

  const handleClearLocalSave = () => {
    setActiveState(null);
    setSavedRun(null);
    setDraftChar(null);
    saveToLocalStorage(null, legacy);
    setModalType(null);
    notify('Đã xóa kiếp đang chơi hiện tại.', 'warn');
  };

  const currentRegionName = activeState
    ? REGIONS.find((r) => r.id === activeState.regionId)?.name ?? 'Đông Hoang'
    : '';
  const currentSectName = activeState?.sectId
    ? SECTS.find((s) => s.id === activeState.sectId)?.name ?? activeState.sectName
    : activeState?.sectName;

  return (
    <>
      {!activeState ? (
        <StartScreen
          legacy={legacy}
          hasSavedRun={Boolean(savedRun)}
          savedRunName={savedRun?.name}
          draftChar={draftChar}
          playerName={playerName}
          inheritedTechId={inheritedTechId}
          onNameChange={setPlayerName}
          onInheritedTechChange={setInheritedTechId}
          onRollDraft={handleRollDraft}
          onConfirmStart={handleConfirmStart}
          onResumeSaved={handleResumeSaved}
          onOpenSaveModal={() => setModalType('save')}
          onOpenRoadmap={() => setRoadmapOpen(true)}
        />
      ) : (
        <div className="app-shell">
          <TopHud
            state={activeState}
            onOpenSave={() => setModalType('save')}
            onOpenRoadmap={() => setRoadmapOpen(true)}
            onBackToStart={handleBackToStart}
            onOpenCrisis={() => setModalType('crisis')}
          />

          <nav className="tab-bar" role="tablist" aria-label="Phân khu tu tiên">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'journey'}
              className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`}
              onClick={() => setActiveTab('journey')}
            >
              <Compass size={16} />
              Hành Trình
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cultivation'}
              className={`tab-btn ${activeTab === 'cultivation' ? 'active' : ''}`}
              onClick={() => setActiveTab('cultivation')}
            >
              <Flame size={16} />
              Tu Luyện
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inventory'}
              className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Backpack size={16} />
              Túi & Chợ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'world'}
              className={`tab-btn ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => setActiveTab('world')}
            >
              <Globe size={16} />
              Thế Giới
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'codex'}
              className={`tab-btn ${activeTab === 'codex' ? 'active' : ''}`}
              onClick={() => setActiveTab('codex')}
            >
              <BookOpen size={16} />
              Tàng Kinh Các
            </button>
          </nav>

          {toast && (
            <div
              className="toast-banner"
              style={{
                borderColor:
                  toast.tone === 'danger'
                    ? 'var(--crimson)'
                    : toast.tone === 'warn'
                      ? 'var(--gold)'
                      : toast.tone === 'good'
                        ? 'var(--emerald)'
                        : 'var(--border-jade)',
              }}
            >
              {toast.text}
            </div>
          )}

          <div className="game-layout">
            <main className="glass-panel workspace-panel">
              {activeTab === 'journey' && (
                <JourneyTab
                  state={activeState}
                  lastOutcome={lastOutcome}
                  onSelectChoice={handleSelectChoice}
                  onAdvanceTime={handleAdvanceTime}
                  onSetStage2Step={handleSetStage2Step}
                  onQuickMeditate={handleMeditate}
                  onOpenCrisis={() => setModalType('crisis')}
                  onOpenEnding={() => setModalType('ending')}
                />
              )}
              {activeTab === 'cultivation' && (
                <CultivationTab
                  state={activeState}
                  onMeditate={handleMeditate}
                  onPurify={handlePurify}
                  onBreakthrough={handleBreakthrough}
                  onComprehendLaw={handleComprehendLaw}
                  onDecipherAncient={handleDecipherAncient}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryTab
                  state={activeState}
                  onUseElixir={handleUseElixir}
                  onEquipItem={handleEquipItem}
                  onSellItem={handleSellItem}
                  onCraft={handleCraft}
                  onLearnProfession={handleLearnProfession}
                  onTrainProfession={handleTrainProfession}
                  onBuyShopItem={handleBuyShopItem}
                />
              )}
              {activeTab === 'world' && (
                <WorldTab
                  state={activeState}
                  onJoinSect={handleJoinSect}
                  onChooseTanTu={handleChooseTanTu}
                  onFoundOwnSect={handleFoundOwnSect}
                  onPromoteSect={handlePromoteSect}
                  onManageMine={handleManageMine}
                  onStealLuck={handleStealLuck}
                  onTravelRegion={handleTravelRegion}
                  onExploreSecretRealm={handleExploreSecretRealm}
                  onChallengeRanking={handleChallengeRanking}
                  onFaceCalamity={handleFaceCalamity}
                />
              )}
              {activeTab === 'codex' && (
                <CodexTab state={activeState} legacy={legacy} />
              )}
            </main>

            <aside className="side-rail">
              <section className="glass-panel workspace-panel">
                <h2 className="section-heading" style={{ fontSize: '1.08rem' }}>
                  <Activity size={17} color="#38bdf8" />
                  Thuộc Tính Cốt Lõi
                </h2>

                <div className="mini-stat-grid">
                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Nhục Thân</div>
                    <div className="mini-stat-value" style={{ color: 'var(--crimson)' }}>
                      {activeState.nhucThan}
                    </div>
                  </div>
                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Ngộ Tính</div>
                    <div className="mini-stat-value" style={{ color: 'var(--jade)' }}>
                      {activeState.ngoTinh}
                    </div>
                  </div>
                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Tâm Cảnh</div>
                    <div className="mini-stat-value" style={{ color: 'var(--purple)' }}>
                      {activeState.tamCanh}
                    </div>
                  </div>
                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Đan Độc</div>
                    <div
                      className="mini-stat-value"
                      style={{ color: activeState.danDoc >= 75 ? 'var(--crimson)' : 'var(--emerald)' }}
                    >
                      {activeState.danDoc}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Xuất thân:</span>{' '}
                    <span className={`rarity-${activeState.origin.rarity}`}>
                      {activeState.origin.name}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Thể chất:</span>{' '}
                    <span className={`rarity-${activeState.physique.rarity}`}>
                      {activeState.physique.name}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Linh căn:</span>{' '}
                    <span className={`rarity-${activeState.spiritRoot.rarity}`}>
                      {activeState.spiritRoot.name}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Mệnh cách:</span>{' '}
                    <span style={{ color: 'var(--gold)' }}>{activeState.fate.name}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Địa vực:</span>{' '}
                    <span>{currentRegionName}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Thế lực:</span>{' '}
                    <span>{currentSectName ?? 'Tán Tu'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Di sản kiếp:</span>{' '}
                    <span style={{ color: 'var(--gold)' }}>
                      {legacy.rebirthCount} lần luân hồi • {legacy.daoQuaPoints} Đạo Quả
                    </span>
                  </div>
                </div>
              </section>

              <section className="glass-panel workspace-panel">
                <h2 className="section-heading" style={{ fontSize: '1.08rem' }}>
                  <ScrollText size={17} color="#fbbf24" />
                  Nhật Ký Nhân Sinh
                </h2>
                <div className="scroll-list" style={{ maxHeight: '340px' }}>
                  {activeState.logs.map((entry) => (
                    <div key={entry.id} className={`log-item log-tone-${entry.tone}`}>
                      <strong style={{ color: 'var(--jade)', marginRight: '0.35rem' }}>
                        <Sparkles size={11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                        [{entry.age.toLocaleString('vi-VN')} tuổi]
                      </strong>
                      <span>{entry.text}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}

      <ModalOverlay
        modalType={modalType}
        state={activeState ?? savedRun}
        legacy={legacy}
        onClose={() => setModalType(null)}
        onDoatXa={handleDoatXa}
        onCryoSleep={handleCryoSleep}
        onReincarnate={handleReincarnate}
        onImportSave={handleImportSave}
        onClearLocalSave={handleClearLocalSave}
      />

      <RoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
    </>
  );
}
