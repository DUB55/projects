# Problem Set 08: Memory Management and GC

### **Goal**
Understand how C# manages memory and how to avoid leaks.

### **Tasks**
1. **The Managed Heap**: Explain how the Garbage Collector (GC) works in generations (0, 1, 2).
2. **IDisposable**: Implement the `IDisposable` pattern to clean up unmanaged resources (like file handles).
3. **Using Statement**: Show how `using` ensures `Dispose()` is called automatically.
4. **Weak References**: When would you use a `WeakReference<T>`?

### **Practice Drill**
Write a class that opens a file and ensures the file is closed even if an exception occurs.
