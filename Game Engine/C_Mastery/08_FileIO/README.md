# Problem Set 8: File I/O (Input/Output)

Programs aren't very useful if they lose all their data when they close. File I/O allows you to save and load data from your hard drive.

## Concepts Covered
- **FILE Pointers**: Using the `FILE *` type.
- **fopen() / fclose()**: Opening and closing connections to files.
- **fprintf() / fscanf()**: Reading/Writing text files.
- **fread() / fwrite()**: Reading/Writing binary files (High performance!).

## The Exercises

### 1. The Logger
Write a program that appends the current time or a "Log Message" to a file named `log.txt` every time it runs.

### 2. High Score Saver
Create a program that asks for a player's name and score, then saves it to a file. On the next run, the program should read the file and display the previous high score.

### 3. Binary Data
Save a `struct Player` directly to a binary file using `fwrite`, then read it back into a different struct variable using `fread`.

## Why this matters for Game Engines
Saving game progress, loading 3D model files (.obj), and reading configuration settings all rely on File I/O.
