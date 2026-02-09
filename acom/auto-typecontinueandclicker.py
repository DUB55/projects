import time
import pyautogui

INTERVAL_SECONDS = 180   # how often to repeat
TEXT = "Continue"
START_DELAY = 3         # seconds to give you time to focus the right window

def main():
    # Optional: keep PyAutoGUI safe-guard on (move mouse to a corner to abort)
    pyautogui.FAILSAFE = True
    # Optional: short pause between PyAutoGUI actions
    pyautogui.PAUSE = 0.05

    print(f"[Auto-Continue] Will click (no mouse move), type '{TEXT}', and press Enter every {INTERVAL_SECONDS} seconds.")
    print("Make sure the correct window/input field is focused.")
    print("Press Ctrl+C here to stop. Move mouse to a screen corner to trigger PyAutoGUI fail-safe.\n")

    time.sleep(START_DELAY)

    try:
        while True:
            # Click once at the current cursor position (no movement)
            pyautogui.click()  # This uses the current position; no moveTo is called.

            # Type the text and press Enter
            pyautogui.typewrite(TEXT)
            pyautogui.press("enter")

            time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\n[Auto-Continue] Stopped by user.")
    except pyautogui.FailSafeException:
        print("\n[Auto-Continue] Stopped due to PyAutoGUI fail-safe (mouse moved to screen corner).")

if __name__ == "__main__":
    main()