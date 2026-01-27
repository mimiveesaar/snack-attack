import type { GameSessionState, VirtualOpponentState, BotRoster } from '../../game/state';
import { BOT_PROFILES } from './bot-profiles';
import { canEat } from '../collision/rules';
import { BotMovement, type Direction, type TargetRef } from './bot-movement';

export class BotManager {
  private rosters = new Map<string, BotRoster>();
  private movement = new BotMovement();

  initializeSession(sessionId: string): void {
    this.rosters.set(sessionId, { byPlayerId: {} });
  }

  clearSession(sessionId: string): void {
    this.rosters.delete(sessionId);
  }

  tick(session: GameSessionState): void {
    const state = session.getState();
    const roster = this.rosters.get(state.sessionId);
    if (!roster) return;

    const difficulty = state.difficulty;
    const profile = BOT_PROFILES[difficulty];
    const now = Date.now();

    for (const player of state.players) {
      if (!player.isBot || player.status !== 'alive') continue;

      const botState = this.ensureBotState(roster, player.id, profile, now);
      this.updateBotDecision(session, player.id, botState, now);
    }
  }

  private ensureBotState(
    roster: BotRoster,
    playerId: string,
    profile: VirtualOpponentState['profile'],
    now: number,
  ): VirtualOpponentState {
    if (!roster.byPlayerId[playerId]) {
      roster.byPlayerId[playerId] = {
        playerId,
        profile,
        currentTargetId: null,
        currentTargetValue: 0,
        nextTargetUpgradeAt: now,
        lastInputDirection: null,
        lastInputChangeAt: now,
        lastDecisionAt: now,
        nextDecisionAt: now,
        lastDirectionChangeAt: now,
        seed: Math.floor(Math.random() * 100000),
        ignoreOpponentUntil: {},
      };
    }

    return roster.byPlayerId[playerId];
  }

  private updateBotDecision(
    session: GameSessionState,
    botId: string,
    botState: VirtualOpponentState,
    now: number,
  ): void {
    const state = session.getState();
    const self = state.players.find((p) => p.id === botId);
    if (!self) return;

    const currentTarget = this.getTargetFromId(state, botState.currentTargetId);
    let targetRef = currentTarget;

    //Makes bot targeting slower and less frequent.
    const shouldEvaluateTarget = !currentTarget || now >= botState.nextDecisionAt;

    if (shouldEvaluateTarget) {
      botState.lastDecisionAt = now;
      botState.nextDecisionAt = now + botState.profile.reactionIntervalMs;

      const currentScore = currentTarget
        ? this.getTargetScore(session, self, currentTarget, botState, now)
        : 0;
      const { target: bestTarget, score: bestScore } = this.selectTarget(
        session,
        self,
        botState,
        now,
      );

      const isPlayerTarget = currentTarget?.type === 'player';
      const switchDueToInterval =
        isPlayerTarget &&
        now - botState.lastDirectionChangeAt >= botState.profile.targetSwitchIntervalMs;

      const canUpgradeTarget =
        bestScore > currentScore && now >= botState.nextTargetUpgradeAt;

      const shouldSwitchTarget =
        !currentTarget ||
        currentScore <= 0 ||
        switchDueToInterval ||
        (bestScore > currentScore && canUpgradeTarget);

      if (switchDueToInterval) {
        botState.ignoreOpponentUntil[currentTarget.id] =
          now + botState.profile.opponentTargetCooldownMs;
      }

      if (shouldSwitchTarget) {
        targetRef = bestTarget;
        botState.currentTargetId = targetRef ? `${targetRef.type}:${targetRef.id}` : null;
        botState.currentTargetValue = targetRef ? bestScore : 0;
        botState.lastDirectionChangeAt = now;

        if (bestScore > currentScore) {
          botState.nextTargetUpgradeAt = now + botState.profile.targetUpgradeCooldownMs;
        }
      } else {
        botState.currentTargetValue = currentScore;
      }
    }

    const desiredDirection = this.movement.computeDirection(
      session,
      state,
      self,
      targetRef,
      botState,
      this.getTargetPosition.bind(this),
    );
    const lastDirection = botState.lastInputDirection;
    const canChangeDirection =
      now - botState.lastInputChangeAt >= botState.profile.directionChangeCooldownMs;
    const isThreatened = this.movement.isImmediateThreat(session, self, botState);

    if (
      lastDirection &&
      !this.isSameDirection(lastDirection, desiredDirection) &&
      !canChangeDirection &&
      !isThreatened
    ) {
      session.applyPlayerInput(botId, lastDirection);
      return;
    }

    if (!lastDirection || !this.isSameDirection(lastDirection, desiredDirection)) {
      botState.lastInputDirection = desiredDirection;
      botState.lastInputChangeAt = now;
    }

    session.applyPlayerInput(botId, desiredDirection);
  }

