# Problem Set 5: The Standard Template Library (STL)

Leveraging C++'s powerful built-in tools.

## Concepts Covered
- **Containers**: `std::vector`, `std::list`, `std::map`, `std::unordered_map`.
- **Iterators**: Navigating through containers.
- **Algorithms**: `std::sort`, `std::find`, `std::for_each`.

## The Exercises

### 1. Vector Management
Create a `std::vector<int>`. Fill it with 10 random numbers. Sort it using `std::sort` and then find a specific number using `std::find`.

### 2. The High Score Table
Use a `std::map<std::string, int>` to store player names and their scores. Print the table in alphabetical order. Then, research how to print it in order of highest score.

### 3. Vector vs List
Write a small benchmark. Add 100,000 elements to a `std::vector` and a `std::list`. Which one is faster? Now, delete 10,000 elements from the *middle*. Which one is faster now? Why?

## Why this matters for Game Engines
Performance is everything. Choosing the right container (e.g., `std::vector` for cache locality vs `std::unordered_map` for fast lookups) is a core skill for engine developers.
