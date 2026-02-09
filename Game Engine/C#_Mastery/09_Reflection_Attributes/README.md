# Problem Set 09: Reflection and Attributes

### **Goal**
Inspect and interact with code at runtime.

### **Tasks**
1. **Type Inspection**: Use `typeof(MyClass)` to list all properties of a class.
2. **Custom Attributes**: Create a `[HelpText("...")]` attribute and apply it to a method.
3. **Dynamic Invocation**: Call a method by its name string using `MethodInfo.Invoke`.
4. **Assembly Loading**: Load a DLL at runtime and create an instance of a class within it.

### **Practice Drill**
Build a simple "Plugin System" where your program loads any `.dll` in a folder and executes a specific method.
