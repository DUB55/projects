# Python Help & Guidance

Python is friendly, but its "magic" can sometimes be confusing.

## 1. Indentation Errors
If you see `IndentationError`, your spaces or tabs are mixed up. 
- **Rule**: Always use 4 spaces per indent level.
- **Visual**: If code is "inside" an `if` or `def`, it must be shifted to the right.

## 2. Type Errors
If you see `TypeError: can only concatenate str (not "int") to str`, you are trying to add a number to text.
- **Fix**: Convert the number to text first: `print("Age: " + str(age))`.

## 3. Module Not Found
If you see `ModuleNotFoundError`, you tried to `import` something that isn't installed.
- **Fix**: Use `pip install [module_name]` in your terminal.

## 4. Logical Differences from C
- **No `++`**: Use `i += 1` instead of `i++`.
- **Booleans**: Use `True` and `False` (Capitalized!).
- **None**: Python's version of `NULL`.

## 5. Where to learn more
- **Official Docs**: `docs.python.org`.
- **Real Python**: Excellent deep-dive articles.
- **Automate the Boring Stuff with Python**: The best book for beginners.

## 6. The "Pythonic" Way
Python has a philosophy called "The Zen of Python" (type `import this` in a script to see it). It emphasizes simplicity and readability. If your code looks like C code translated into Python, there is likely a shorter, better way to write it!
