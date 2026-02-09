# Problem Set 10: Performance Optimization

### **Goal**
Learn how to write high-performance C++ code by understanding how the hardware executes it.

### **Tasks**
1. **Profiling**: Use a tool like `gprof`, `Valgrind (Callgrind)`, or `Visual Studio Profiler` to find bottlenecks.
2. **Cache Locality**: Structure your data (e.g., Data-Oriented Design) to minimize cache misses.
3. **Move Semantics**: Ensure you are using `std::move` and `std::forward` to avoid unnecessary copies.
4. **SIMD**: Research Single Instruction Multiple Data (SIMD) and how to use compiler intrinsics for parallel math.

### **Practice Drill**
Write a function that multiplies two large matrices. Compare the speed of a naive implementation vs. one optimized for cache locality (row-major vs column-major access).
