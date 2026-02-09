# I'm Stuck! What do I do?

Learning C is hard because it doesn't hold your hand. If you are confused, frustrated, or don't understand a concept, follow this guide.

## 1. If you don't understand a concept (e.g., "What is a pointer?")
- **Visualize it**: C is about memory. Draw boxes on a piece of paper. Each box is a memory address. A pointer is just an arrow pointing to a box.
- **Explain it to a duck**: (Rubber Duck Debugging) Try to explain the concept out loud to an inanimate object. You'll often find the gap in your logic while speaking.
- **Search terms**: Use "C programming [concept] simplified" or "C memory layout [concept]".

## 2. If your code won't compile
- **Read the FIRST error**: Compilers often produce 100 errors, but usually, the first one caused all the others. Fix the top one first.
- **Check for semicolons**: 90% of beginner C errors are missing `;` or `}`.
- **Types**: Ensure you aren't trying to put a string into an integer.

## 3. If your code runs but crashes (Segmentation Fault)
- **Segmentation Fault** usually means you tried to access memory that doesn't belong to you.
- **Check your pointers**: Are you dereferencing a NULL pointer?
- **Check your arrays**: Are you trying to access `arr[10]` when the size is only 5?

## 4. Where to get help
- **Documentation**: Use `cppreference.com` (it has a C section too!).
- **Community**: StackOverflow is great, but search for your question first—it has likely been asked 10 years ago.
- **AI Assistant**: You can ask me! But try to explain **what** you tried first. Instead of "it doesn't work", try "I expected X to happen because of Y, but Z happened instead."

## 5. The Golden Rule of Deep Understanding
**Never copy-paste code you don't understand.** If you find a solution online, type it out manually and comment every single line explaining what it does. If you can't comment a line, you don't understand it yet.
