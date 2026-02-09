# Problem Set: Modular vs Monolithic

## The Question: Should I split my code into files or put it in one big file?

In this problem set, you will experience why professional developers **always** split their code.

### Exercise 1: The "Spaghetti File" Nightmare
1. Create a single file called `GodFile.c`.
2. Inside this file, implement:
   - A window renderer.
   - A physics solver.
   - An input handler.
   - An entity management system.
3. Now, try to change the physics gravity constant. Notice how you have to scroll through 1000 lines of unrelated code just to find one variable.

### Exercise 2: The Compilation Wall
1. Measure the time it takes to compile your `GodFile.c`.
2. Even if you change only one comment, the compiler must re-process the entire file.

### Exercise 3: The Modular Solution
1. Split `GodFile.c` into:
   - `Renderer.h/c`
   - `Physics.h/c`
   - `Input.h/c`
2. Implement a `main.c` that includes these modules.
3. **The Discovery**: Notice how much easier it is to navigate. Change one file and see how only that file needs to be recompiled (using a build system like CMake).

## Final Answer
By the end of these exercises, you will understand that **splitting files** is the only way to scale a project. It improves:
- **Readability**: You know exactly where to find code.
- **Maintainability**: Changing physics doesn't risk breaking the renderer.
- **Compilation Speed**: Only changed modules are recompiled.
