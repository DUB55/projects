import ctypes
import time
import pyautogui

# Windows Constants
WM_SYSCOMMAND = 0x0112
SC_MONITORPOWER = 0xF170
MONITOR_OFF = 2
MONITOR_ON = -1

def turn_off_monitor():
    """Sends a system command to turn the monitor off."""
    ctypes.windll.user32.SendMessageW(0xFFFF, WM_SYSCOMMAND, SC_MONITORPOWER, MONITOR_OFF)

def turn_on_monitor():
    """Sends a system command to wake the monitor up."""
    ctypes.windll.user32.SendMessageW(0xFFFF, WM_SYSCOMMAND, SC_MONITORPOWER, MONITOR_ON)

def monitor_controller():
    print("Script started. Idle timer: 10 seconds.")
    last_pos = pyautogui.position()
    last_move_time = time.time()
    monitor_is_off = False

    try:
        while True:
            current_pos = pyautogui.position()

            # Check if mouse has moved
            if current_pos != last_pos:
                last_pos = current_pos
                last_move_time = time.time()
                
                if monitor_is_off:
                    turn_on_monitor()
                    monitor_is_off = False
                    print("Mouse moved - Monitor ON")
            
            # Check if idle for longer than 10 seconds
            elif not monitor_is_off and (time.time() - last_move_time > 10):
                turn_off_monitor()
                monitor_is_off = True
                print("Idle detected - Monitor OFF")

            time.sleep(0.5)  # Check every half second to save CPU
    except KeyboardInterrupt:
        turn_on_monitor()
        print("Script stopped.")

if __name__ == "__main__":
    monitor_controller()