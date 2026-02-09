import sys
from PySide6.QtCore import QUrl
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineQuick import QtWebEngineQuick

app = QApplication(sys.argv)
QtWebEngineQuick.initialize()
engine = QQmlApplicationEngine()

def handle_errors(errors):
    for error in errors:
        print(f"QML Error: {error.toString()}")

engine.warnings.connect(lambda w: print(f"QML Warning: {w}"))
engine.load(QUrl.fromLocalFile(r"c:\Users\Mohammed\OneDrive - St Michaël College\2025-2026\Wiskunde\Uitwerkingen\Projects\Projects\browser\app\ui\App.qml"))

if not engine.rootObjects():
    print("Failed to load root objects.")
    sys.exit(-1)

print("Load successful!")
sys.exit(0)
