# Problem Set 6: Modern C++ (C++11 and Beyond)

Writing safer, faster, and more readable code.

## Concepts Covered
- **Auto Keyword**: Let the compiler deduce the type.
- **Smart Pointers**: `std::unique_ptr` and `std::shared_ptr` (Never use `new` or `delete` again!).
- **Lambda Expressions**: Anonymous functions on the fly.
- **Range-based For Loops**: Cleaner iteration.

## The Exercises

### 1. Smart Memory
Rewrite your `GameObject` hierarchy from Set 3, but use `std::unique_ptr` instead of raw pointers. Notice how you no longer need to manually `delete` anything.

### 2. Lambda Sorting
Create a `std::vector` of custom `Enemy` objects (with `name` and `health`). Use `std::sort` with a lambda expression to sort them by health.

### 3. Auto and For-Each
Use `auto` and a range-based for loop to iterate over a `std::unordered_map` and print its keys and values.

## Why this matters for Game Engines
Modern C++ eliminates 90% of memory leaks and crashes caused by raw pointers. Understanding smart pointers is non-negotiable for professional C++ development.
