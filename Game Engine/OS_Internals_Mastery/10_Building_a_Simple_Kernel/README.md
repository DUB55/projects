# Problem Set 10: Building a Simple Kernel

### **Goal**
Apply everything you've learned by building a minimal "Hello World" operating system.

### **Tasks**
1. **The Bootloader**: Learn how GRUB or a custom bootloader loads your kernel into memory.
2. **VGA Text Mode**: Write a function to print characters to the screen by writing directly to memory address `0xB8000`.
3. **Cross-Compilation**: Use a cross-compiler (like `i686-elf-gcc`) to build code for your custom OS.
4. **QEMU**: Run your kernel in the QEMU emulator.

### **Practice Drill**
Follow a tutorial (like "Philipp Oppermann's Writing an OS in Rust" or "The Little OS Book") to get a kernel that prints "Hello, OS World!" to the screen.
