from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
    QProgressBar, QFrame, QGridLayout, QSizePolicy
)
from PyQt6.QtCore import Qt, pyqtSlot, QSize
from PyQt6.QtGui import QFont, QColor

class StatCard(QFrame):
    """Een moderne statistiek-kaart voor op het dashboard"""
    def __init__(self, title, icon, value="0", unit="", color="#4a9eff"):
        super().__init__()
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setMinimumSize(200, 100)
        self.setStyleSheet(f"""
            StatCard {{
                background-color: #2b2b2b;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
            }}
            StatCard:hover {{
                border: 1px solid {color};
                background-color: #323232;
            }}
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(5)
        
        # Header (Icon + Title)
        header = QHBoxLayout()
        self.icon_lbl = QLabel(icon)
        self.icon_lbl.setStyleSheet(f"font-size: 20px; color: {color};")
        
        self.title_lbl = QLabel(title.upper())
        self.title_lbl.setStyleSheet("""
            font-size: 11px;
            font-weight: bold;
            color: #888888;
            letter-spacing: 1px;
        """)
        
        header.addWidget(self.icon_lbl)
        header.addWidget(self.title_lbl)
        header.addStretch()
        layout.addLayout(header)
        
        # Value + Unit
        val_layout = QHBoxLayout()
        self.value_lbl = QLabel(value)
        self.value_lbl.setStyleSheet("""
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
        """)
        
        self.unit_lbl = QLabel(unit)
        self.unit_lbl.setStyleSheet("""
            font-size: 14px;
            color: #888888;
            margin-bottom: 4px;
        """)
        self.unit_lbl.setAlignment(Qt.AlignmentFlag.AlignBottom)
        
        val_layout.addWidget(self.value_lbl)
        val_layout.addWidget(self.unit_lbl)
        val_layout.addStretch()
        layout.addLayout(val_layout)
        
    def update_value(self, value):
        self.value_lbl.setText(str(value))

class DashboardWidget(QWidget):
    """Live Dashboard voor scraping statistieken met moderne stat-cards"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
        
    def setup_ui(self):
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(10, 10, 10, 10)
        self.main_layout.setSpacing(20)
        
        # Titel
        title_lbl = QLabel("Dashboard Overzicht")
        title_lbl.setStyleSheet("font-size: 18px; font-weight: bold; color: #e0e0e0;")
        self.main_layout.addWidget(title_lbl)
        
        # Grid voor kaarten
        self.cards_grid = QGridLayout()
        self.cards_grid.setSpacing(15)
        
        self.card_progress = StatCard("Voortgang", "📊", "0 / 0", "", "#4a9eff")
        self.card_speed = StatCard("Snelheid", "⚡", "0.0", "items/min", "#ffca28")
        self.card_elapsed = StatCard("Verstreken", "⏱️", "00:00:00", "", "#66bb6a")
        self.card_eta = StatCard("Resterend (ETA)", "🏁", "--:--:--", "", "#ef5350")
        
        self.cards_grid.addWidget(self.card_progress, 0, 0)
        self.cards_grid.addWidget(self.card_speed, 0, 1)
        self.cards_grid.addWidget(self.card_elapsed, 1, 0)
        self.cards_grid.addWidget(self.card_eta, 1, 1)
        
        self.main_layout.addLayout(self.cards_grid)
        
        # Progress Bar Sectie
        progress_group = QFrame()
        progress_group.setStyleSheet("""
            QFrame {
                background-color: #2b2b2b;
                border: 1px solid #3d3d3d;
                border-radius: 8px;
            }
        """)
        progress_layout = QVBoxLayout(progress_group)
        progress_layout.setContentsMargins(15, 15, 15, 15)
        
        progress_header = QHBoxLayout()
        progress_header.addWidget(QLabel("Totale Voortgang"))
        progress_header.addStretch()
        self.lbl_pct = QLabel("0%")
        self.lbl_pct.setStyleSheet("font-weight: bold; color: #4a9eff;")
        progress_header.addWidget(self.lbl_pct)
        progress_layout.addLayout(progress_header)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setFixedHeight(12)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                border: none;
                background-color: #1e1e1e;
                border-radius: 6px;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #4a9eff, stop:1 #00d4ff);
                border-radius: 6px;
            }
        """)
        self.progress_bar.setTextVisible(False)
        progress_layout.addWidget(self.progress_bar)
        
        self.main_layout.addWidget(progress_group)
        self.main_layout.addStretch()
        
    @pyqtSlot(dict)
    def update_metrics(self, summary: dict):
        """Update het dashboard met nieuwe metrics"""
        completed = summary.get("completed", 0)
        total = summary.get("total", 0)
        speed = summary.get("speed", 0.0)
        elapsed = summary.get("elapsed", "00:00:00")
        eta = summary.get("eta", "--:--:--")
        progress = summary.get("progress", 0.0)
        
        self.card_progress.update_value(f"{completed} / {total}")
        self.card_speed.update_value(f"{speed:.1f}")
        self.card_elapsed.update_value(elapsed)
        self.card_eta.update_value(eta)
        
        self.progress_bar.setValue(int(progress))
        self.lbl_pct.setText(f"{int(progress)}%")
        
    def reset(self):
        """Reset alle dashboard waarden"""
        self.card_progress.update_value("0 / 0")
        self.card_speed.update_value("0.0")
        self.card_elapsed.update_value("00:00:00")
        self.card_eta.update_value("--:--:--")
        self.progress_bar.setValue(0)
        self.lbl_pct.setText("0%")
