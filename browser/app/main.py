"""
Main Application Entry Point

Initializes and runs the browser application:
  1. Parse command-line arguments
  2. Initialize logger
  3. Initialize configuration
  4. Initialize database
  5. Initialize security (keyring)
  6. Create main window with QML
  7. Start event loop
"""

import sys
import os
import argparse
from pathlib import Path

# Pre-initialize environment variables for QtWebEngine
# This must be done before any PySide6 imports
os.environ["QTWEBENGINE_DISABLE_SANDBOX"] = "1"

# Check for data-dir in argv manually before full parsing
# to set environment variables as early as possible
for i, arg in enumerate(sys.argv):
    if arg.startswith("--data-dir"):
        data_dir_path = None
        if "=" in arg:
            data_dir_path = arg.split("=")[1]
        elif i + 1 < len(sys.argv):
            data_dir_path = sys.argv[i+1]
        
        if data_dir_path:
            abs_path = str(Path(data_dir_path).absolute())
            os.environ["QTWEBENGINE_USER_DATA_DIR"] = abs_path
            # Also set the Chromium flag
            if "--user-data-dir" not in " ".join(sys.argv):
                sys.argv.append(f"--user-data-dir={abs_path}")
            break

from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine
from PySide6.QtWebEngineQuick import QtWebEngineQuick

from app.utils.logger import app_logger, setup_logger
from app.core.config.config_manager import init_config, get_config_manager
from app.core.persistence.db import init_database
from app.core.security.keyring_adapter import init_keyring
from app.core.browser.browser_profile import init_profile_manager, get_profile_manager
from app.core.state.app_state import init_app_state
from app.core.qml_bridge import create_qml_bridge
from app.dev_tools import get_dev_tools


logger = setup_logger(__name__)


def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Modern Desktop Browser',
        prog='browser'
    )
    
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug mode (verbose logging)'
    )
    
    parser.add_argument(
        '--dev-mode',
        action='store_true',
        help='Enable development mode (QML profiler, debug tools)'
    )
    
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=None,
        help='Custom data directory'
    )
    
    parser.add_argument(
        '--no-keyring',
        action='store_true',
        help='Disable keyring (password storage)'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 0.1.0'
    )
    
    parser.add_argument(
        '--user-data-dir',
        type=str,
        help='QtWebEngine user data directory (internal use)'
    )
    
    return parser.parse_args()


def initialize_application(debug: bool = False, dev_mode: bool = False, data_dir: Path = None):
    """
    Initialize application components.
    
    Args:
        debug: Enable debug logging
        dev_mode: Enable development tools
        data_dir: Custom data directory
    
    Returns:
        Tuple of (config, database, app_state)
    """
    # Initialize logger
    if debug:
        logger.setLevel('DEBUG')
    
    logger.info("=" * 60)
    logger.info("Browser Application Starting")
    logger.info("=" * 60)
    
    # Initialize configuration
    config = init_config(data_dir)
    logger.info(f"Configuration loaded from {config.get_data_dir()}")
    
    # Initialize database
    db = init_database(config.get_db_path())
    logger.info(f"Database initialized at {config.get_db_path()}")
    
    # Initialize keyring
    keyring = init_keyring()
    if keyring.is_available():
        logger.info("Keyring adapter initialized")
    else:
        logger.warning("Keyring not available - password storage disabled")
    
    # Initialize profile manager
    profile_dir = config.get_data_dir() / "profiles"
    init_profile_manager(profile_dir)
    pm = get_profile_manager()
    logger.info(f"Profile manager initialized with {len(pm.get_all_profiles())} profiles")
    
    # Initialize application state with profile support
    app_state = init_app_state(config.get_data_dir())
    
    # Set default/active profile
    profiles = pm.get_all_profiles()
    if profiles:
        app_state.set_current_profile(profiles[0].id)
        logger.info(f"Set active profile: {profiles[0].name}")
    
    # Create initial window if none exist
    if not app_state.get_active_window():
        app_state.create_window()
        logger.info("Created initial window and tab")
    
    logger.info("Application state initialized with profile support")
    
    # Development mode
    if dev_mode:
        dev_tools = get_dev_tools()
        dev_tools.enable_debug_output()
        dev_tools.enable_qml_profiler()
        logger.info("Development mode enabled")
    
    return config, db, app_state


