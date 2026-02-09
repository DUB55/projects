# Problem Set 4: Templates and Generic Programming

Writing code that works with any data type.

## Concepts Covered
- **Function Templates**: One function, many types.
- **Class Templates**: Classes that can hold or work with any type.
- **Template Specialization**: Providing a specific implementation for a certain type.

## The Exercises

### 1. The Generic Max
Write a template function `T GetMax(T a, T b)` that returns the larger of two values. Test it with `int`, `float`, and `std::string`.

### 2. The Generic Array
Create a class template `Array<T, int size>`. It should manage a fixed-size array of type `T`. Include a method to print all elements.

### 3. Specializing for Strings
Specialize your `GetMax` function for `const char*` so it compares the length of the strings instead of their memory addresses.

## Why this matters for Game Engines
Engines use templates everywhere—from math libraries (Vector2<float> vs Vector2<int>) to resource managers that handle `Texture`, `Sound`, and `Model` files using the same logic.
