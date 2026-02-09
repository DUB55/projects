import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import urllib.request
import urllib.parse
import threading
import io
import win32clipboard
from io import BytesIO

class ImageGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("AI Image Generator")
        self.root.geometry("1200x800")

        # Prompt input
        self.prompt_label = tk.Label(root, text="Enter prompt:")
        self.prompt_label.pack(pady=10)

        self.prompt_entry = tk.Entry(root, width=50)
        self.prompt_entry.pack(pady=5)

        # Generate button
        self.generate_button = tk.Button(root, text="Generate Image", command=self.generate_image)
        self.generate_button.pack(pady=10)

        # Loading label
        self.loading_label = tk.Label(root, text="Generating image...", font=("Arial", 14))
        self.loading_label.pack(pady=10)
        self.loading_label.pack_forget()  # Hide initially

        # Image display label
        self.image_label = tk.Label(root)
        self.image_label.pack(pady=10)

        # Buttons frame
        self.buttons_frame = tk.Frame(root)
        self.buttons_frame.pack(pady=10)

        # Save button
        self.save_button = tk.Button(self.buttons_frame, text="Save Image", command=self.save_image, state=tk.DISABLED)
        self.save_button.pack(side=tk.LEFT, padx=5)

        # Copy button
        self.copy_button = tk.Button(self.buttons_frame, text="Copy Image", command=self.copy_image, state=tk.DISABLED)
        self.copy_button.pack(side=tk.LEFT, padx=5)

        self.image = None
        self.photo = None

    def generate_image(self):
        prompt = self.prompt_entry.get().strip()
        if not prompt:
            messagebox.showerror("Error", "Please enter a prompt.")
            return

        self.loading_label.pack()
        self.generate_button.config(state=tk.DISABLED)
        self.save_button.config(state=tk.DISABLED)
        self.copy_button.config(state=tk.DISABLED)
        self.image_label.config(image='')

        # Start thread to fetch image
        threading.Thread(target=self.fetch_image_thread, args=(prompt,)).start()

    def fetch_image_thread(self, prompt):
        self.image = self.fetch_image(prompt)
        self.root.after(0, self.display_image)

    def fetch_image(self, prompt):
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&model=flux&nologo=true"
        try:
            with urllib.request.urlopen(url) as response:
                image_data = response.read()
            image = Image.open(io.BytesIO(image_data))
            return image
        except Exception as e:
            print(f"Error fetching image: {e}")
            return None

    def display_image(self):
        self.loading_label.pack_forget()
        self.generate_button.config(state=tk.NORMAL)

        if self.image:
            self.photo = ImageTk.PhotoImage(self.image)
            self.image_label.config(image=self.photo)
            self.save_button.config(state=tk.NORMAL)
            self.copy_button.config(state=tk.NORMAL)
        else:
            messagebox.showerror("Error", "Failed to generate image. Please try again.")
            self.image_label.config(image='')

    def save_image(self):
        if not self.image:
            return
        file_path = filedialog.asksaveasfilename(defaultextension=".png",
                                                 filetypes=[("PNG files", "*.png"), ("JPEG files", "*.jpg"), ("All files", "*.*")])
        if file_path:
            try:
                self.image.save(file_path)
                messagebox.showinfo("Success", "Image saved successfully.")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save image: {e}")

    def copy_image(self):
        if not self.image:
            return
        try:
            self.copy_image_to_clipboard(self.image)
            messagebox.showinfo("Success", "Image copied to clipboard.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy image: {e}")

    def copy_image_to_clipboard(self, image):
        output = BytesIO()
        image.convert("RGB").save(output, "BMP")
        data = output.getvalue()[14:]  # Remove BMP header
        output.close()
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(win32clipboard.CF_DIB, data)
        win32clipboard.CloseClipboard()

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageGeneratorApp(root)
    root.mainloop()
