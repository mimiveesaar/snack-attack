I want to build a lobby system for an online multiplayer game. The game is called Snack Attack. 

# Intial View
When a player opens the game, on the first lobby view, they should be able to choose a valid nickname and the color of their fish. If they are the lead player - the first player in that lobby, they should have a button 'Create Lobby'. If they are joining a lobby, the button should be titled 'Join Lobby'. The player is joining a lobby, if the URL contains a active lobby identifier, '/lobby/{id}'. The player should be able to create a lobby, if the url doesn't contain a valid lobby id. Nickname should be validated. Name length must be larger than 0 and less than 32 characters. Only allow letters and numbers. 
When joining the nickname should be check for duplicates in the lobby. If another player already has the same name, the new player should get a (number) after their name.


# Lobby View
Lobby view should display the current players in the lobby. Lead player should be distinguishable from other players. They should be able to select Gamemode or difficutly. Game has 2 gamesmodes : Singleplayer and Multiplayer. Multiplayer has a player limit of 4. When lead player changes the gamemode from multiplayer to singleplayer, all of the other players should be kicked. There are 3 difficulties. Easy, Medium and Hard. 
All of the players should have a Share URL button, that copies the lobby link to their clipboard. The leader player should have a start game button.
Lobby should have a player count indicator on the right upper side. When the previous lead player disconnects, the next player in the array should be promoted. Lobbies with 0 players should be deleted. 

# Active Game View
If a player joins a lobby that has a active game going, they should be shown a leaderboard, timer and a text indicating that they are waiting for a new game. When the game ends and there are enough free slots in the lobby, they should automatically join it.

## Visual Design Rules
- The game uses a fixed-size viewport
- The layout does not reflow or resize dynamically
- The game is desktop-first and mouse/keyboard-only
- Decorative visuals do not affect gameplay logic
- UI overlays (tutorial, waiting screens) appear as modal layers
- Animations are cosmetic and must not block input or state updates