  private selectTarget(
    session: GameSessionState,
    self: {
      id: string;
      xp: number;
      position: { x: number; y: number };
      collisionRadius: number;
      powerups: string[];
    },
    botState: VirtualOpponentState,
    now: number,
  ): { target: TargetRef | null; score: number } {
    const state = session.getState();

    const playerTargets = state.players
      .filter((p) => p.id !== self.id && p.status === 'alive')
      .map((p) => ({ id: p.id, type: 'player' as const }));

    const npcTargets = state.npcs
      .filter((npc) => npc.status === 'alive')
      .map((npc) => ({ id: npc.id, type: 'npc' as const }));

    const powerupTargets = state.powerups
      .filter((powerup) => powerup.status === 'available')
      .map((powerup) => ({ id: powerup.id, type: 'powerup' as const }));

    const targets = [...playerTargets, ...npcTargets, ...powerupTargets];

    let bestTarget: TargetRef | null = null;
    let bestScore = 0;

    for (const target of targets) {
      const score = this.getTargetScore(session, self, target, botState, now);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return { target: bestTarget, score: bestScore };
  }

  private getTargetScore(
    session: GameSessionState,
    self: {
      id: string;
      xp: number;
      position: { x: number; y: number };
      collisionRadius: number;
      powerups: string[];
    },
    target: TargetRef,
    botState: VirtualOpponentState,
    now: number,
  ): number {
    if (target.type === 'player' && this.isOpponentIgnored(botState, target.id, now)) {
      return 0;
    }

    const state = session.getState();
    const targetPosition = this.getTargetPosition(state, target);
    if (!targetPosition) return 0;

    const canEatTarget = this.canEatTarget(session, self, target);
    if (!canEatTarget) return 0;

    const baseValue = this.getTargetBaseValue(state, self, target, botState);
    if (baseValue <= 0) return 0;

    const dx = targetPosition.x - self.position.x;
    const dy = targetPosition.y - self.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const distanceFactor = 1 / (1 + distance * distance );

    return baseValue * distanceFactor;
  }

  private getTargetBaseValue(
    state: ReturnType<GameSessionState['getState']>,
    self: { powerups: string[] },
    target: TargetRef,
    botState: VirtualOpponentState,
  ): number {
    if (target.type === 'npc') {
      const npc = state.npcs.find((n) => n.id === target.id);
      return npc ? npc.xp : 0;
    }

    if (target.type === 'powerup') {
      const powerup = state.powerups.find((p) => p.id === target.id);
      if (!powerup || powerup.status !== 'available') return 0;

      const hasPowerup = self.powerups.includes(powerup.type);

      const getBaseValue = () => {
        switch (powerup.type) {
            case 'speed-boost': return 120; 
            case 'double-xp': return 130; 
            case 'invincibility': return 120;        
          }
      }

      const baseValue = getBaseValue();
      return hasPowerup ? baseValue * 0.4 : baseValue;
    }

    const player = state.players.find((p) => p.id === target.id);
    if (!player) return 0;

    const playerMultiplier = this.getPlayerValueMultiplier(state.difficulty);
    const normalizedValue = Math.max(1, player.xp);
    return normalizedValue * playerMultiplier;
  }

  private canEatTarget(
    session: GameSessionState,
    self: {
      id: string;
      xp: number;
      collisionRadius: number;
      powerups: string[];
    },
    target: TargetRef,
  ): boolean {
    const state = session.getState();
    if (target.type === 'npc') {
      const npc = state.npcs.find((n) => n.id === target.id);
      if (!npc || npc.status !== 'alive') return false;
      return canEat(self.collisionRadius, npc.collisionRadius);
    }

    if (target.type === 'powerup') {
      const powerup = state.powerups.find((p) => p.id === target.id);
      return Boolean(powerup && powerup.status === 'available');
    }

    const player = state.players.find((p) => p.id === target.id);
    if (!player || player.status !== 'alive') return false;
    if (player.xp >= self.xp) return false;
    if (session.isPlayerInGrace(player.id)) return false;
    if (player.powerups.includes('invincibility')) return false;
    return true;
  }

  private getPlayerValueMultiplier(
    difficulty: ReturnType<GameSessionState['getState']>['difficulty'],
  ): number {
    switch (difficulty) {
      case 'easy':
        return 1.2;
      case 'medium':
        return 2;
      case 'hard':
        return 3;
      default:
        return 1;
    }
  }

  private isOpponentIgnored(
    botState: VirtualOpponentState,
    playerId: string,
    now: number,
  ): boolean {
    const ignoredUntil = botState.ignoreOpponentUntil[playerId];
    if (!ignoredUntil) return false;
    if (now >= ignoredUntil) {
      delete botState.ignoreOpponentUntil[playerId];
      return false;
    }
    return true;
  }

  private getTargetPosition(
    state: ReturnType<GameSessionState['getState']>,
    target: TargetRef,
  ) {
    if (target.type === 'npc') {
      return state.npcs.find((n) => n.id === target.id)?.position ?? null;
    }
    if (target.type === 'powerup') {
      return state.powerups.find((p) => p.id === target.id)?.position ?? null;
    }
    return state.players.find((p) => p.id === target.id)?.position ?? null;
  }

  private getTargetFromId(
    state: ReturnType<GameSessionState['getState']>,
    targetId: string | null,
  ): TargetRef | null {
    if (!targetId) return null;
    const [type, id] = targetId.split(':');
    if (type !== 'player' && type !== 'npc' && type !== 'powerup') return null;
    const targetRef: TargetRef = { type, id } as TargetRef;
    const exists = this.getTargetPosition(state, targetRef);
    return exists ? targetRef : null;
  }

  private isSameDirection(a: Direction, b: Direction): boolean {
    return a.x === b.x && a.y === b.y;
  }
}

export const botManager = new BotManager();
