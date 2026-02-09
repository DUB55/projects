# Problem Set 05: Generics and Delegates

### **Goal**
Write reusable, type-safe code and understand function pointers in C#.

### **Tasks**
1. **Generic Methods**: Write a method `Swap<T>(ref T a, ref T b)` that works for any type.
2. **Constraints**: Use `where T : class` or `where T : new()` in a generic class.
3. **Delegates**: Define a `delegate void Notify(string message)` and point it to a method.
4. **Func and Action**: Explain the difference between `Func<int, bool>` and `Action<int>`.

### **Practice Drill**
Create a generic `Repository<T>` class with basic Add/Get methods.
