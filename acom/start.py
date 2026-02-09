import threading
import time
import sys
from run_server import main as run_server_main
from cli import menu, print_url


def start_server_thread():
    t = threading.Thread(target=run_server_main, daemon=True)
    t.start()
    time.sleep(1.0)
    return t


def main():
    print("Starting local share server...")
    start_server_thread()
    print_url()
    try:
        menu()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)


if __name__ == "__main__":
    main()

