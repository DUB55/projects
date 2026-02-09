# Problem Set 4: Arrays and Strings

Arrays allow us to store multiple values of the same type in a single variable. In C, a string is just an array of characters ending with a special `\0` (null) character.

## Concepts Covered
- **Array Declaration**: `int numbers[5];`
- **Indexing**: Accessing elements starting from 0.
- **Iterating over Arrays**: Using loops to process data.
- **Strings**: Using `char name[] = "C";` and `string.h` functions.

## The Exercises

### 1. Array Sum
Create an array of 5 integers. Use a loop to calculate and print the sum of all elements.

### 2. Find the Max
Write a program that finds the largest number in an array of 10 integers.

### 3. String Reversal
Write a program that takes a string as input and prints it in reverse. (Hint: Find the length of the string first using `strlen`).

## Warning
C does **not** check if you go "out of bounds" on an array. If you have an array of size 5 and try to access index 10, your program might crash or behave very strangely!
