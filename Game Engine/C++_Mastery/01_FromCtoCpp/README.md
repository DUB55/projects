# Problem Set 1: From C to C++

C++ is a superset of C, meaning almost all C code is valid C++ code. However, C++ introduces new ways of doing things that are safer and more expressive.

## Concepts Covered
- **I/O Streams**: Using `std::cout` and `std::cin` instead of `printf` and `scanf`.
- **Namespaces**: Using `std::` to avoid naming conflicts.
- **Strings**: Using `std::string` instead of character arrays (`char[]`).
- **References**: A safer alternative to pointers for passing data.

## The Exercises

### 1. Hello C++
Create a program that asks for the user's name using `std::cin` and greets them using `std::cout`. Use `std::string`.

### 2. Reference Swap
In C, you swapped numbers using pointers. In C++, you can use **references**. Write a function `void swap(int &a, int &b)` and test it.

### 3. Namespace Practice
Create two namespaces: `Engine` and `Physics`. Put a variable `float version` in both with different values. Print both values in `main`.

## Why this matters for Game Engines
`std::string` and references make your code much more readable and less prone to memory errors (like buffer overflows) that are common in C.
