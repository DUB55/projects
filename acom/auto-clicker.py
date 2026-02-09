import time
import pyautogui

print("Auto‑clicker started. Press Ctrl+C to stop.")

try:
    while True:
        pyautogui.click()
        print("Clicked!")
        time.sleep(10)  # wait 10 seconds
except KeyboardInterrupt:
    print("Auto‑clicker stopped.")