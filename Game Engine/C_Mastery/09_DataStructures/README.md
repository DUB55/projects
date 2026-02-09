# Problem Set 9: Data Structures (Linked Lists)

Now we combine everything: Structs, Pointers, and Dynamic Memory. A Linked List is a way to store data where each piece of data "points" to the next one.

## Concepts Covered
- **Nodes**: Structs that contain data and a pointer to another struct of the same type.
- **Dynamic Growth**: Adding items to a list without knowing the size in advance.
- **Traversal**: Walking through a list from start to finish.

## The Exercises

### 1. Build a Node
Create a `struct Node` that contains an `int data` and a `struct Node *next`.

### 2. The Chain
Manually create three nodes in `main`, link them together (Node 1 -> Node 2 -> Node 3), and write a loop that prints the data in all of them.

### 3. Add to Front
Write a function `void insertAtFront(struct Node **head, int newData)` that dynamically creates a new node and puts it at the beginning of the list.

## Why this matters for Game Engines
Linked lists (and more advanced structures like Trees and Graphs) are used for "Scene Graphs"—organizing which objects in a 3D world are children of other objects (like a sword being a child of a character's hand).
