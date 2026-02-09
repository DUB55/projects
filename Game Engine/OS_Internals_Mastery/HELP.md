# Help: OS Internals Mastery

## Common Issues
- **"Segmentation Fault"**: Your program tried to access memory it doesn't own. This is the OS protecting other processes.
- **Kernel Panic**: A critical error in the kernel that causes the entire system to stop. Use a Virtual Machine (like VirtualBox or QEMU) to avoid crashing your host machine.
- **Privileged Instruction Error**: You tried to run a CPU command that only the kernel is allowed to run.
- **I don't see my changes**: Ensure you have recompiled your kernel or module and reloaded it.

## Resources
- [Operating Systems: Three Easy Pieces (OSTEP)](https://ostep.org/)
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/)
- [OSDev Wiki](https://wiki.osdev.org/)
