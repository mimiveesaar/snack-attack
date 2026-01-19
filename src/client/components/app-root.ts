import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { lobbyClient, type ClientState } from '@client/state/lobby-state';
import { getLobbyIdFromUrl, getSeedFromUrl, isGameRoute, resetLobbyUrl } from '@client/state/router';
import type { LobbyState } from '@shared/types';
import './lobby-entry';
import './player-list';
import './lobby-controls';
import './share-url';
import './waiting-view';
import '../feature/map/game-view';

@customElement('app-root')
export class AppRoot extends LitElement {
  @state() private clientState: ClientState = lobbyClient.getState();

  createRenderRoot() {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    lobbyClient.subscribe((state) => {
      this.clientState = state;
    });
  }

  private handleEntrySubmit = (event: CustomEvent<{ nickname: string; color: string }>) => {
    const lobbyId = getLobbyIdFromUrl();
    if (lobbyId) {
      lobbyClient.joinLobby(event.detail.nickname, event.detail.color);
    } else {
      lobbyClient.createLobby(event.detail.nickname, event.detail.color);
    }
  };

  private handleSettingsChange = (event: CustomEvent<{ gamemode: LobbyState['gamemode']; difficulty: LobbyState['difficulty']; lobbyId: string }>) => {
    lobbyClient.updateSettings(event.detail);
  };

  private handleStartGame = (event: CustomEvent<{ lobbyId: string }>) => {
    lobbyClient.startGame(event.detail.lobbyId);
  };

  private leaveLobby = () => {
    lobbyClient.leaveLobby();
    resetLobbyUrl();
  };

  render() {
    const { view, lobby, waiting, error } = this.clientState;
    if (isGameRoute()) {
      const seed = getSeedFromUrl() ?? '';
      return html`<game-view .seed=${seed}></game-view>`;
    }
    return html`
      <div class="lobby-shell">
        ${view === 'entry'
          ? html`<lobby-entry
              .mode=${getLobbyIdFromUrl() ? 'join' : 'create'}
              .error=${error}
              @entry-submit=${this.handleEntrySubmit}
            ></lobby-entry>`
          : null}

        ${view === 'lobby' && lobby
          ? html`
              <div class="panel stack">
                <div class="row" style="justify-content: space-between; align-items: center;">
                  <h2>Lobby ${lobby.lobbyId}</h2>
                  <button class="secondary" type="button" @click=${this.leaveLobby}>Leave</button>
                </div>
                <player-list .players=${lobby.players} .maxPlayers=${lobby.maxPlayers}></player-list>
              </div>

              <lobby-controls
                .lobbyId=${lobby.lobbyId}
                .gamemode=${lobby.gamemode}
                .difficulty=${lobby.difficulty}
                .isLeader=${lobby.players.some((p) => p.isLeader && p.id === this.clientState.selfId)}
                .shareUrl=${lobby.shareUrl}
                @change-settings=${this.handleSettingsChange}
                @start-game=${this.handleStartGame}
              ></lobby-controls>
            `
          : null}

        ${view === 'waiting' && waiting
          ? html`
              <waiting-view .leaderboard=${waiting.leaderboard} .timerRemainingMs=${waiting.timerRemainingMs}></waiting-view>
            `
          : null}

        ${error && view !== 'entry' ? html`<div class="inline-error">${error}</div>` : null}
      </div>
    `;
  }
}
