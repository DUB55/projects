# Problem Set: Performance Optimization

## The Question: How do I make my application load and run faster?

Performance isn't about "magic tricks"; it's about understanding how data moves through the hardware.

### Exercise 1: Identifying the Bottleneck
1. Write a script that loads 1000 textures sequentially.
2. Measure the "frame freeze" while loading.
3. Use a Profiler (like gprof or Visual Studio Profiler) to see where the time is spent.

### Exercise 2: Asynchronous Loading
1. Implement a simple "Loading Screen" thread.
2. Move the texture loading to a background thread.
3. **The Discovery**: Notice how the UI remains responsive while the assets load in the background.

### Exercise 3: Data Locality (The Cache Challenge)
1. Create a loop that processes 1 million objects stored randomly in memory (using pointers).
2. Create a second loop that processes the same objects stored in a contiguous array.
3. Measure the speed difference.
4. **The Discovery**: You will see that contiguous data (Arrays) is often 10x faster than fragmented data (Linked Lists) because of the CPU Cache.

## Final Answer
You will learn that speed comes from:
- **Parallelism**: Don't make the user wait for one thing at a time.
- **Cache-Friendly Data**: Keep related data together in memory.
- **LOD (Level of Detail)**: Don't process what isn't visible.
