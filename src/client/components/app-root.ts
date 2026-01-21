import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { lobbyClient, type ClientState } from "@client/state/lobby-state";
import { getLobbyIdFromUrl, resetLobbyUrl } from "@client/state/router";
import type { LobbyState } from "@shared/types";
import { soundManager } from "@client/utils/sound-manager";
import "./lobby-entry";
import "./player-list";
import "./lobby-controls";
import "./share-url";
import "./waiting-view";
import "./sound-toggle";

@customElement("app-root")
export class AppRoot extends LitElement {
  @state() private clientState: ClientState = lobbyClient.getState();

  static styles = css`
    .lobby-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center; /* vertical centering */
      text-align: center;
      padding: 2rem;
      box-sizing: border-box;
    }
  `;

  createRenderRoot() {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    soundManager.initialize();
    lobbyClient.subscribe((state) => {
      this.clientState = state;
    });
  }

  private handleEntrySubmit = (
    event: CustomEvent<{ nickname: string; color: string }>,
  ) => {
    soundManager.playCrunchSound();
    const lobbyId = getLobbyIdFromUrl();
    if (lobbyId) {
      lobbyClient.joinLobby(event.detail.nickname, event.detail.color);
    } else {
      lobbyClient.createLobby(event.detail.nickname, event.detail.color);
    }
  };

  private handleSettingsChange = (
    event: CustomEvent<{
      gamemode: LobbyState["gamemode"];
      difficulty: LobbyState["difficulty"];
      lobbyId: string;
    }>,
  ) => {
    lobbyClient.updateSettings(event.detail);
  };

  private handleStartGame = (event: CustomEvent<{ lobbyId: string }>) => {
    if (!soundManager.isSoundEnabled()) {
      soundManager.toggleSound();
    }
    soundManager.playCrunchSound();
    lobbyClient.startGame(event.detail.lobbyId);
  };

  private leaveLobby = () => {
    lobbyClient.leaveLobby();
    resetLobbyUrl();
  };

  render() {
    const { view, lobby, waiting, error } = this.clientState;
    return html`
      <div class="lobby-shell">
        <div style="position: absolute; top: 1rem; right: 1rem; z-index: 100;">
          <sound-toggle></sound-toggle>
        </div>
        ${view === "entry"
          ? html`<lobby-entry
              .mode=${getLobbyIdFromUrl() ? "join" : "create"}
              .error=${error}
              @entry-submit=${this.handleEntrySubmit}
            ></lobby-entry>`
          : null}
        ${view === "lobby" && lobby
          ? html`
              <div class="panel stack">
                <div
                  class="row"
                  style="justify-content: space-between; align-items: center;"
                >
                  <h2>Lobby ${lobby.lobbyId}</h2>
                  <button
                    class="secondary"
                    type="button"
                    @click=${this.leaveLobby}
                  >
                    Leave
                  </button>
                </div>
                <player-list
                  .players=${lobby.players}
                  .maxPlayers=${lobby.maxPlayers}
                ></player-list>
              </div>

              <lobby-controls
                .lobbyId=${lobby.lobbyId}
                .gamemode=${lobby.gamemode}
                .difficulty=${lobby.difficulty}
                .isLeader=${lobby.players.some(
                  (p) => p.isLeader && p.id === this.clientState.selfId,
                )}
                .shareUrl=${lobby.shareUrl}
                @change-settings=${this.handleSettingsChange}
                @start-game=${this.handleStartGame}
              ></lobby-controls>
            `
          : null}
        ${view === "waiting" && waiting
          ? html`
              <waiting-view
                .snapshot=${waiting.snapshot}
                .fullMessage=${waiting.fullMessage}
              ></waiting-view>
            `
          : null}
        ${error && view !== "entry"
          ? html`<div class="inline-error">${error}</div>`
          : null}
      </div>
    `;
  }
}
