import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { lobbyClient, type ClientState } from "@client/lobby/lobby-manager";
import { getLobbyIdFromUrl, resetLobbyUrl } from "@client/lobby/router";
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
    // const view = "lobby";

    // const lobby = {
    //   lobbyId: "DEV-LOBBY",
    //   maxPlayers: 4,
    //   gamemode: "multiplayer",
    //   difficulty: "normal",
    //   shareUrl: "http://localhost:5173/lobby/DEV",
    //   players: [
    //     {
    //       id: "1",
    //       nickname: "You",
    //       color: "green",
    //       isLeader: true,
    //     },
    //     {
    //       id: "2",
    //       nickname: "Fishy",
    //       color: "blue",
    //       isLeader: false,
    //     },
    //     {
    //       id: "3",
    //       nickname: "Fishy",
    //       color: "red",
    //       isLeader: false,
    //     },
    //     {
    //       id: "4",
    //       nickname: "Fishy",
    //       color: "yellow",
    //       isLeader: false,
    //     },
    //   ],
    // };

    // const waiting = null;
    // const error = null;

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
                <div class="lobby-header-wrapper">
                  <span class="lobby-header">Lobby ${lobby.lobbyId}</span>
                  <button
                    class="close-button"
                    type="button"
                    @click=${this.leaveLobby}
                  >
                    x
                  </button>
                </div>
                <div class="player-list">
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
                  .shareUrl=${window.location.href}
                  @change-settings=${this.handleSettingsChange}
                  @start-game=${this.handleStartGame}
                ></lobby-controls>
              </div>
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
