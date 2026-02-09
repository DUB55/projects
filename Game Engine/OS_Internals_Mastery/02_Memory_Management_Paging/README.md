# Problem Set 02: Memory Management & Paging

### **Goal**
Learn how the OS provides a private, isolated memory space for every process.

### **Tasks**
1. **Virtual Memory**: Explain why processes use virtual addresses instead of physical ones.
2. **Page Tables**: How does the MMU (Memory Management Unit) translate addresses?
3. **Page Faults**: What happens when a program accesses a page that isn't in RAM?
4. **Thrashing**: Explain what happens when the OS spends more time swapping pages than running programs.

### **Practice Drill**
Research the `malloc()` implementation in C. How does it interact with the `brk` or `mmap` system calls to get memory from the OS?
