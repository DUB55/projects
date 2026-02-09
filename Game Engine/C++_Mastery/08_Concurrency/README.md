# Problem Set 08: Concurrency

### **Goal**
Write multi-threaded C++ applications using the standard library.

### **Tasks**
1. **Threads**: Use `std::thread` to run a function in the background.
2. **Mutexes**: Use `std::mutex` and `std::lock_guard` to protect shared data from race conditions.
3. **Async & Futures**: Use `std::async` to run a task and `std::future` to retrieve its result later.
4. **Condition Variables**: Use `std::condition_variable` to synchronize threads based on a signal.

### **Practice Drill**
Implement a "Producer-Consumer" pattern where one thread generates numbers and another thread calculates their square, using a thread-safe queue.
