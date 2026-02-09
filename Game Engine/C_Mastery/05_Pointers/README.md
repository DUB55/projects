# Problem Set 5: The Power of Pointers

Pointers are the "scary" part of C, but they are what make C powerful (and why it's used for game engines). A pointer is just a variable that stores a **memory address**.

## Concepts Covered
- **Address-of Operator (`&`)**: Get the memory address of a variable.
- **Dereference Operator (`*`)**: Get the value stored at a memory address.
- **Pointer Declaration**: `int *p;`
- **Pass-by-Reference**: Changing a variable's value inside a function.

## The Exercises

### 1. Address Explorer
Create an integer `x = 10`. Print its value and its memory address using `&x` and the `%p` format specifier.

### 2. Pointer Basics
Create a pointer `ptr` that points to `x`. Use `ptr` to change the value of `x` to 20. Print `x` to verify.

### 3. The Swap Function
Write a function `void swap(int *a, int *b)` that swaps the values of two integers. 
*Note: If you don't use pointers, the swap won't work outside the function!*

## Why this matters for Game Engines
In a game engine, you deal with massive amounts of data (like a 3D model with millions of vertices). You don't want to copy that data every time you move it—you just want to pass a pointer to where it lives in memory.
