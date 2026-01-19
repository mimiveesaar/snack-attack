import type { Namespace, Socket } from 'socket.io';

import { lobbyStore, type LobbyRecord } from './lobby-store';
import { lobbyOrchestrator } from './lobby-orchestrator';
import { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

const NICKNAME_REGEX = /^[A-Za-z0-9]{1,31}$/;

function toLobbyState(lobby: LobbyRecord) {
	const { waiting: _waiting, joinCounter: _joinCounter, activeSession: _activeSession, ...state } = lobby;
	return state;
}

type LobbySocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type LobbyNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;

export class LobbyController {
	constructor(
		private readonly lobbyNs: LobbyNamespace,
		private readonly shareBase: string,
	) {}

	register(socket: LobbySocket) {
		socket.data.playerId = socket.id;

		socket.on('lobby:create', (payload, callback) => {
			if (!NICKNAME_REGEX.test(payload.nickname)) {
				socket.emit('lobby:error', { message: 'Invalid nickname' });
				callback(null as unknown as any);
				return;
			}

			const lobby = lobbyOrchestrator.createLobby({
				playerId: socket.id,
				nickname: payload.nickname,
				color: payload.color,
				baseUrl: this.shareBase,
			});

			socket.data.lobbyId = lobby.lobbyId;
			socket.join(lobby.lobbyId);
			callback(toLobbyState(lobby));
			this.lobbyNs.to(lobby.lobbyId).emit('lobby:state', toLobbyState(lobby));
		});

		socket.on('lobby:join', (payload, callback) => {
			if (!NICKNAME_REGEX.test(payload.nickname)) {
				socket.emit('lobby:error', { message: 'Invalid nickname' });
				callback(null as unknown as any);
				return;
			}

			const result = lobbyOrchestrator.joinLobby({
				lobbyId: payload.lobbyId,
				playerId: socket.id,
				nickname: payload.nickname,
				color: payload.color,
			});

			if (!result.state) {
				socket.emit('lobby:error', { message: 'Lobby not found' });
				callback(null as unknown as any);
				return;
			}

			if (result.error) {
				socket.emit('lobby:error', { message: result.error });
				callback(null as unknown as any);
				return;
			}

			socket.data.lobbyId = payload.lobbyId;
			socket.join(payload.lobbyId);

			if (result.waiting && result.state.activeSession) {
				const { activeSession } = result.state;
				socket.emit('game:waiting', {
					lobbyId: result.state.lobbyId,
					leaderboard: activeSession?.leaderboard ?? [],
					timerRemainingMs: activeSession?.timerRemainingMs ?? 0,
				});
			} else {
				callback(toLobbyState(result.state));
				this.lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(result.state));
			}
		});

		socket.on('lobby:updateSettings', (payload, callback) => {
			const result = lobbyOrchestrator.updateSettings({
				lobbyId: payload.lobbyId,
				leaderId: socket.id,
				gamemode: payload.gamemode,
				difficulty: payload.difficulty,
			});

			if (!result.state) {
				if (result.error) socket.emit('lobby:error', { message: result.error });
				callback(null as unknown as any);
				return;
			}

			for (const kicked of result.kicked ?? []) {
				this.lobbyNs.to(kicked.id).emit('lobby:kicked', { reason: 'capacity' });
				this.lobbyNs.sockets.get(kicked.id)?.leave(payload.lobbyId);
			}

			const state = toLobbyState(result.state);
			callback(state);
			this.lobbyNs.to(payload.lobbyId).emit('lobby:state', state);
		});

		socket.on('lobby:start', (payload, callback) => {
			const result = lobbyOrchestrator.startGame(payload.lobbyId, socket.id);
			if (!result.session) {
				if (result.error) socket.emit('lobby:error', { message: result.error });
				callback(null as unknown as any);
				return;
			}

			const lobby = lobbyStore.getState(payload.lobbyId);
			if (lobby) {
				this.lobbyNs.to(payload.lobbyId).emit('game:started', result.session);
				this.lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(lobby));
				gameSessionManager.start(payload.lobbyId, this.lobbyNs);
			}

			callback(result.session);
		});

		socket.on('lobby:leave', (payload) => {
			socket.leave(payload.lobbyId);
			const { state, deleted } = lobbyOrchestrator.leaveLobby(payload.lobbyId, socket.id);
			if (state && !deleted) {
				this.lobbyNs.to(payload.lobbyId).emit('lobby:state', toLobbyState(state));
			}
		});

		socket.on('disconnect', () => {
			const lobbyId = socket.data.lobbyId as string | undefined;
			if (!lobbyId) return;
			const { state, deleted } = lobbyOrchestrator.leaveLobby(lobbyId, socket.id);
			if (state && !deleted) {
				this.lobbyNs.to(lobbyId).emit('lobby:state', toLobbyState(state));
			} else if (deleted) {
				gameSessionManager.stop(lobbyId);
			}
		});
	}
}
