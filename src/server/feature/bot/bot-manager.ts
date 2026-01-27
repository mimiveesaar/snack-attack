import type { GameSessionState, VirtualOpponentState, BotRoster } from '../../game/state';
import { BOT_PROFILES } from './bot-profiles';
import { GAME_BOUNDARY } from '../../../shared/config';
import { canEat } from '../collision/rules';

type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

type TargetRef = {
  id: string;
  type: 'player' | 'npc';
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
        lastDecisionAt: now,
        nextDecisionAt: now,
        lastDirectionChangeAt: now,
        seed: Math.floor(Math.random() * 100000),
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
    if (now < botState.nextDecisionAt) return;

    botState.lastDecisionAt = now;
    botState.nextDecisionAt = now + botState.profile.reactionIntervalMs;

    const state = session.getState();
    const self = state.players.find((p) => p.id === botId);
    if (!self) return;

    const currentTarget = this.getTargetFromId(state, botState.currentTargetId);
    const shouldSwitchTarget =
      !currentTarget ||
      now - botState.lastDirectionChangeAt >= botState.profile.targetSwitchIntervalMs;

    const targetRef = shouldSwitchTarget
      ? this.selectTarget(session, self, botState)
      : currentTarget;

    if (shouldSwitchTarget) {
      botState.currentTargetId = targetRef ? `${targetRef.type}:${targetRef.id}` : null;
      botState.lastDirectionChangeAt = now;
    }

    const direction = this.computeDirection(state, self, targetRef, botState);
    session.applyPlayerInput(botId, direction);
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
  ): TargetRef | null {
    const state = session.getState();

    const playerTargets = state.players
      .filter((p) => p.id !== self.id && p.status === 'alive')
      .map((p) => ({ id: p.id, type: 'player' as const }));

    const npcTargets = state.npcs
      .filter((npc) => npc.status === 'alive')
      .map((npc) => ({ id: npc.id, type: 'npc' as const }));

    const targets = [...playerTargets, ...npcTargets];

    let bestTarget: TargetRef | null = null;
    let bestScore = 0;

    for (const target of targets) {
      const score = this.getTargetScore(session, self, target, botState);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    return bestTarget;
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
  ): number {
    const state = session.getState();
    const targetPosition = this.getTargetPosition(state, target);
    if (!targetPosition) return 0;

    const canEatTarget = this.canEatTarget(session, self, target);
    if (!canEatTarget) return 0;

    const baseValue = this.getTargetBaseValue(state, target, botState);
    if (baseValue <= 0) return 0;

    const dx = targetPosition.x - self.position.x;
    const dy = targetPosition.y - self.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const distanceFactor = 1 / (1 + distance);

    return baseValue * distanceFactor;
  }

  private getTargetBaseValue(
    state: ReturnType<GameSessionState['getState']>,
    target: TargetRef,
    botState: VirtualOpponentState,
  ): number {
    if (target.type === 'npc') {
      const npc = state.npcs.find((n) => n.id === target.id);
      return npc ? npc.xp : 0;
    }

    const player = state.players.find((p) => p.id === target.id);
    if (!player) return 0;

    const playerMultiplier = this.getPlayerValueMultiplier(state.difficulty, botState);
    const normalizedValue = Math.max(1, player.xp);
    return normalizedValue * playerMultiplier;
  }

  private canEatTarget(
    session: GameSessionState,
    self: {
      id: string;
      xp: number;
      collisionRadius: number;
    },
    target: TargetRef,
  ): boolean {
    const state = session.getState();
    if (target.type === 'npc') {
      const npc = state.npcs.find((n) => n.id === target.id);
      if (!npc || npc.status !== 'alive') return false;
      return canEat(self.collisionRadius, npc.collisionRadius);
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
    botState: VirtualOpponentState,
  ): number {
    switch (difficulty) {
      case 'easy':
        return 0.6 + botState.profile.riskTolerance * 0.2;
      case 'medium':
        return 1;
      case 'hard':
        return 1.4 + (1 - botState.profile.riskTolerance) * 0.2;
      default:
        return 1;
    }
  }

  private getTargetPosition(
    state: ReturnType<GameSessionState['getState']>,
    target: TargetRef,
  ) {
    if (target.type === 'npc') {
      return state.npcs.find((n) => n.id === target.id)?.position ?? null;
    }
    return state.players.find((p) => p.id === target.id)?.position ?? null;
  }

  private getTargetFromId(
    state: ReturnType<GameSessionState['getState']>,
    targetId: string | null,
  ): TargetRef | null {
    if (!targetId) return null;
    const [type, id] = targetId.split(':');
    if (type !== 'player' && type !== 'npc') return null;
    const targetRef: TargetRef = { type, id } as TargetRef;
    const exists = this.getTargetPosition(state, targetRef);
    return exists ? targetRef : null;
  }

  private computeDirection(
    state: ReturnType<GameSessionState['getState']>,
    self: { position: { x: number; y: number }; xp: number },
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

    const dx = targetPos.x - self.position.x;
    const dy = targetPos.y - self.position.y;

    let xDir: Direction['x'] = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    let yDir: Direction['y'] = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    if (targetRef.type === 'player') {
      const target = state.players.find((p) => p.id === targetRef.id);
      if (target && target.xp > self.xp) {
        xDir = xDir === 0 ? 0 : (xDir * -1) as Direction['x'];
        yDir = yDir === 0 ? 0 : (yDir * -1) as Direction['y'];
      }
    }

    if (this.roll(botState, botState.profile.jitterStrength)) {
      if (this.roll(botState, 0.5)) {
        xDir = this.randomAxis(botState);
      } else {
        yDir = this.randomAxis(botState);
      }
    }

    if (xDir === 0 && yDir === 0) {
      return this.randomDirection(botState);
    }

    return { x: xDir, y: yDir };
  }

  private boundaryAvoidance(x: number, y: number): Direction | null {
    const padding = 60;
    if (x <= GAME_BOUNDARY.buffer + padding) return { x: 1, y: 0 };
    if (x >= GAME_BOUNDARY.width - GAME_BOUNDARY.buffer - padding) return { x: -1, y: 0 };
    if (y <= GAME_BOUNDARY.buffer + padding) return { x: 0, y: 1 };
    if (y >= GAME_BOUNDARY.height - GAME_BOUNDARY.buffer - padding) return { x: 0, y: -1 };
    return null;
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

  private roll(botState: VirtualOpponentState, threshold: number): boolean {
    return this.nextRandom(botState) < threshold;
  }

  private nextRandom(botState: VirtualOpponentState): number {
    const next = (botState.seed * 9301 + 49297) % 233280;
    botState.seed = next;
    return next / 233280;
  }
}

export const botManager = new BotManager();
