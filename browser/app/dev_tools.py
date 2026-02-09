"""
Development Tools Module

Utilities for development and debugging:
  - QML profiler activation
  - Debug console logging
  - Database inspector
  - Performance monitoring
"""

import os
from pathlib import Path
from app.utils.logger import setup_logger


logger = setup_logger(__name__)


class DevTools:
    """Developer tools manager."""
    
    def __init__(self):
        """Initialize dev tools."""
        self._qml_profiler_enabled = False
        self._debug_output_enabled = False
    
    def enable_qml_profiler(self) -> None:
        """
        Enable QML profiler for performance analysis.
        
        Requires QML_PROFILER_SETTINGS environment variable.
        """
        try:
            os.environ['QML_PROFILER_SETTINGS'] = '1'
            self._qml_profiler_enabled = True
            logger.info("QML profiler enabled")
        except Exception as e:
            logger.error(f"Failed to enable QML profiler: {e}")
    
    def enable_debug_output(self) -> None:
        """Enable detailed debug output."""
        self._debug_output_enabled = True
        os.environ['QT_DEBUG_PLUGINS'] = '1'
        os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = ''
        logger.info("Debug output enabled")
    
    def is_qml_profiler_enabled(self) -> bool:
        """Check if QML profiler is enabled."""
        return self._qml_profiler_enabled
    
    def is_debug_output_enabled(self) -> bool:
        """Check if debug output is enabled."""
        return self._debug_output_enabled
    
    def inspect_database(self, db_path: Path) -> dict:
        """
        Inspect database schema.
        
        Args:
            db_path: Path to database file
        
        Returns:
            Dictionary with database info
        """
        from app.core.persistence.db import Database
        
        try:
            db = Database(db_path)
            db.connect()
            
            info = {
                'path': str(db_path),
                'exists': db_path.exists(),
                'size_kb': db_path.stat().st_size / 1024 if db_path.exists() else 0,
                'tables': {}
            }
            
            # Get table info
            conn = db.connect()
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            
            for (table_name,) in cursor.fetchall():
                table_info = db.get_table_info(table_name)
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                
                info['tables'][table_name] = {
                    'columns': table_info,
                    'row_count': row_count
                }
            
            logger.info(f"Database inspection: {len(info['tables'])} tables")
            return info
        
        except Exception as e:
            logger.error(f"Database inspection failed: {e}")
            return {'error': str(e)}
    
    def print_config_info(self, config) -> None:
        """
        Print configuration information.
        
        Args:
            config: Configuration object
        """
        logger.info("=== Configuration ===")
        for key, value in config.to_dict().items():
            logger.info(f"  {key}: {value}")
    
    def print_system_info(self) -> None:
        """Print system information."""
        import platform
        import sys
        
        logger.info("=== System Information ===")
        logger.info(f"  Platform: {platform.system()} {platform.release()}")
        logger.info(f"  Python: {sys.version}")
        logger.info(f"  Architecture: {platform.machine()}")
        
        try:
            from PySide6 import QtCore
            logger.info(f"  Qt Version: {QtCore.QT_VERSION_STR}")
        except:
            logger.info("  Qt Version: Unknown")
    
    def print_environment(self) -> None:
        """Print relevant environment variables."""
        logger.info("=== Environment Variables ===")
        env_vars = [
            'PATH',
            'PYTHONPATH',
            'QT_QPA_PLATFORM',
            'QT_PLUGIN_PATH',
            'QML_IMPORT_PATH',
            'HOME',
            'APPDATA',
        ]
        
        for var in env_vars:
            value = os.environ.get(var, 'NOT SET')
            if var == 'PATH':
                # Truncate PATH for readability
                value = value[:100] + '...' if len(value) > 100 else value
            logger.info(f"  {var}: {value}")


# Global dev tools instance
_dev_tools: DevTools | None = None


def get_dev_tools() -> DevTools:
    """Get dev tools instance."""
    global _dev_tools
    if _dev_tools is None:
        _dev_tools = DevTools()
    return _dev_tools
