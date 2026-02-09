# Problem Set 07: Smart Pointers

### **Goal**
Master modern C++ memory management using RAII (Resource Acquisition Is Initialization).

### **Tasks**
1. **unique_ptr**: Use `std::unique_ptr` for exclusive ownership of a resource.
2. **shared_ptr**: Use `std::shared_ptr` for shared ownership and understand reference counting.
3. **weak_ptr**: Use `std::weak_ptr` to break circular dependencies between shared pointers.
4. **make_unique / make_shared**: Learn why these are preferred over using the `new` keyword directly.

### **Practice Drill**
Create a `Node` class for a doubly-linked list. Use `shared_ptr` for the `next` pointer and `weak_ptr` for the `prev` pointer to avoid memory leaks.
