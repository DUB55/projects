# Problem Set 2: Object-Oriented Programming (OOP) Basics

This is the heart of C++. Instead of just functions and data, we group them into **Classes**.

## Concepts Covered
- **Classes vs. Structs**: In C++, they are almost the same, but classes have private members by default.
- **Encapsulation**: Using `public`, `private`, and `protected`.
- **Constructors & Destructors**: Special functions that run when an object is created or destroyed.
- **Member Functions**: Functions that belong to a class.

## The Exercises

### 1. The Entity Class
Create a class `Entity`. It should have `private` variables for `x` and `y` coordinates (floats) and a `public` function `void Move(float dx, float dy)` to change them.

### 2. Constructors
Add a constructor to `Entity` that takes `x` and `y` as arguments. Add a destructor that prints "Entity Destroyed".

### 3. Getters and Setters
Add functions to get the current position of the `Entity`. Why is it better to have private variables with public getters than just making the variables public?

## Why this matters for Game Engines
Everything in a game is an object. A `Camera`, a `Light`, a `Mesh`, and a `Shader` are all classes that manage their own state and behavior.
