"""
SQLite Database Connection & Management

Provides connection pooling, context managers, and migration support.
"""

import sqlite3
from pathlib import Path
from typing import Optional, List, Any, Dict
from contextlib import contextmanager
from app.utils.logger import setup_logger
from app.core.persistence.schema import MIGRATION_001_UP


logger = setup_logger(__name__)


class DatabaseError(Exception):
    """Database operation error."""
    pass


class Database:
    """SQLite database manager with connection pooling and migrations."""
    
    def __init__(self, db_path: Path):
        """
        Initialize database.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = Path(db_path)
        self._connection: Optional[sqlite3.Connection] = None
        self._is_initialized = False
    
    def connect(self) -> sqlite3.Connection:
        """
        Get or create database connection.
        
        Returns:
            SQLite connection
        """
        if self._connection is None:
            try:
                self.db_path.parent.mkdir(parents=True, exist_ok=True)
                self._connection = sqlite3.connect(
                    str(self.db_path),
                    check_same_thread=False,
                    timeout=30.0
                )
                # Enable foreign keys
                self._connection.execute('PRAGMA foreign_keys = ON')
                # Use WAL mode for better concurrency
                self._connection.execute('PRAGMA journal_mode = WAL')
                # Set reasonable sync mode
                self._connection.execute('PRAGMA synchronous = NORMAL')
                logger.info(f"Connected to database: {self.db_path}")
            except sqlite3.Error as e:
                logger.error(f"Failed to connect to database: {e}")
                raise DatabaseError(f"Connection failed: {e}")
        
        return self._connection
    
    def close(self) -> None:
        """Close database connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
            logger.info("Database connection closed")
    
    def initialize(self) -> bool:
        """
        Initialize database schema.
        
        Returns:
            True if successful
        """
        if self._is_initialized:
            return True
        
        try:
            conn = self.connect()
            cursor = conn.cursor()
            
            # Check if tables exist
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
            if cursor.fetchone():
                logger.info("Database already initialized")
                self._is_initialized = True
                return True
            
            # Run migration
            logger.info("Initializing database schema...")
            cursor.executescript(MIGRATION_001_UP)
            conn.commit()
            
            self._is_initialized = True
            logger.info("Database schema created successfully")
            return True
        
        except sqlite3.Error as e:
            logger.error(f"Failed to initialize database: {e}")
            raise DatabaseError(f"Initialization failed: {e}")
    
    @contextmanager
    def transaction(self):
        """
        Context manager for database transactions.
        
        Usage:
            with db.transaction() as cursor:
                cursor.execute(...)
                cursor.execute(...)
        """
        conn = self.connect()
        cursor = conn.cursor()
        
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Transaction failed, rolled back: {e}")
            raise
    
    def execute(self, query: str, params: Optional[tuple] = None) -> List[Any]:
        """
        Execute query and fetch all results.
        
        Args:
            query: SQL query
            params: Query parameters
        
        Returns:
            List of result rows
        """
        conn = self.connect()
        cursor = conn.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Query failed: {e}. Query: {query}")
            raise DatabaseError(f"Query execution failed: {e}")
    
    def execute_one(self, query: str, params: Optional[tuple] = None) -> Optional[Any]:
        """
        Execute query and fetch first result.
        
        Args:
            query: SQL query
            params: Query parameters
        
        Returns:
            First result row or None
        """
        result = self.execute(query, params)
        return result[0] if result else None
    
    def execute_insert(self, query: str, params: Optional[tuple] = None) -> int:
        """
        Execute insert query.
        
        Args:
            query: SQL insert query
            params: Query parameters
        
        Returns:
            Last inserted row ID
        """
        conn = self.connect()
        cursor = conn.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            conn.rollback()
            logger.error(f"Insert failed: {e}")
            raise DatabaseError(f"Insert failed: {e}")
    
    def execute_update(self, query: str, params: Optional[tuple] = None) -> int:
        """
        Execute update/delete query.
        
        Args:
            query: SQL update/delete query
            params: Query parameters
        
        Returns:
            Number of affected rows
        """
        conn = self.connect()
        cursor = conn.cursor()
        
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor.rowcount
        except sqlite3.Error as e:
            conn.rollback()
            logger.error(f"Update failed: {e}")
            raise DatabaseError(f"Update failed: {e}")
    
    def execute_batch(self, query: str, params_list: List[tuple]) -> int:
        """
        Execute batch insert/update.
        
        Args:
            query: SQL query (with ? placeholders)
            params_list: List of parameter tuples
        
        Returns:
            Number of affected rows
        """
        conn = self.connect()
        cursor = conn.cursor()
        
        try:
            cursor.executemany(query, params_list)
            conn.commit()
            return cursor.rowcount
        except sqlite3.Error as e:
            conn.rollback()
            logger.error(f"Batch operation failed: {e}")
            raise DatabaseError(f"Batch operation failed: {e}")
    
    def get_table_info(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Get table schema information.
        
        Args:
            table_name: Name of table
        
        Returns:
            List of column info dictionaries
        """
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        
        columns = []
        for row in cursor.fetchall():
            columns.append({
                'cid': row[0],
                'name': row[1],
                'type': row[2],
                'notnull': row[3],
                'dflt_value': row[4],
                'pk': row[5]
            })
        
        return columns
    
    def backup(self, backup_path: Path) -> bool:
        """
        Create database backup.
        
        Args:
            backup_path: Path for backup file
        
        Returns:
            True if successful
        """
        try:
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            conn = self.connect()
            backup_conn = sqlite3.connect(str(backup_path))
            
            with backup_conn:
                conn.backup(backup_conn)
            
            backup_conn.close()
            logger.info(f"Database backed up to {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False
    
    def vacuum(self) -> bool:
        """
        Optimize database (vacuum).
        
        Returns:
            True if successful
        """
        try:
            conn = self.connect()
            conn.execute('VACUUM')
            conn.commit()
            logger.info("Database vacuumed")
            return True
        except sqlite3.Error as e:
            logger.error(f"Vacuum failed: {e}")
            return False
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Global database instance
_database: Optional[Database] = None


def get_database() -> Database:
    """Get global database instance."""
    global _database
    if _database is None:
        raise DatabaseError("Database not initialized. Call init_database() first.")
    return _database


def init_database(db_path: Path) -> Database:
    """Initialize global database instance."""
    global _database
    _database = Database(db_path)
    _database.initialize()
    return _database
