# Problem Set 3: Functions and Scope

Don't repeat yourself (DRY)! Functions allow us to package logic into reusable blocks.

## Concepts Covered
- **Function Declaration**: Telling the compiler a function exists.
- **Function Definition**: Writing the actual logic.
- **Parameters & Return Types**: Passing data in and getting data out.
- **Local vs. Global Scope**: Where variables "live".

## The Exercises

### 1. The Square Function
Write a function `int square(int x)` that returns the square of a number. Call it in `main` and print the result.

### 2. Temperature Converter
Create two functions:
- `float toCelsius(float fahrenheit)`
- `float toFahrenheit(float celsius)`
Use them to convert a user-inputted temperature.

### 3. Power Function
Write a function `int power(int base, int exp)` that calculates $base^{exp}$ without using the math library (use a loop!).

## Important Note
In C, you should declare your functions above `main` or provide a prototype at the top of the file so the compiler knows they exist before you call them!
