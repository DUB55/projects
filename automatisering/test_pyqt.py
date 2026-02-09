# test_pyqt.py
import os, sys
qtbin = os.path.join(sys.prefix, "Lib", "site-packages", "PyQt6", "Qt6", "bin")
print("qtbin:", qtbin, "exists:", os.path.isdir(qtbin))
os.environ["PATH"] = qtbin + os.pathsep + os.environ.get("PATH", "")
from PyQt6 import QtCore
print("QT:", QtCore.QT_VERSION_STR, "PYQT:", QtCore.PYQT_VERSION_STR)