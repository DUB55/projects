# C++ Help & Guidance

C++ is a massive language. You don't need to know 100% of it to build a game engine, but you do need to understand how the pieces fit together.

## 1. I'm coming from C, and I'm confused!
- **Forget `malloc` and `free`**: In C++, we use `new` and `delete`, or even better, **Smart Pointers** (`std::unique_ptr`).
- **Think in Objects**: In C, you passed structs to functions. In C++, objects have their own functions. Instead of `UpdatePlayer(&p)`, you do `p.Update()`.
- **Strings are easier**: Use `std::string`. You don't need to worry about `\0` or buffer sizes anymore.

## 2. Common Errors
- **Linker Errors**: If you see `undefined reference to...`, it usually means you declared a function in a header file but forgot to define it in the `.cpp` file.
- **Diamond Problem**: If you use multiple inheritance, be careful with virtual base classes.
- **Const Correctness**: If a function doesn't modify an object, mark it `const`. This is a C++ "best practice" that prevents many bugs.

## 3. The "Modern" Way
- If you find yourself using raw pointers (`*`) and `delete`, ask yourself: "Should this be a `std::unique_ptr`?"
- If you are writing a long type name like `std::vector<std::map<int, std::string>>::iterator`, just use `auto`.

## 4. Where to learn more
- **cppreference.com**: The absolute bible of C++.
- **LearnCpp.com**: The best free tutorial site for C++.
- **The Cherno (YouTube)**: Excellent videos on C++ and Game Engine architecture.

## 5. Don't Over-Engineer
It is easy to get lost in complex Template Meta-programming or deep Inheritance hierarchies. Remember: **Your goal is to build a game engine.** If the code is too complex to understand, it will be too complex to debug. Keep it simple!
