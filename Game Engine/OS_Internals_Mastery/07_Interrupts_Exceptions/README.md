# Problem Set 07: Interrupts & Exceptions

### **Goal**
Learn how the OS handles asynchronous events from hardware and errors from software.

### **Tasks**
1. **Hardware Interrupts**: What happens when you press a key or a packet arrives?
2. **Software Interrupts (Traps)**: How are they used for system calls?
3. **Exceptions**: Explain the difference between a `Fault` (recoverable) and a `Abort` (unrecoverable).
4. **IDT (Interrupt Descriptor Table)**: How does the CPU know which code to run when an interrupt occurs?

### **Practice Drill**
Research the "Double Fault" exception. What happens if an exception occurs while the CPU is trying to handle a previous exception?
