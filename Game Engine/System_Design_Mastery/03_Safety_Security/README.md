# Problem Set: Safety and Security

## The Question: Is my system safe?

In low-level programming, "Safety" means your program doesn't crash (Memory Safety) and can't be exploited (Security).

### Exercise 1: The Buffer Overflow
1. Write a C program that takes a string input and stores it in a fixed-size buffer.
2. Input a string twice as long as the buffer.
3. Observe the crash or the corrupted memory.
4. **The Goal**: Learn to use safe functions (like `strncpy` instead of `strcpy`) and bounds checking.

### Exercise 2: The Memory Leak Hunt
1. Create a loop that allocates memory but never frees it.
2. Monitor your RAM usage in Task Manager.
3. Fix it using `free()` or C++ Smart Pointers (`std::unique_ptr`).
4. **The Goal**: Master the lifecycle of memory.

### Exercise 3: The Race Condition
1. Create two threads that both try to increment the same global integer 1,000,000 times.
2. Check the final result. (It will likely be less than 2,000,000).
3. **The Goal**: Use a `Mutex` or `Atomic` to fix the inconsistency.

## Final Answer
By completing these, you will know that a system is "safe" only when:
- **Memory is managed**: Every allocation has a corresponding deallocation.
- **Bounds are checked**: No input can write where it shouldn't.
- **Threads are synchronized**: Data access is controlled.
