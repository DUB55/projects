# Multiplayer Synchronization

The hardest part of game development: Dealing with Latency.

## Concepts
1. **Client-Server Architecture**: The server is the authority.
2. **Client-Side Prediction**: Don't wait for the server to move your character.
3. **Interpolation**: Smoothing the movement of other players.
4. **Lag Compensation**: Rewinding the server state to see where a player was when they shot.

## Challenge
1. Implement a simple "Ball" movement on a server that updates two clients.
2. Add "Dead Reckoning" (Prediction) to the clients to handle jittery network conditions.
