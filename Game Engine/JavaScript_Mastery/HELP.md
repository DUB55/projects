# JavaScript Help & Guidance

JavaScript is known for its "quirks". Here is how to navigate them.

## 1. `var` vs `let` vs `const`
- **Avoid `var`**: It has confusing scope rules.
- **Use `const` by default**: If the value doesn't need to change.
- **Use `let`**: If you need to reassign the variable.

## 2. The Console is your Friend
- Use `console.log()` to debug everything.
- Open your browser's **Developer Tools** (F12 or Right Click -> Inspect) and go to the "Console" tab to see your output.

## 3. "Undefined" is not "Null"
- `undefined`: The variable exists but hasn't been given a value yet.
- `null`: You have explicitly set the variable to "nothing".

## 4. Arrow Functions
- `const add = (a, b) => a + b;`
- Arrow functions are a shorter way to write functions and they handle the `this` keyword differently (more predictably).

## 5. Where to learn more
- **MDN Web Docs**: The gold standard for JS documentation.
- **JavaScript.info**: A very deep and well-explained tutorial.
- **Eloquent JavaScript**: A classic book (free online) that covers JS in depth.

## 6. Comparison to C/C++
JS is garbage-collected. You don't need to worry about `malloc` or `free`. However, because it's single-threaded, you must learn about the **Event Loop** to understand how it handles things like loading data without freezing the screen.
