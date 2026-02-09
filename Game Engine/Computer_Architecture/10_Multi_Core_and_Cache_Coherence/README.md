# Problem Set 10: Multi-Core and Cache Coherence

### **Goal**
Understand the complexity of modern multi-core processors.

### **Tasks**
1. **Parallelism**: Differentiate between ILP (Instruction Level), TLP (Thread Level), and DLP (Data Level).
2. **The Cache Coherence Problem**: What happens when Core A updates a value that Core B has cached?
3. **MESI Protocol**: Explain the Modified, Exclusive, Shared, and Invalid states.
4. **Amdahl's Law**: Calculate the maximum speedup of a program if only 50% of it can be parallelized.

### **Practice Drill**
Research the "False Sharing" problem in C++ and how `alignas(64)` can fix it.
