# Problem Set 06: System Calls

### **Goal**
Understand the standard interface that applications use to request services from the OS.

### **Tasks**
1. **The Trap Instruction**: What happens to the CPU when a system call is made?
2. **Standard Library vs. Syscalls**: How does `printf()` eventually call `write()`?
3. **Common Syscalls**: Explain `open()`, `read()`, `write()`, `close()`, `fork()`, and `exec()`.
4. **Strace**: Learn to use the `strace` tool to see every system call a program makes.

### **Practice Drill**
Run `strace ls` in a Linux terminal and count how many times the `openat` system call is used.
