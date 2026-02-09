# Problem Set 6: Structs and Custom Types

In C, a `struct` allows you to group different variables under one name. This is the foundation of "Objects" in C++.

## Concepts Covered
- **Defining Structs**: Creating your own data types.
- **Accessing Members**: Using the dot `.` operator.
- **Typedef**: Creating aliases for types to make code cleaner.
- **Structs and Pointers**: Using the arrow `->` operator.

## The Exercises

### 1. The Player Struct
Create a `struct Player` that has a `name` (string), `health` (int), and `score` (int). Initialize a player in `main` and print their stats.

### 2. Geometric Shapes
Create a `struct Point` with `x` and `y` coordinates. Write a function `float distance(struct Point p1, struct Point p2)` that calculates the distance between two points.

### 3. Struct Pointers
Create a function `void levelUp(struct Player *p)` that increases a player's score. Use the `->` operator to modify the player's data through the pointer.

## Why this matters for Game Engines
Almost everything in a game engine is a struct: a `Vector3`, a `Transform`, a `Material`, or a `Mesh`. Mastering how to organize data into structs is how you build complex systems.
