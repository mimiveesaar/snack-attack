/**
 * Clock synchronization module for client-server time alignment.
 *
 * Uses a simple ping-pong handshake:
 * 1. Client sends 'clock:ping' with clientTimeMs
 * 2. Server responds with 'clock:pong' { serverTimeMs, clientTimeMs }
 * 3. Client calculates offset: (serverTimeMs - clientTimeMs) / 2
 *
 * This allows clients to estimate server time and compensate for latency.
 */

export interface ClockSyncPayload {
  clientTimeMs: number;
}

export interface ClockPongPayload {
  serverTimeMs: number;
  clientTimeMs: number;
}

/**
 * Clock synchronization state for a player
 */
export class PlayerClockSync {
  private offsetMs: number = 0; // Estimated time offset (server - client)
  private lastSyncMs: number = 0;
  private sampleCount: number = 0;

  /**
   * Process ping from client and return pong payload
   */
  processPing(clientTimeMs: number): ClockPongPayload {
    return {
      serverTimeMs: Date.now(),
      clientTimeMs,
    };
  }

  /**
   * Process pong response from server (client-side calculation)
   * Call this on client after receiving pong payload
   */
  processPong(serverTimeMs: number, clientTimeMs: number): void {
    // Calculate round-trip time
    const clientNowMs = Date.now();
    const roundTripMs = clientNowMs - clientTimeMs;

    // Estimate server time: account for half the round-trip
    const estimatedServerTimeMs = serverTimeMs + roundTripMs / 2;
    const newOffset = estimatedServerTimeMs - clientNowMs;

    // Running average to smooth out variance
    this.offsetMs = this.sampleCount === 0 ? newOffset : (this.offsetMs * this.sampleCount + newOffset) / (this.sampleCount + 1);

    this.lastSyncMs = Date.now();
    this.sampleCount++;
  }

  /**
   * Get estimated server time (client-side)
   */
  getEstimatedServerTimeMs(): number {
    return Date.now() + this.offsetMs;
  }

  /**
   * Get offset in milliseconds
   */
  getOffsetMs(): number {
    return this.offsetMs;
  }

  /**
   * Check if sync is stale (older than threshold)
   */
  isStaleSyncMs(thresholdMs: number = 5000): boolean {
    return Date.now() - this.lastSyncMs > thresholdMs;
  }
}

/**
 * Global clock sync manager
 */
const syncMap = new Map<string, PlayerClockSync>();

export function createPlayerClockSync(playerId: string): PlayerClockSync {
  const sync = new PlayerClockSync();
  syncMap.set(playerId, sync);
  return sync;
}

export function getPlayerClockSync(playerId: string): PlayerClockSync | undefined {
  return syncMap.get(playerId);
}

export function deletePlayerClockSync(playerId: string): void {
  syncMap.delete(playerId);
}
