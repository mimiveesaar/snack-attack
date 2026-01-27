import type { GameSessionState, VirtualOpponentState, BotRoster } from '../../game/state';
import { BOT_PROFILES } from './bot-profiles';
import { GAME_BOUNDARY } from '../../../shared/config';

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
      ? this.selectTarget(state, self.id, self.xp, botState)
      : currentTarget;

    if (shouldSwitchTarget) {
      botState.currentTargetId = targetRef ? `${targetRef.type}:${targetRef.id}` : null;
      botState.lastDirectionChangeAt = now;
    }

    const direction = this.computeDirection(state, self, targetRef, botState);
    session.applyPlayerInput(botId, direction);
  }

  private selectTarget(
    state: ReturnType<GameSessionState['getState']>,
    botId: string,
    botXp: number,
    botState: VirtualOpponentState,
  ): TargetRef | null {
    const players = state.players.filter(
      (p) => p.id !== botId && p.status === 'alive',
    );

    const threats = players.filter((p) => p.xp > botXp);
    const preyPlayers = players.filter(
      (p) => p.xp <= botXp || this.roll(botState, botState.profile.riskTolerance),
    );

    const preyNpcs = state.npcs.filter((npc) => npc.status === 'alive');

    const preyTargets: TargetRef[] = [
      ...preyPlayers.map((p) => ({ id: p.id, type: 'player' as const })),
      ...preyNpcs.map((n) => ({ id: n.id, type: 'npc' as const })),
    ];

    if (preyTargets.length > 0) {
      return this.findNearestTarget(state, botId, preyTargets);
    }

    if (threats.length > 0) {
      const threatTargets = threats.map((p) => ({ id: p.id, type: 'player' as const }));
      return this.findNearestTarget(state, botId, threatTargets);
    }

    return null;
  }

  private findNearestTarget(
    state: ReturnType<GameSessionState['getState']>,
    botId: string,
    targets: TargetRef[],
  ): TargetRef | null {
    const self = state.players.find((p) => p.id === botId);
    if (!self) return null;

    let closest: TargetRef | null = null;
    let closestDist = Number.POSITIVE_INFINITY;

    for (const target of targets) {
      const position = this.getTargetPosition(state, target);
      if (!position) continue;
      const dx = position.x - self.position.x;
      const dy = position.y - self.position.y;
      const dist = dx * dx + dy * dy;
      if (dist < closestDist) {
        closestDist = dist;
        closest = target;
      }
    }

    return closest;
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
