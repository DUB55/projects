# C# Help & Guidance

C# is very similar to Java and C++, but it has its own unique features.

## 1. Properties vs Fields
- **Field**: `private int health;` (Just a variable).
- **Property**: `public int Health { get; set; }` (A variable with built-in logic for getting/setting). Always prefer Properties for public data!

## 2. The `using` Keyword
- At the top of the file: `using System;` (Imports a namespace).
- Inside code: `using (var file = ...) { }` (Ensures a resource is cleaned up automatically).

## 3. LINQ (Language Integrated Query)
- C#'s "superpower". It lets you filter and search lists using a syntax similar to SQL. 
- Example: `myList.Where(x => x > 10).ToList();`

## 4. Null Safety
- C# has become very strict about Nulls. Use `string?` if a variable is allowed to be null.

## 5. Where to learn more
- **Microsoft Learn**: The official documentation is excellent.
- **Unity Learn**: Best for applying C# to game development.
- **C# Players Guide**: A great book for beginners.

## 6. Comparison to C++
No manual memory management! C# has a **Garbage Collector**. You use `new` to create objects, but you never call `delete`.
