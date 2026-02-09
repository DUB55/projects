# Problem Set 07: Branch Prediction and Speculation

### **Goal**
Understand how CPUs guess the future to keep the pipeline full.

### **Tasks**
1. **The Cost of a Miss**: Calculate the performance penalty of a pipeline flush due to a wrong branch prediction.
2. **Static vs Dynamic Prediction**: Compare simple "always taken" strategies with modern history-based predictors.
3. **Speculative Execution**: How does the CPU execute instructions before it knows if they are needed?
4. **Spectre/Meltdown**: Research how speculative execution was exploited for security breaches.

### **Practice Drill**
Write a small C++ program that processes a sorted array vs an unsorted array and measure the time difference (Branch Prediction effect).
