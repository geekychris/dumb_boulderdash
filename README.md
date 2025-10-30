# Boulder Dash Game

A retro-style Boulder Dash game built with HTML5, CSS3, and JavaScript.

## How to Play

### Objective
Collect all the required diamonds in each level while avoiding falling rocks, then reach the exit before time runs out!

### Controls
- **Arrow Keys**: Move your character (yellow circle with face)
- **Space**: Restart the current level
- **R**: Reset the entire game

### Game Elements
- 🟡 **Player**: Your character (yellow circle)
- 🟤 **Dirt**: Can be dug through (brown blocks)
- 🔵 **Diamonds**: Collect these to complete the level (cyan diamonds)
- ⚫ **Rocks**: Push them horizontally, but watch out - they fall!
- ⬜ **Walls**: Immovable gray blocks
- 🔲 **Steel Walls**: Indestructible boundary walls
- 🟥/🟩 **Exit**: Red when locked, green when you have enough diamonds

### Gameplay Mechanics
- **Digging**: Walk through dirt to dig it and earn 1 point per block
- **Diamond Collection**: Each diamond is worth 10 points
- **Rock Physics**: Rocks fall down and roll off other rocks/diamonds
- **Rock Pushing**: Push rocks horizontally (but not vertically)
- **Death**: Getting hit by a falling rock ends the level
- **Time Limit**: Each level has a countdown timer
- **Level Progression**: Complete levels by collecting required diamonds and reaching the exit

### Scoring
- Digging dirt: 1 point per block
- Collecting diamonds: 10 points each
- Time bonus: 5 points per second remaining when completing a level

### Strategy Tips
1. Plan your path carefully to avoid getting trapped
2. Use rocks strategically - you can push them to create barriers
3. Be aware of rock physics - they'll roll off surfaces
4. Collect diamonds efficiently but don't ignore the time limit
5. Sometimes you need to dig escape routes before collecting diamonds

## Getting Started

1. Open `index.html` in a web browser
2. Click "Start Game" to begin
3. Use arrow keys to move around and collect diamonds
4. Have fun!

## Features
- Classic Boulder Dash gameplay mechanics
- Retro pixel-art style graphics
- Sound effects for actions (dig, collect, push, etc.)
- Progressive difficulty with multiple levels
- Responsive design works on different screen sizes
- Game state management (menu, playing, game over, level complete)

## Technical Details
- Pure JavaScript (no external libraries)
- HTML5 Canvas for rendering
- CSS3 for UI styling
- Web Audio API for sound effects
- Object-oriented game architecture

Enjoy playing this nostalgic puzzle-action game!
