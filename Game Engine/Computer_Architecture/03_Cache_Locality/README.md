# Problem Set 03: Cache Locality & Optimization

### **Goal**
Learn how to write code that takes advantage of the CPU's internal caches.

### **Tasks**
1. **Temporal vs Spatial Locality**: Explain the difference.
2. **Cache Lines**: How much data does the CPU fetch at once when a single byte is requested?
3. **Cache Misses**: Explain the performance penalty of a "Cold Miss" vs. a "Capacity Miss".
4. **Data-Oriented Design**: Why is an `Array of Structures` (AoS) often slower than a `Structure of Arrays` (SoA)?

### **Practice Drill**
Write a program that iterates through a 2D array row-by-row and then column-by-column. Measure the time difference.
