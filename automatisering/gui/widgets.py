# gui/widgets.py
from PyQt6.QtWidgets import (
    QTextEdit, QTableWidget, QTableWidgetItem,
    QHeaderView, QAbstractItemView, QMenu
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QAction, QColor, QTextCursor

class LogTextEdit(QTextEdit):
    """Aangepaste tekstedit voor log weergave met kleurcodering"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setReadOnly(True)
        self.setLineWrapMode(QTextEdit.LineWrapMode.NoWrap)
        self.setFontFamily("Consolas")
        self.setFontPointSize(10)
        self.all_logs = []  # Lijst van (message, level, timestamp, color, prefix)
        
    def append_log(self, message: str, level: str = "INFO"):
        """Voeg log bericht toe met kleurcodering"""
        # Stel kleur in op basis van level
        if level == "ERROR":
            color = QColor("#ff4444")
            prefix = "[ERROR] "
        elif level == "WARNING":
            color = QColor("#ffaa00")
            prefix = "[WARNING] "
        elif level == "INFO":
            color = QColor("#4444ff")
            prefix = "[INFO] "
        elif level == "SUCCESS":
            color = QColor("#44aa44")
            prefix = "[SUCCESS] "
        else:
            color = QColor("#666666")
            prefix = "[DEBUG] "
            
        # Voeg timestamp toe
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        log_entry = (message, level, timestamp, color, prefix)
        self.all_logs.append(log_entry)
        
        self._render_log_entry(log_entry)

    def _render_log_entry(self, entry):
        message, level, timestamp, color, prefix = entry
        formatted_message = f"[{timestamp}] {prefix}{message}"
        
        self.setTextColor(color)
        self.insertPlainText(formatted_message + "\n")
        self.ensureCursorVisible()

    def filter_logs(self, search_text: str):
        """Filter logs op basis van tekst"""
        self.clear()
        search_text = search_text.lower()
        
        for entry in self.all_logs:
            message, level, timestamp, color, prefix = entry
            if not search_text or search_text in message.lower() or search_text in prefix.lower():
                self._render_log_entry(entry)

    def clear_log(self):
        """Wis alle log berichten"""
        self.all_logs = []
        self.clear()
        
class ConfigTableWidget(QTableWidget):
    """Aangepaste tabel voor configuratie selectors"""
    
    selector_changed = pyqtSignal(str, str, str)  # row, column, new_value
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_table()
        
    def setup_table(self):
        """Stel tabel eigenschappen in"""
        self.setColumnCount(4)
        self.setHorizontalHeaderLabels(["Label", "Selector", "Type", "Acties"])
        
        # Stel header eigenschappen in
        header = self.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        
        # Stel selectie gedrag in
        self.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        
        # Context menu
        self.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.customContextMenuRequested.connect(self.show_context_menu)
        
    def add_selector_row(self, label: str = "", selector: str = "", 
                         selector_type: str = "CSS"):
        """Voeg nieuwe selector rij toe"""
        row = self.rowCount()
        self.insertRow(row)
        
        # Label
        item_label = QTableWidgetItem(label)
        self.setItem(row, 0, item_label)
        
        # Selector
        item_selector = QTableWidgetItem(selector)
        self.setItem(row, 1, item_selector)
        
        # Type
        item_type = QTableWidgetItem(selector_type)
        self.setItem(row, 2, item_type)
        
        # Acties
        action_widget = QWidget()
        action_layout = QHBoxLayout(action_widget)
        action_layout.setContentsMargins(2, 2, 2, 2)
        
        btn_test = QPushButton("Test")
        btn_test.setFixedSize(50, 25)
        btn_test.clicked.connect(lambda: self.test_selector(row))
        
        btn_remove = QPushButton("X")
        btn_remove.setFixedSize(30, 25)
        btn_remove.setStyleSheet("background-color: #ff4444; color: white;")
        btn_remove.clicked.connect(lambda: self.remove_selector(row))
        
        action_layout.addWidget(btn_test)
        action_layout.addWidget(btn_remove)
        action_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.setCellWidget(row, 3, action_widget)
        
    def test_selector(self, row: int):
        """Test de selector op de opgegeven rij"""
        selector = self.item(row, 1).text()
        # Emit signaal om selector te testen
        # Dit wordt afgehandeld door de hoofdapplicatie
        
    def remove_selector(self, row: int):
        """Verwijder selector op de opgegeven rij"""
        self.removeRow(row)
        
    def get_selector_data(self):
        """Haal alle selector data op uit de tabel"""
        data = []
        for row in range(self.rowCount()):
            label = self.item(row, 0).text()
            selector = self.item(row, 1).text()
            selector_type = self.item(row, 2).text()
            data.append({
                "label": label,
                "selector": selector,
                "type": selector_type
            })
        return data
        
    def set_selector_data(self, data: list):
        """Stel selector data in vanuit lijst"""
        self.setRowCount(0)
        for item in data:
            self.add_selector_row(
                item.get("label", ""),
                item.get("selector", ""),
                item.get("type", "CSS")
            )
            
    def show_context_menu(self, position):
        """Toon context menu voor tabel"""
        menu = QMenu()
        
        add_action = QAction("Selector Toevoegen", self)
        add_action.triggered.connect(self.add_selector_row)
        menu.addAction(add_action)
        
        if self.selectedItems():
            remove_action = QAction("Geselecteerde Verwijderen", self)
            remove_action.triggered.connect(self.remove_selected)
            menu.addAction(remove_action)
            
            test_action = QAction("Selectors Testen", self)
            test_action.triggered.connect(self.test_selected)
            menu.addAction(test_action)
            
        menu.exec(self.viewport().mapToGlobal(position))
        
    def remove_selected(self):
        """Verwijder geselecteerde rij"""
        selected_rows = set(item.row() for item in self.selectedItems())
        for row in sorted(selected_rows, reverse=True):
            self.removeRow(row)
            
    def test_selected(self):
        """Test geselecteerde selectors"""
        selected_rows = set(item.row() for item in self.selectedItems())
        for row in selected_rows:
            self.test_selector(row)