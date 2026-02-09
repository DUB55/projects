#!/usr/bin/env python3
"""
Setup Verification Script

Validates that all dependencies and configurations are properly installed.
This script checks:
  1. Python version
  2. All required packages
  3. Configuration system
  4. Database
  5. Keyring
  6. Profile system
  7. QML files

Run with: python verify_setup.py
"""

import sys
from pathlib import Path

def check_python_version():
    """Check Python version is 3.10+."""
    version = sys.version_info
    print(f"Python Version: {version.major}.{version.minor}.{version.micro}", end=" ")
    if version.major >= 3 and version.minor >= 10:
        print("✓")
        return True
    else:
        print("✗ (Need 3.10+)")
        return False

def check_pyside6():
    """Check PySide6 is installed."""
    try:
        import PySide6
        print(f"PySide6 Version: {PySide6.__version__} ✓")
        try:
            from PySide6.QtCore import QT_VERSION_STR
            print(f"Qt Version: {QT_VERSION_STR} ✓")
        except ImportError:
            # Qt version check is optional, doesn't affect functionality
            pass
        return True
    except ImportError as e:
        print(f"PySide6: ✗ ({e})")
        return False

def check_qtwebengine():
    """Check Qt WebEngine is available."""
    try:
        from PySide6.QtWebEngineWidgets import QWebEngineView
        print("QtWebEngine: ✓")
        return True
    except ImportError as e:
        print(f"QtWebEngine: ✗ ({e})")
        return False

def check_dependencies():
    """Check other dependencies."""
    deps = [
        ('keyring', 'Keyring'),
        ('platformdirs', 'Platformdirs'),
        ('colorlog', 'Colorlog'),
        ('dateutil', 'Python-dateutil'),
    ]
    
    all_ok = True
    for module_name, display_name in deps:
        try:
            __import__(module_name)
            print(f"{display_name}: ✓")
        except ImportError:
            print(f"{display_name}: ✗")
            all_ok = False
    
    return all_ok

def check_config_system():
    """Check configuration system."""
    try:
        from app.core.config.config_manager import init_config
        config = init_config()
        print(f"Config System: ✓ (Data dir: {config.get_data_dir()})")
        return True
    except Exception as e:
        print(f"Config System: ✗ ({e})")
        return False

def check_database():
    """Check database system."""
    try:
        from app.core.config.config_manager import init_config
        from app.core.persistence.db import init_database
        
        config = init_config()
        db = init_database(config.get_db_path())
        print(f"Database: ✓ (Path: {config.get_db_path()})")
        return True
    except Exception as e:
        print(f"Database: ✗ ({e})")
        return False

def check_keyring():
    """Check keyring system."""
    try:
        from app.core.security.keyring_adapter import init_keyring
        keyring = init_keyring()
        status = "available" if keyring.is_available() else "unavailable (OK - optional)"
        print(f"Keyring: ✓ ({status})")
        return True
    except Exception as e:
        print(f"Keyring: ✗ ({e})")
        return False

def check_profiles():
    """Check profile system."""
    try:
        from app.core.browser.browser_profile import init_profile_manager, get_profile_manager
        from app.core.config.config_manager import init_config
        
        config = init_config()
        profile_dir = config.get_data_dir() / "profiles"
        init_profile_manager(profile_dir)
        pm = get_profile_manager()
        profiles = pm.get_all_profiles()
        print(f"Profiles: ✓ ({len(profiles)} profile(s))")
        return True
    except Exception as e:
        print(f"Profiles: ✗ ({e})")
        return False

def check_qml_files():
    """Check QML files exist."""
    qml_files = [
        Path(__file__).parent / 'app' / 'ui' / 'App.qml',
        Path(__file__).parent / 'app' / 'ui' / 'components' / 'ProfileSwitcher.qml',
        Path(__file__).parent / 'app' / 'ui' / 'components' / 'FindBar.qml',
        Path(__file__).parent / 'app' / 'ui' / 'pages' / 'SpeedDial.qml',
    ]
    
    all_ok = True
    for qml_file in qml_files:
        if qml_file.exists():
            print(f"QML {qml_file.name}: ✓")
        else:
            print(f"QML {qml_file.name}: ✗ (missing: {qml_file})")
            all_ok = False
    
    return all_ok

def main():
    """Run all checks."""
    print("\n" + "="*60)
    print("Browser Setup Verification")
    print("="*60 + "\n")
    
    checks = [
        ("Python Version", check_python_version),
        ("PySide6", check_pyside6),
        ("QtWebEngine", check_qtwebengine),
        ("Dependencies", check_dependencies),
        ("Configuration System", check_config_system),
        ("Database", check_database),
        ("Keyring", check_keyring),
        ("Profile System", check_profiles),
        ("QML Files", check_qml_files),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n{name}:")
        try:
            result = check_func()
            results.append(result)
        except Exception as e:
            print(f"✗ Error: {e}")
            results.append(False)
    
    print("\n" + "="*60)
    passed = sum(results)
    total = len(results)
    
    if all(results):
        print(f"✓ All checks passed ({passed}/{total})")
        print("\n✓ Setup is COMPLETE and READY TO USE")
        print("\nTo run the browser, use:")
        print("  python browser.py")
        print("="*60 + "\n")
        return 0
    else:
        print(f"✗ Some checks failed ({passed}/{total})")
        print("="*60 + "\n")
        return 1

if __name__ == '__main__':
    sys.exit(main())
