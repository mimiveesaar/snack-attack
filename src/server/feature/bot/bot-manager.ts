import type { GameSessionState, VirtualOpponentState, BotRoster } from '../../game/state';
import { BOT_PROFILES } from './bot-profiles';
import { GAME_BOUNDARY } from '../../../shared/config';
import { canEat } from '../collision/rules';
import { findPath, type Hazard } from './path-finding';
import { BOT_PATHFINDING_CONFIG } from '../../config';

type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

type TargetRef = {
  id: string;
  type: 'player' | 'npc' | 'powerup';
};

export class BotManager {
  private rosters = new Map<string, BotRoster>();

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

    //Makes bot more stupid.
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

    const desiredDirection = this.computeDirection(session, state, self, targetRef, botState);
    const lastDirection = botState.lastInputDirection;
    const canChangeDirection =
      now - botState.lastInputChangeAt >= botState.profile.directionChangeCooldownMs;
    const isThreatened = this.isImmediateThreat(session, self);

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
    const distanceFactor = 1 / (1 + distance);

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

  private computeDirection(
    session: GameSessionState,
    state: ReturnType<GameSessionState['getState']>,
    self: { id: string; position: { x: number; y: number }; xp: number; collisionRadius: number },
    targetRef: TargetRef | null,
    botState: VirtualOpponentState,
  ): Direction {
    const boundaryDirection = this.boundaryAvoidance(self.position.x, self.position.y);
    if (boundaryDirection) return boundaryDirection;

    if (!targetRef) {
      return this.randomDirection(botState);
    }

    const targetPos = this.getTargetPosition(state, targetRef);
    if (!targetPos) return this.randomDirection(botState);

    const hazards = this.buildHazards(session, self);
    const path = findPath(self.position, targetPos, hazards, {
      width: GAME_BOUNDARY.width,
      height: GAME_BOUNDARY.height,
      buffer: GAME_BOUNDARY.buffer,
      ...BOT_PATHFINDING_CONFIG,
    });

    const waypoint = path.length > 1 ? path[1] : path.length === 1 ? path[0] : targetPos;

    const dx = waypoint.x - self.position.x;
    const dy = waypoint.y - self.position.y;

    let xDir: Direction['x'] = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    let yDir: Direction['y'] = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    if (targetRef.type === 'player') {
      const target = state.players.find((p) => p.id === targetRef.id);
      if (target && target.xp > self.xp) {
        xDir = xDir === 0 ? 0 : (xDir * -1) as Direction['x'];
        yDir = yDir === 0 ? 0 : (yDir * -1) as Direction['y'];
      }
    }

        if (xDir === 0 && yDir === 0) {
      return this.randomDirection(botState);
    }

    return { x: xDir, y: yDir };
  }

  private buildHazards(
    session: GameSessionState,
    self: { id: string; xp: number; collisionRadius: number },
  ): Hazard[] {
    const state = session.getState();
    const hazards: Hazard[] = [];

    for (const player of state.players) {
      if (player.id === self.id || player.status !== 'alive') continue;
      if (player.xp <= self.xp) continue;
      if (session.isPlayerInGrace(player.id)) continue;

      const baseRadius = player.collisionRadius + self.collisionRadius;
      hazards.push({
        position: player.position,
        hardRadius: baseRadius + 10,
        influenceRadius: baseRadius + 140,
        weight: 1.2,
      });
    }

    for (const npc of state.npcs) {
      if (npc.status !== 'alive') continue;
      if (!canEat(npc.collisionRadius, self.collisionRadius)) continue;

      const baseRadius = npc.collisionRadius + self.collisionRadius;
      hazards.push({
        position: npc.position,
        hardRadius: baseRadius + 8,
        influenceRadius: baseRadius + 110,
        weight: 1,
      });
    }

    return hazards;
  }

  private isImmediateThreat(
    session: GameSessionState,
    self: { id: string; position: { x: number; y: number }; xp: number; collisionRadius: number },
  ): boolean {
    const state = session.getState();
    const panicBuffer = 30;

    for (const player of state.players) {
      if (player.id === self.id || player.status !== 'alive') continue;
      if (player.xp <= self.xp) continue;
      if (session.isPlayerInGrace(player.id)) continue;

      const dx = player.position.x - self.position.x;
      const dy = player.position.y - self.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= player.collisionRadius + self.collisionRadius + panicBuffer) {
        return true;
      }
    }

    for (const npc of state.npcs) {
      if (npc.status !== 'alive') continue;
      if (!canEat(npc.collisionRadius, self.collisionRadius)) continue;

      const dx = npc.position.x - self.position.x;
      const dy = npc.position.y - self.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= npc.collisionRadius + self.collisionRadius + panicBuffer) {
        return true;
      }
    }

    return false;
  }

  private boundaryAvoidance(x: number, y: number): Direction | null {
    const padding = 60;
    if (x <= GAME_BOUNDARY.buffer + padding) return { x: 1, y: 0 };
    if (x >= GAME_BOUNDARY.width - GAME_BOUNDARY.buffer - padding) return { x: -1, y: 0 };
    if (y <= GAME_BOUNDARY.buffer + padding) return { x: 0, y: 1 };
    if (y >= GAME_BOUNDARY.height - GAME_BOUNDARY.buffer - padding) return { x: 0, y: -1 };
    return null;
  }

  private isSameDirection(a: Direction, b: Direction): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private randomDirection(botState: VirtualOpponentState): Direction {
    const x = this.randomAxis(botState);
    const y = this.randomAxis(botState);
    if (x === 0 && y === 0) {
      return { x: 1, y: 0 };
    }
    return { x, y };
  }

  private randomAxis(botState: VirtualOpponentState): Direction['x'] {
    const roll = this.nextRandom(botState);
    if (roll < 0.33) return -1;
    if (roll < 0.66) return 0;
    return 1;
  }


  private nextRandom(botState: VirtualOpponentState): number {
    const next = (botState.seed * 9301 + 49297) % 233280;
    botState.seed = next;
    return next / 233280;
  }
}

export const botManager = new BotManager();
