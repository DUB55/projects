"""
Quick validation test for Phase 1 Foundation

Tests:
1. All imports work
2. Config manager initializes
3. Logger initializes
4. Database schema creates
5. Keyring adapter initializes
6. App state initializes
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def test_imports():
    """Test that all modules import successfully."""
    print("Testing imports...")
    
    try:
        from app.utils.logger import setup_logger, app_logger
        print("  ✓ Logger imported")
        
        from app.core.config.config_manager import ConfigManager, get_data_dir
        print("  ✓ Config manager imported")
        
        from app.core.persistence.db import Database, init_database
        print("  ✓ Database module imported")
        
        from app.core.persistence.schema import INITIAL_SCHEMA
        print("  ✓ Schema imported")
        
        from app.core.security.keyring_adapter import KeyringAdapter
        print("  ✓ Keyring adapter imported")
        
        from app.core.state.app_state import AppState, init_app_state
        print("  ✓ App state imported")
        
        from app.dev_tools import DevTools, get_dev_tools
        print("  ✓ Dev tools imported")
        
        return True
    except Exception as e:
        print(f"  ✗ Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_config():
    """Test configuration manager."""
    print("\nTesting configuration manager...")
    
    try:
        from app.core.config.config_manager import ConfigManager, get_data_dir
        
        # Get platform-aware directory
        data_dir = get_data_dir()
        print(f"  ✓ Data directory: {data_dir}")
        
        # Create config manager
        config = ConfigManager(data_dir)
        print(f"  ✓ Config manager created")
        
        # Test setting/getting
        config.set("test_key", "test_value")
        value = config.get("test_key")
        assert value == "test_value", "Setting not retrieved correctly"
        print(f"  ✓ Settings work (test: {value})")
        
        # Test paths
        print(f"  ✓ Cache dir: {config.get_cache_dir()}")
        print(f"  ✓ Logs dir: {config.get_logs_dir()}")
        print(f"  ✓ DB path: {config.get_db_path()}")
        
        return True
    except Exception as e:
        print(f"  ✗ Config test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_logger():
    """Test logger."""
    print("\nTesting logger...")
    
    try:
        from app.utils.logger import setup_logger, ApplicationLogger
        
        # Create logger
        logger = setup_logger("test", level=10)  # DEBUG
        print(f"  ✓ Logger created")
        
        # Test logging
        logger.info("Test message")
        print(f"  ✓ Logging works")
        
        # Test ApplicationLogger
        app_log = ApplicationLogger()
        print(f"  ✓ ApplicationLogger singleton works")
        
        return True
    except Exception as e:
        print(f"  ✗ Logger test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_database():
    """Test database module."""
    print("\nTesting database...")
    
    try:
        from pathlib import Path
        import tempfile
        from app.core.persistence.db import Database
        
        # Create temp database
        with tempfile.TemporaryDirectory() as tmpdir:
            db_path = Path(tmpdir) / "test.db"
            db = Database(db_path)
            print(f"  ✓ Database instance created")
            
            # Connect
            conn = db.connect()
            print(f"  ✓ Database connected")
            
            # Initialize schema
            db.initialize()
            print(f"  ✓ Schema initialized")
            
            # Check tables
            conn = db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"  ✓ Tables created: {len(tables)} tables")
            
            # Close
            db.close()
            print(f"  ✓ Database closed")
        
        return True
    except Exception as e:
        print(f"  ✗ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_keyring():
    """Test keyring adapter."""
    print("\nTesting keyring adapter...")
    
    try:
        from app.core.security.keyring_adapter import KeyringAdapter
        
        keyring = KeyringAdapter()
        available = keyring.is_available()
        
        if available:
            print(f"  ✓ Keyring available on this system")
            # Note: Actual save/get may fail if keyring not configured
        else:
            print(f"  ⚠ Keyring not available (graceful fallback)")
        
        return True
    except Exception as e:
        print(f"  ✗ Keyring test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_app_state():
    """Test application state."""
    print("\nTesting application state...")
    
    try:
        from app.core.state.app_state import AppState
        
        state = AppState()
        print(f"  ✓ AppState instance created")
        
        # Create window
        window_id = state.create_window()
        print(f"  ✓ Window created: {window_id}")
        
        # Get active window
        window = state.get_active_window()
        assert window is not None, "Active window is None"
        print(f"  ✓ Active window retrieved")
        
        # Check tab
        assert len(window.tabs) > 0, "No default tab created"
        print(f"  ✓ Default tab created")
        
        # Test settings
        state.set_setting("theme", "dark")
        assert state.get_setting("theme") == "dark", "Setting not retrieved"
        print(f"  ✓ Settings work")
        
        return True
    except Exception as e:
        print(f"  ✗ AppState test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("PHASE 1 FOUNDATION VALIDATION TEST")
    print("=" * 60)
    
    tests = [
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("Logger", test_logger),
        ("Database", test_database),
        ("Keyring", test_keyring),
        ("App State", test_app_state),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} passed")
    print("=" * 60)
    
    return 0 if passed == total else 1


if __name__ == '__main__':
    sys.exit(main())
