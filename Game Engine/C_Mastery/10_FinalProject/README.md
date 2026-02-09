# Problem Set 10: Final Project - Text Adventure Engine

Congratulations! You've reached the end of the foundation. Now, put it all together to build something "engine-like".

## The Goal
Build a **Text-Based Adventure Game Engine**. The engine should load "Rooms" from a file, and the player should be able to move between them.

## Requirements
1.  **Structs**: Use a `Room` struct that contains a description and pointers to adjacent rooms (North, South, East, West).
2.  **Dynamic Memory**: Allocate the rooms dynamically.
3.  **File I/O**: Load the room descriptions and connections from a `.txt` file.
4.  **Pointers**: Use pointers to keep track of the `currentRoom` the player is in.
5.  **Game Loop**: A `while` loop that takes user input (e.g., "go north") and updates the state.

## The Deep Understanding Test
If you can build this, you understand:
- How data is organized in memory.
- How to manage life-cycles of objects.
- How to separate "Engine Logic" (the loop and movement) from "Game Data" (the rooms in the file).

**You are now ready for C++!**
