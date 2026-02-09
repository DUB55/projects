# Java Help & Guidance

Java is strict, which is great for learning "proper" object-oriented programming.

## 1. Everything is in a Class
In Java, you cannot have a function just floating around. Every piece of code must be inside a `class`.

## 2. The Main Method
- `public static void main(String[] args)`
- This is the entry point. It's long, but you'll get used to it!

## 3. String Comparison
- **Wrong**: `if (name == "Alice")` (This compares memory addresses!)
- **Right**: `if (name.equals("Alice"))` (This compares the actual text).

## 4. Primitive vs Wrapper Types
- `int`, `double`, `boolean` are simple types.
- `Integer`, `Double`, `Boolean` are objects. You need these for Collections (like `ArrayList<Integer>`).

## 5. Where to learn more
- **Baeldung**: Excellent tutorials on almost every Java topic.
- **Java Revisited**: Great for deep-dives into concepts.
- **University of Helsinki MOOC**: The best free Java course in the world.

## 6. Comparison to C#
They are cousins! If you learn one, you can learn the other in a few days. Java is slightly more "verbose" (you write more code to do the same thing), but it is very predictable.
