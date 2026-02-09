# gui/progress_tree.py
from PyQt6.QtWidgets import QTreeView, QHeaderView
from PyQt6.QtGui import QStandardItemModel, QStandardItem, QIcon
from PyQt6.QtCore import Qt, pyqtSignal

class ProgressTreeWidget(QTreeView):
    """Boomstructuur voor weergave van scraping voortgang"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_model()
        self.setup_view()
        
    def setup_model(self):
        self.model = QStandardItemModel()
        self.model.setHorizontalHeaderLabels(["Item", "Status", "Info"])
        self.setModel(self.model)
        
    def setup_view(self):
        self.header().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.header().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.header().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.setEditTriggers(QTreeView.EditTrigger.NoEditTriggers)
        self.setSelectionMode(QTreeView.SelectionMode.SingleSelection)
        self.setAlternatingRowColors(True)
        self.setAnimated(True)
        
    def add_book(self, title: str):
        book_item = QStandardItem(title)
        book_item.setData("book", Qt.ItemDataRole.UserRole)
        status_item = QStandardItem("⏳")
        info_item = QStandardItem("")
        self.model.appendRow([book_item, status_item, info_item])
        return book_item

    def add_chapter(self, book_item: QStandardItem, title: str):
        chapter_item = QStandardItem(title)
        chapter_item.setData("chapter", Qt.ItemDataRole.UserRole)
        status_item = QStandardItem("⏳")
        info_item = QStandardItem("")
        book_item.appendRow([chapter_item, status_item, info_item])
        return chapter_item

    def add_paragraph(self, chapter_item: QStandardItem, title: str):
        paragraph_item = QStandardItem(title)
        paragraph_item.setData("paragraph", Qt.ItemDataRole.UserRole)
        status_item = QStandardItem("⏳")
        info_item = QStandardItem("")
        chapter_item.appendRow([paragraph_item, status_item, info_item])
        return paragraph_item

    def update_status(self, item: QStandardItem, status: str, info: str = ""):
        """Update status van een item (⏳, 🔄, ✅, ❌)"""
        row = item.row()
        parent = item.parent() or self.model
        
        status_item = parent.child(row, 1)
        info_item = parent.child(row, 2)
        
        if status_item:
            status_item.setText(status)
        if info_item:
            info_item.setText(info)
            
        # Scroll naar het item als het actief is
        if status == "🔄":
            self.scrollTo(item.index())
            self.expand(item.index())
            if parent != self.model:
                self.expand(parent.index())
