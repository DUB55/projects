# Problem Set 7: Dynamic Memory Management

This is where you take full control of the computer's RAM. Instead of the compiler deciding how much memory you need, **you** decide while the program is running.

## Concepts Covered
- **The Heap vs. The Stack**: Understanding where data lives.
- **malloc()**: Requesting a block of memory.
- **free()**: Returning memory to the system (Crucial to avoid memory leaks!).
- **calloc() / realloc()**: Initializing and resizing memory blocks.

## The Exercises

### 1. Dynamic Array
Ask the user how many integers they want to store. Use `malloc` to create an array of that exact size. Fill it with numbers and print them.

### 2. Memory Leak Hunt
Write a program that allocates memory for a large array in a loop but **forget** to use `free()`. Watch your Task Manager (briefly!) to see memory usage rise, then fix it by adding `free()`.

### 3. Resizing a Buffer
Start with an array of size 2. Keep adding numbers, and every time it gets full, use `realloc` to double its size.

## Why this matters for Game Engines
Game engines don't know how many enemies or bullets will be on screen at once. They use dynamic memory to create and destroy these objects on the fly.
