# Problem Set 5: Python OOP

Everything in Python is an object. Classes allow you to define your own.

## Concepts Covered
- **Classes & Objects**: `class MyClass:`.
- **The `__init__` Method**: The constructor.
- **The `self` Parameter**: Referring to the current instance.
- **Inheritance**: `class Dog(Animal):`.

## The Exercises

### 1. The Car Class
Create a `Car` class with `make`, `model`, and `year`. Add a method `start_engine()` that prints "Vroom!".

### 2. Bank Account
Create a `BankAccount` class with `balance`. Add `deposit(amount)` and `withdraw(amount)` methods. Ensure the balance never goes below zero.

### 3. Animal Kingdom
Create a base class `Animal` with a method `speak()`. Derive `Dog` and `Cat` classes and override `speak()` to print "Woof" and "Meow".

## Comparison to C++
In Python, all methods are "virtual" by default. You don't need the `virtual` keyword. Also, `self` must be explicitly included as the first parameter of every method.
