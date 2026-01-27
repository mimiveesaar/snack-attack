import type { GameSessionState, VirtualOpponentState } from '../../game/state';
import { GAME_BOUNDARY } from '../../../shared/config';
import { canEat } from '../collision/rules';
import { findPath, type Hazard } from './path-finding';
import { BOT_PATHFINDING_CONFIG } from '../../config';

export type Direction = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

export type TargetRef = {
  id: string;
  type: 'player' | 'npc' | 'powerup';
};

export class BotMovement {
  computeDirection(
    session: GameSessionState,
    state: ReturnType<GameSessionState['getState']>,
    self: { id: string; position: { x: number; y: number }; xp: number; collisionRadius: number },
    targetRef: TargetRef | null,
    botState: VirtualOpponentState,
    getTargetPosition: (state: ReturnType<GameSessionState['getState']>, target: TargetRef) =>
      | { x: number; y: number }
      | null,
  ): Direction {
    const boundaryDirection = this.boundaryAvoidance(self.position.x, self.position.y);
    if (boundaryDirection) return boundaryDirection;

    const escapeDirection = this.getEscapeDirection(session, self, botState);
    if (escapeDirection) return escapeDirection;

    if (!targetRef) {
      return this.randomDirection(botState);
    }

    const targetPos = getTargetPosition(state, targetRef);
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

    const axisDeadzone = 4;
    let xDir: Direction['x'] = this.axisFromDelta(dx, axisDeadzone);
    let yDir: Direction['y'] = this.axisFromDelta(dy, axisDeadzone);

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

  isImmediateThreat(
    session: GameSessionState,
    self: { id: string; position: { x: number; y: number }; xp: number; collisionRadius: number },
    botState: VirtualOpponentState,
  ): boolean {
    const state = session.getState();
    const panicBuffer = botState.profile.panicBuffer;

    const getDistanceToSelf = (pos: { x: number; y: number }) => {
      const dx = pos.x - self.position.x;
      const dy = pos.y - self.position.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    for (const player of state.players) {
      if (player.id === self.id || player.status !== 'alive') continue;
      if (player.xp <= self.xp) continue;
      if (session.isPlayerInGrace(player.id)) continue;

      const distance = getDistanceToSelf(player.position);
      if (distance <= player.collisionRadius + self.collisionRadius + panicBuffer) {
        return true;
      }
    }

    for (const npc of state.npcs) {
      if (npc.status !== 'alive') continue;
      if (!canEat(npc.collisionRadius, self.collisionRadius)) continue;

      const distance = getDistanceToSelf(npc.position);
      if (distance <= npc.collisionRadius + self.collisionRadius + panicBuffer) {
        return true;
      }
    }

    return false;
  }

  private getEscapeDirection(
    session: GameSessionState,
    self: { id: string; position: { x: number; y: number }; xp: number; collisionRadius: number },
    botState: VirtualOpponentState,
  ): Direction | null {
    if (!this.isImmediateThreat(session, self, botState)) return null;

    const state = session.getState();
    const panicBuffer = botState.profile.panicBuffer;

    let vectorX = 0;
    let vectorY = 0;

    const applyThreatVector = (threatPos: { x: number; y: number }, threatRadius: number) => {
      const dx = self.position.x - threatPos.x;
      const dy = self.position.y - threatPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const weight = Math.max(1, threatRadius + self.collisionRadius + panicBuffer) / distance;
      vectorX += (dx / distance) * weight;
      vectorY += (dy / distance) * weight;
    };

    for (const player of state.players) {
      if (player.id === self.id || player.status !== 'alive') continue;
      if (player.xp <= self.xp) continue;
      if (session.isPlayerInGrace(player.id)) continue;
      applyThreatVector(player.position, player.collisionRadius);
    }

    for (const npc of state.npcs) {
      if (npc.status !== 'alive') continue;
      if (!canEat(npc.collisionRadius, self.collisionRadius)) continue;
      applyThreatVector(npc.position, npc.collisionRadius);
    }

    const xDir = this.axisFromVector(vectorX, botState);
    const yDir = this.axisFromVector(vectorY, botState);

    if (xDir === 0 && yDir === 0) return this.randomDirection(botState);
    return { x: xDir, y: yDir };
  }

  private axisFromVector(value: number, botState: VirtualOpponentState): Direction['x'] {
    const threshold = 0.1;
    if (Math.abs(value) < threshold) return this.randomAxis(botState);
    return value > 0 ? 1 : -1;
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

  private boundaryAvoidance(x: number, y: number): Direction | null {
    if (x <= GAME_BOUNDARY.buffer) return { x: 1, y: 0 };
    if (x >= GAME_BOUNDARY.width - GAME_BOUNDARY.buffer) return { x: -1, y: 0 };
    if (y <= GAME_BOUNDARY.buffer) return { x: 0, y: 1 };
    if (y >= GAME_BOUNDARY.height - GAME_BOUNDARY.buffer) return { x: 0, y: -1 };
    return null;
  }

  private axisFromDelta(delta: number, deadzone: number): Direction['x'] {
    if (Math.abs(delta) <= deadzone) return 0;
    return delta > 0 ? 1 : -1;
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