def create_application() -> QGuiApplication:
    """
    Create Qt GUI application.
    
    Returns:
        QGuiApplication instance
    """
    app = QGuiApplication(sys.argv)
    app.setApplicationName('Browser')
    # Use generic names or none to avoid AppData access issues on some systems
    app.setOrganizationName('BrowserApp')
    app.setOrganizationDomain('browser.local')
    app.setApplicationVersion('0.1.0')
    
    return app


def load_qml_ui(app: QGuiApplication, app_state) -> bool:
    """
    Load and display main QML UI.
    
    Args:
        app: QGuiApplication instance
        app_state: AppState instance to expose to QML
    
    Returns:
        True if successful
    """
    try:
        # Set default profile paths to writable location BEFORE initialization
        from PySide6.QtWebEngineCore import QWebEngineProfile
        default_profile = QWebEngineProfile.defaultProfile()
        data_dir = app_state.get_data_dir().absolute()
        
        # Ensure directories exist
        (data_dir / "storage").mkdir(parents=True, exist_ok=True)
        (data_dir / "cache").mkdir(parents=True, exist_ok=True)
        
        default_profile.setPersistentStoragePath(str(data_dir / "storage"))
        default_profile.setCachePath(str(data_dir / "cache"))
        logger.info(f"Default WebEngine profile paths set to: {data_dir}")

        # Initialize QtWebEngine for QML
        QtWebEngineQuick.initialize()
        logger.info("QtWebEngine initialized for QML")
        
        engine = QQmlApplicationEngine()
        
        # Connect QML warnings/errors to python logger
        def handle_qml_warning(warning):
            logger.warning(f"QML Warning: {warning}")
            
        engine.warnings.connect(handle_qml_warning)
        
        # Create and register QML bridge
        bridge = create_qml_bridge(app_state)
        engine.rootContext().setContextProperty("appBridge", bridge)
        logger.info("QML bridge registered")
        
        # Get QML file path
        qml_path = Path(__file__).parent / 'ui' / 'App.qml'
        
        if not qml_path.exists():
            logger.error(f"QML file not found: {qml_path}")
            return False
        
        # Load QML
        engine.load(str(qml_path))
        
        if not engine.rootObjects():
            logger.error("Failed to load QML root objects")
            return False
        
        # Explicitly show the root window
        root = engine.rootObjects()[0]
        if hasattr(root, 'showMaximized'):
            root.showMaximized()
            logger.info("Window shown maximized")
        elif hasattr(root, 'show'):
            root.show()
            logger.info("Window shown explicitly")
        
        logger.info(f"Loaded QML UI from {qml_path}")
        logger.info("QML bridge registered and exposed to UI")
        logger.info("Main window created successfully - UI is ready")
        logger.info("Browser GUI should now be visible")
        return engine
    
    except Exception as e:
        logger.error(f"Failed to load QML UI: {e}", exc_info=True)
        return False


def main():
    """Main application entry point."""
    try:
        # Parse arguments
        args = parse_arguments()
        
        # Create Qt application FIRST - required for QTimer and other Qt features
        qt_app = create_application()
        logger.info("Qt Application created")
        
        # NOW initialize components that might need Qt
        config, db, app_state = initialize_application(
            debug=args.debug,
            dev_mode=args.dev_mode,
            data_dir=args.data_dir
        )
        
        # Load QML UI with app state
        engine = load_qml_ui(qt_app, app_state)
        if not engine:
            logger.error("Failed to initialize UI")
            return 1
        
        logger.info("Application started successfully")
        logger.info("=" * 60)
        
        # Start event loop
        return qt_app.exec()
    
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
        return 0
    
    except Exception as e:
        logger.critical(f"Application crashed: {e}", exc_info=True)
        return 1
if __name__ == '__main__':
    sys.exit(main())
