# Problem Set 3: Inheritance and Polymorphism

Creating hierarchies and making objects behave differently.

## Concepts Covered
- **Base and Derived Classes**: Inheriting properties and methods.
- **Virtual Functions**: Allowing derived classes to override base behavior.
- **Abstract Classes**: Classes that cannot be instantiated (using pure virtual functions).
- **The `override` Keyword**: Ensuring you're actually overriding a function.

## The Exercises

### 1. The GameObject Hierarchy
Create a base class `GameObject`. Create derived classes `Player`, `Enemy`, and `PowerUp`. Each should have a `virtual void Update()` function that prints something unique.

### 2. Virtual Destructors
Why is it critical to have a `virtual ~GameObject()` in your base class? Write a program that demonstrates a memory leak (or lack thereof) when using a base pointer to delete a derived object.

### 3. Pure Virtual Functions
Make `GameObject` an abstract class by making `Update()` a pure virtual function (`= 0`). Try to create an instance of `GameObject` and see what the compiler says.

## Why this matters for Game Engines
A Game Engine has thousands of objects. By using inheritance and polymorphism, the engine can call `Update()` on every object without knowing if it's a player, a bullet, or a tree.
