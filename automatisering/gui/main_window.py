# gui/main_window.py
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QGridLayout, QGroupBox, QLabel, QLineEdit, 
    QPushButton, QCheckBox, QTextEdit, QComboBox,
    QTabWidget, QTableWidget, QTableWidgetItem,
    QHeaderView, QFileDialog, QMessageBox, QProgressBar,
    QSplitter, QScrollArea, QFrame, QSizePolicy,
    QApplication, QStyleFactory, QSpinBox, QMenu, QInputDialog
)
from PyQt6.QtGui import QAction
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QSize
from PyQt6.QtGui import QFont, QPalette, QColor, QIcon, QTextCursor

from config.config_manager import ConfigManager, ScraperConfig, UITheme, ExportFormat
from utils.logger import Logger
from runner.playwright_runner import BookScrapeRunner
from gui.progress_tree import ProgressTreeWidget
from gui.dashboard import DashboardWidget
from gui.selector_tester import SelectorTesterDialog
from gui.dialogs import CaptchaDialog, LoginDialog, ProgressDialog
from utils.security import SecurityManager
from gui.widgets import ConfigTableWidget, LogTextEdit
from gui.theme_manager import ThemeManager

class MainWindow(QMainWindow):
    """Hoofdvenster van de Noordhoff Scraper applicatie"""
    
    # Signalen voor communicatie met runner thread
    runner_started = pyqtSignal()
    runner_stopped = pyqtSignal()
    runner_error = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self.config_manager = ConfigManager()
        self.security_manager = SecurityManager()
        self.current_config: Optional[ScraperConfig] = None
        self.runner_thread: Optional[QThread] = None
        self.runner: Optional[BookScrapeRunner] = None
        self.is_running = False
        self.is_recording = False
        self._is_starting = False # Flag to prevent re-entry
        self.found_books = []
        
        self.setup_ui()
        self.setup_connections()
        self.setup_logger()
        
        # Window management: Launch maximized and on top briefly
        self.showMaximized()
        self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
        self.show()
        QTimer.singleShot(5000, self.remove_stays_on_top)

    def setup_toolbar(self, layout: QVBoxLayout):
        """Stel de toolbar bovenin de app op"""
        toolbar_frame = QFrame()
        toolbar_frame.setFrameShape(QFrame.Shape.StyledPanel)
        toolbar_layout = QHBoxLayout(toolbar_frame)
        
        # Titel / Logo
        title_label = QLabel("🚀 Noordhoff Scraper Pro")
        title_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #4a86e8;")
        toolbar_layout.addWidget(title_label)
        
        toolbar_layout.addStretch()
        
        # Thema Toggle
        self.btn_theme_toggle = QPushButton("🌙 Dark Mode")
        self.btn_theme_toggle.setCheckable(True)
        self.btn_theme_toggle.setChecked(True)
        self.btn_theme_toggle.clicked.connect(self.toggle_theme)
        toolbar_layout.addWidget(self.btn_theme_toggle)
        
        layout.addWidget(toolbar_frame)

    def toggle_theme(self):
        """Schakel tussen Dark en Light mode"""
        if self.btn_theme_toggle.isChecked():
            self.current_theme = UITheme.DARK
            self.btn_theme_toggle.setText("🌙 Dark Mode")
        else:
            self.current_theme = UITheme.LIGHT
            self.btn_theme_toggle.setText("☀️ Light Mode")
        
        ThemeManager.apply_theme(QApplication.instance(), self.current_theme)
        
        # Sla de keuze op in de config
        if self.current_config:
            self.current_config.ui.theme = self.current_theme
            self.auto_save_state()

    def remove_stays_on_top(self):
        """Remove the stays on top hint after a delay"""
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowStaysOnTopHint)
        self.show() # Necessary to refresh flags

    def setup_ui(self):
        """Stel de gebruikersinterface op"""
        self.setWindowTitle("Noordhoff Scraper")
        self.setGeometry(100, 100, 1400, 900)
        
        # Thema initialisatie
        system_theme = ThemeManager.get_system_theme()
        self.current_theme = UITheme.LIGHT if system_theme == "light" else UITheme.DARK
        ThemeManager.apply_theme(QApplication.instance(), self.current_theme)
        
        # Creëer centrale widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Hoofd layout met meer spacing
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(20)
        main_layout.setContentsMargins(20, 20, 20, 20)
        
        # Splitter voor 50/50 view
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setHandleWidth(2)
        
        # Linker kant: Configuratie (scrollbaar)
        config_scroll = QScrollArea()
        config_scroll.setWidgetResizable(True)
        config_scroll.setFrameShape(QFrame.Shape.NoFrame)
        config_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        config_widget = QWidget()
        config_layout = QVBoxLayout(config_widget)
        config_layout.setSpacing(15)
        config_layout.setContentsMargins(0, 0, 10, 0)
        
        # Voeg configuratie secties toe
        self.setup_url_section(config_layout)
        self.setup_login_section(config_layout)
        self.setup_target_selection_section(config_layout) # Nieuwe sectie
        self.setup_field_manager_section(config_layout)
        self.setup_book_selection_section(config_layout)
        self.setup_ui_structure_section(config_layout)
        self.setup_output_section(config_layout)
        self.setup_advanced_section(config_layout)
        
        config_scroll.setWidget(config_widget)
        
        # Rechter kant: Tabs
        self.right_tabs = QTabWidget()
        
        # 1. Control Tab (Nieuw - bevat alle knoppen)
        control_tab = QWidget()
        control_tab_layout = QVBoxLayout(control_tab)
        control_tab_layout.setSpacing(15)
        
        # Status Card
        status_group = QGroupBox("Status & Acties")
        status_layout = QVBoxLayout(status_group)
        
        # Gecombineerde Start/Stop knop
        self.btn_run_toggle = QPushButton("🚀 Start Scraper")
        self.btn_run_toggle.setFixedHeight(50)
        self.btn_run_toggle.setStyleSheet("font-size: 16px; font-weight: bold; background-color: #2d5a27;")
        status_layout.addWidget(self.btn_run_toggle)
        
        # Overige acties in grid
        actions_grid = QGridLayout()
        self.btn_test_selectors = QPushButton("🔍 Test Selectors")
        self.btn_focus_and_start = QPushButton("🎯 Focus & Start")
        self.btn_record_steps = QPushButton("🔴 Start Recording")
        self.btn_record_steps.setStyleSheet("background-color: #ff4444; color: white;")
        self.btn_record_steps.clicked.connect(self.toggle_recording)
        
        # Coördinaten optie voor recording
        self.chk_record_coords = QCheckBox("Gebruik Coördinaten")
        self.chk_record_coords.setToolTip("Slaat coördinaten (X, Y) op in plaats van CSS selectors voor klikken")
        
        self.btn_toggle_selection = QPushButton("🖱 Data Selectie")
        self.btn_toggle_selection.setStyleSheet("background-color: #4caf50; color: white;")
        self.btn_toggle_selection.setCheckable(True)
        self.btn_toggle_selection.clicked.connect(self.toggle_selection_mode)
        
        self.btn_install_browsers = QPushButton("📦 Installeer Browsers")
        self.btn_theme_toggle = QPushButton("🌙 Dark Mode" if self.current_theme == UITheme.DARK else "☀️ Light Mode")
        self.btn_theme_toggle.setCheckable(True)
        self.btn_theme_toggle.setChecked(self.current_theme == UITheme.DARK)
        self.btn_theme_toggle.clicked.connect(self.toggle_theme)
        
        actions_grid.addWidget(self.btn_test_selectors, 0, 0)
        actions_grid.addWidget(self.btn_focus_and_start, 0, 1)
        
        # Recording layout met checkbox
        record_layout = QVBoxLayout()
        record_layout.addWidget(self.btn_record_steps)
        record_layout.addWidget(self.chk_record_coords)
        actions_grid.addLayout(record_layout, 1, 0)
        
        actions_grid.addWidget(self.btn_toggle_selection, 1, 1)
        actions_grid.addWidget(self.btn_install_browsers, 2, 0)
        actions_grid.addWidget(self.btn_theme_toggle, 2, 1)
        status_layout.addLayout(actions_grid)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setFixedHeight(20)
        self.progress_bar.setVisible(False)
        status_layout.addWidget(self.progress_bar)

        # Status label voor recording/selectie mode
        self.lbl_mode_status = QLabel("")
        self.lbl_mode_status.setStyleSheet("font-weight: bold; padding: 5px; border-radius: 4px;")
        self.lbl_mode_status.setVisible(False)
        status_layout.addWidget(self.lbl_mode_status)
        
        control_tab_layout.addWidget(status_group)
        control_tab_layout.addStretch()
        
        self.right_tabs.addTab(control_tab, "🎮 Bediening")
        
        # 2. Dashboard Tab
        self.dashboard = DashboardWidget()
        self.right_tabs.addTab(self.dashboard, "📊 Dashboard")
        
        # 3. Voortgang Tab
        progress_widget = QWidget()
        progress_layout = QVBoxLayout(progress_widget)
        self.progress_tree = ProgressTreeWidget()
        progress_layout.addWidget(self.progress_tree)
        self.right_tabs.addTab(progress_widget, "🌳 Voortgang")
        
        # 4. Live Data Tab
        live_data_widget = QWidget()
        live_data_layout = QVBoxLayout(live_data_widget)
        self.live_table = QTableWidget()
        self.live_table.setColumnCount(5)
        self.live_table.setHorizontalHeaderLabels(["Hoofdstuk", "Paragraaf", "Type", "Data", "Tijd"])
        self.live_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.live_table.horizontalHeader().setStretchLastSection(True)
        live_data_layout.addWidget(self.live_table)
        self.right_tabs.addTab(live_data_widget, "⚡ Live Data")
        
        # 5. Logs Tab
        log_widget = QWidget()
        log_layout = QVBoxLayout(log_widget)
        self.log_text = LogTextEdit()
        self.log_text.setReadOnly(True)
        log_layout.addWidget(self.log_text)
        self.right_tabs.addTab(log_widget, "📝 Logs")
        
        # Voeg widgets toe aan splitter
        splitter.addWidget(config_scroll)
        splitter.addWidget(self.right_tabs)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 1)
        
        main_layout.addWidget(splitter)
        
        # Status bar
        self.statusBar().showMessage("Klaar")
        self.status_label = QLabel("")
        self.statusBar().addPermanentWidget(self.status_label)

    def toggle_run(self):
        """Wisselt tussen start en stop run"""
        if not self.is_running:
            self.start_run()
        else:
            self.stop_run()

    def update_run_button_state(self):
        """Update de tekst en kleur van de run knop"""
        if self.is_running:
            self.btn_run_toggle.setText("🛑 Stop Scraper")
            self.btn_run_toggle.setStyleSheet("font-size: 16px; font-weight: bold; background-color: #7b2d2d;")
        else:
            self.btn_run_toggle.setText("🚀 Start Scraper")
            self.btn_run_toggle.setStyleSheet("font-size: 16px; font-weight: bold; background-color: #2d5a27;")

    def setup_url_section(self, layout: QVBoxLayout):
        """Stel URL sectie op"""
        group = QGroupBox("Start URL")
        grid = QGridLayout()
        
        # URL input
        self.lbl_url = QLabel("Start URL:")
        self.txt_url = QLineEdit()
        self.txt_url.setPlaceholderText("https://leerling.noordhoff.nl/login")
        self.txt_url.setText("https://leerling.noordhoff.nl/login")
        
        grid.addWidget(self.lbl_url, 0, 0)
        grid.addWidget(self.txt_url, 0, 1)
        
        group.setLayout(grid)
        layout.addWidget(group)
        
    def setup_login_section(self, layout: QVBoxLayout):
          """Stel automatisering stappen sectie op"""
          group = QGroupBox("Automatisering Stappen")
          main_layout = QVBoxLayout()

          # Preset management
          preset_layout = QHBoxLayout()
          preset_layout.addWidget(QLabel("Presets:"))
          self.cmb_presets = QComboBox()
          self.cmb_presets.setMinimumWidth(200)
          self.refresh_presets_list()
          preset_layout.addWidget(self.cmb_presets)
          
          self.btn_new_preset = QPushButton("Nieuw")
          self.btn_new_preset.clicked.connect(self.new_preset)
          self.btn_new_preset.setToolTip("Start een nieuwe lege configuratie")
          preset_layout.addWidget(self.btn_new_preset)
          
          self.btn_load_preset = QPushButton("Laden")
          self.btn_load_preset.clicked.connect(self.load_selected_preset)
          preset_layout.addWidget(self.btn_load_preset)
          
          self.btn_save_preset = QPushButton("Opslaan als Preset")
          self.btn_save_preset.clicked.connect(self.save_current_as_preset)
          preset_layout.addWidget(self.btn_save_preset)

          self.btn_duplicate_preset = QPushButton("Dupliceren")
          self.btn_duplicate_preset.clicked.connect(self.duplicate_selected_preset)
          preset_layout.addWidget(self.btn_duplicate_preset)

          self.btn_delete_preset = QPushButton("Verwijderen")
          self.btn_delete_preset.clicked.connect(self.delete_selected_preset)
          self.btn_delete_preset.setStyleSheet("background-color: #ff4444; color: white;")
          preset_layout.addWidget(self.btn_delete_preset)
          
          preset_layout.addStretch()
          main_layout.addLayout(preset_layout)

          # Toggle voor simpele login vs stappen
          toggle_layout = QHBoxLayout()
          self.chk_use_login_steps = QCheckBox("Gebruik automatisering stappen (geavanceerd)")
          self.chk_use_login_steps.setChecked(True)
          toggle_layout.addWidget(self.chk_use_login_steps)
          main_layout.addLayout(toggle_layout)

          # Simpele login velden (voor backward compatibility en gemak)
          self.simple_login_group = QGroupBox("Simpele Login")
          simple_grid = QGridLayout()
          
          self.lbl_username_selector = QLabel("Username Selector:")
          self.txt_username_selector = QLineEdit()
          self.txt_username_selector.setText("#email")
          
          self.lbl_username_value = QLabel("Username:")
          self.txt_username_value = QLineEdit()
          
          self.lbl_password_selector = QLabel("Password Selector:")
          self.txt_password_selector = QLineEdit()
          self.txt_password_selector.setText("#password")
          
          self.lbl_password_value = QLabel("Password:")
          self.txt_password_value = QLineEdit()
          self.txt_password_value.setEchoMode(QLineEdit.EchoMode.Password)
          
          self.lbl_submit_selector = QLabel("Submit Selector:")
          self.txt_submit_selector = QLineEdit()
          self.txt_submit_selector.setText("button[type='submit']")

          simple_grid.addWidget(self.lbl_username_selector, 0, 0)
          simple_grid.addWidget(self.txt_username_selector, 0, 1)
          simple_grid.addWidget(self.lbl_username_value, 1, 0)
          simple_grid.addWidget(self.txt_username_value, 1, 1)
          simple_grid.addWidget(self.lbl_password_selector, 2, 0)
          simple_grid.addWidget(self.txt_password_selector, 2, 1)
          simple_grid.addWidget(self.lbl_password_value, 3, 0)
          simple_grid.addWidget(self.txt_password_value, 3, 1)
          simple_grid.addWidget(self.lbl_submit_selector, 4, 0)
          simple_grid.addWidget(self.txt_submit_selector, 4, 1)
          
          self.simple_login_group.setLayout(simple_grid)
          main_layout.addWidget(self.simple_login_group)

          # Login stappen container
          self.steps_container = QWidget()
          steps_vbox = QVBoxLayout(self.steps_container)
          steps_vbox.setContentsMargins(0, 0, 0, 0)

          # Login stappen tabel
          steps_label = QLabel("Stappen (volgorde is belangrijk):")
          steps_label.setStyleSheet("font-weight: bold;")
          steps_vbox.addWidget(steps_label)

          # Tabel voor stappen
          self.login_steps_table = QTableWidget()
          self.login_steps_table.setColumnCount(8)
          self.login_steps_table.setHorizontalHeaderLabels([
                "Status", "Actie", "Selector", "Waarde", "Wacht (ms)", "Verwacht Element", "Indices", "Acties"
          ])
          self.login_steps_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Fixed)
          self.login_steps_table.setColumnWidth(0, 60)
          self.login_steps_table.setColumnWidth(7, 120)
          self.login_steps_table.horizontalHeader().setStretchLastSection(True)

          # Context menu voor tabel
          self.login_steps_table.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
          self.login_steps_table.customContextMenuRequested.connect(self.show_login_steps_context_menu)

          # Maak tabel groter
          self.login_steps_table.setMinimumHeight(400)
          self.login_steps_table.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

          steps_vbox.addWidget(self.login_steps_table)

          # Knoppen voor stappen beheer
          steps_buttons_layout = QHBoxLayout()

          self.btn_add_step = QPushButton("Stap Toevoegen")
          self.btn_add_step.clicked.connect(self.add_login_step)

          self.btn_templates = QPushButton("📋 Sjablonen")
          self.btn_templates.setToolTip("Voeg veelgebruikte stappen of sequenties toe")
          self._setup_templates_menu()
          
          self.btn_remove_step = QPushButton("Stap Verwijderen")
          self.btn_remove_step.clicked.connect(self.remove_login_step)

          self.btn_move_up = QPushButton("↑")
          self.btn_move_up.clicked.connect(self.move_login_step_up)

          self.btn_move_down = QPushButton("↓")
          self.btn_move_down.clicked.connect(self.move_login_step_down)

          steps_buttons_layout.addWidget(self.btn_add_step)
          steps_buttons_layout.addWidget(self.btn_remove_step)
          steps_buttons_layout.addStretch()
          steps_buttons_layout.addWidget(self.btn_move_up)
          steps_buttons_layout.addWidget(self.btn_move_down)

          steps_vbox.addLayout(steps_buttons_layout)
          main_layout.addWidget(self.steps_container)

          group.setLayout(main_layout)
          layout.addWidget(group)

    def setup_target_selection_section(self, layout: QVBoxLayout):
        """Stel de Target Selectie sectie op"""
        group = QGroupBox("🎯 Doel Selectie (Wat te scrapen?)")
        main_layout = QVBoxLayout()
        
        info_label = QLabel("Selecteer hier welke boeken, hoofdstukken of paragrafen je wilt verwerken.\n"
                            "Deze instellingen worden gebruikt door de 'loop' acties in de tabel.")
        info_label.setStyleSheet("color: #888; font-style: italic; font-size: 11px;")
        main_layout.addWidget(info_label)
        
        grid = QGridLayout()
        
        # Boeken
        grid.addWidget(QLabel("Boek Indices:"), 0, 0)
        self.txt_target_books = QLineEdit()
        self.txt_target_books.setPlaceholderText("Bijv: 0, 1 (leeg = alles)")
        self.txt_target_books.setToolTip("Indices van de boeken in de lijst (0-gebaseerd)")
        grid.addWidget(self.txt_target_books, 0, 1)
        
        # Hoofdstukken
        grid.addWidget(QLabel("Hoofdstuk Indices:"), 1, 0)
        self.txt_target_chapters = QLineEdit()
        self.txt_target_chapters.setPlaceholderText("Bijv: 0-5, 8 (leeg = alles)")
        self.txt_target_chapters.setToolTip("Indices van de hoofdstukken (0-gebaseerd)")
        grid.addWidget(self.txt_target_chapters, 1, 1)
        
        # Paragrafen
        grid.addWidget(QLabel("Paragraaf Indices:"), 2, 0)
        self.txt_target_paragraphs = QLineEdit()
        self.txt_target_paragraphs.setPlaceholderText("Bijv: 1, 3, 5-10 (leeg = alles)")
        self.txt_target_paragraphs.setToolTip("Indices van de paragrafen (0-gebaseerd)")
        grid.addWidget(self.txt_target_paragraphs, 2, 1)
        
        main_layout.addLayout(grid)
        
        # Knoppen voor hulp
        btn_layout = QHBoxLayout()
        self.btn_discover_structure = QPushButton("🔍 Ontdek Structuur")
        self.btn_discover_structure.setToolTip("Navigeer naar de pagina en haal de lijst met items op")
        self.btn_discover_structure.clicked.connect(self.discover_structure)
        btn_layout.addWidget(self.btn_discover_structure)
        
        main_layout.addLayout(btn_layout)
        
        group.setLayout(main_layout)
        layout.addWidget(group)

    def discover_structure(self):
        """Probeer de structuur van de pagina te ontdekken via de runner"""
        if not self.runner or not self.runner.is_running:
            QMessageBox.warning(self, "Runner niet actief", 
                                "De runner moet actief zijn om de structuur te ontdekken. "
                                "Start eerst de browser via 'Start Browser'.")
            return

        # Vraag de runner om elementen te tellen voor de huidige selectors
        # We sturen een signaal of roepen een methode aan op de runner
        self.statusBar().showMessage("Bezig met ontdekken van structuur...", 5000)
        
        # We voegen een tijdelijke taak toe aan de event loop van de runner
        async def discover_task():
            try:
                results = {}
                
                # Check boeken
                book_selector = self.txt_book_list_selector.text()
                if book_selector:
                    elements = await self.runner.page.query_selector_all(book_selector)
                    results['books'] = len(elements)
                
                # Check hoofdstukken
                chapter_selector = self.txt_chapter_selector.text()
                if chapter_selector:
                    elements = await self.runner.page.query_selector_all(chapter_selector)
                    results['chapters'] = len(elements)
                
                # Check paragrafen
                paragraph_selector = self.txt_paragraph_selector.text()
                if paragraph_selector:
                    elements = await self.runner.page.query_selector_all(paragraph_selector)
                    results['paragraphs'] = len(elements)
                
                # Geef resultaten terug aan de GUI
                msg = "Ontdekking voltooid:\n"
                if 'books' in results: msg += f"- Boeken gevonden: {results['books']}\n"
                if 'chapters' in results: msg += f"- Hoofdstukken gevonden: {results['chapters']}\n"
                if 'paragraphs' in results: msg += f"- Paragrafen gevonden: {results['paragraphs']}\n"
                
                # Stel voor om indices in te vullen
                self.logger.info(msg)
                
                # We kunnen de velden automatisch vullen met "0-N"
                if results.get('books', 0) > 0:
                    self.txt_target_books.setText(f"0-{results['books']-1}")
                if results.get('chapters', 0) > 0:
                    self.txt_target_chapters.setText(f"0-{results['chapters']-1}")
                if results.get('paragraphs', 0) > 0:
                    self.txt_target_paragraphs.setText(f"0-{results['paragraphs']-1}")
                
                self.auto_save_state()
                
            except Exception as e:
                self.logger.error(f"Fout bij ontdekken structuur: {str(e)}")

        if hasattr(self.runner, 'loop') and self.runner.loop:
            import asyncio
            asyncio.run_coroutine_threadsafe(discover_task(), self.runner.loop)

    def setup_field_manager_section(self, layout: QVBoxLayout):
        """Stel de Field Manager sectie op voor Point-and-Click scraping"""
        group = QGroupBox("🎯 Point-and-Click Scraper")
        main_layout = QVBoxLayout()

        # Selection Mode Toggle
        selection_layout = QHBoxLayout()
        
        self.lbl_selection_status = QLabel("Selectie Mode: UIT")
        self.lbl_selection_status.setStyleSheet("color: #888; font-style: italic;")
        selection_layout.addWidget(self.lbl_selection_status)
        selection_layout.addStretch()
        main_layout.addLayout(selection_layout)

        # Field Manager Tabel
        main_layout.addWidget(QLabel("Gedefinieerde Velden:"))
        self.field_table = QTableWidget()
        self.field_table.setColumnCount(3)
        self.field_table.setHorizontalHeaderLabels(["Veldnaam", "Selector", "Actie"])
        self.field_table.horizontalHeader().setStretchLastSection(True)
        self.field_table.setMinimumHeight(200)
        main_layout.addWidget(self.field_table)

        # Knoppen voor veldbeheer
        field_buttons = QHBoxLayout()
        self.btn_add_field = QPushButton("Veld Toevoegen")
        self.btn_add_field.clicked.connect(self.add_scrape_field)
        self.btn_remove_field = QPushButton("Veld Verwijderen")
        self.btn_remove_field.clicked.connect(self.remove_scrape_field)
        field_buttons.addWidget(self.btn_add_field)
        field_buttons.addWidget(self.btn_remove_field)
        field_buttons.addStretch()
        main_layout.addLayout(field_buttons)

        group.setLayout(main_layout)
        layout.addWidget(group)
        
    def setup_book_selection_section(self, layout: QVBoxLayout):
        """Stel boek selectie sectie op"""
        group = QGroupBox("Boek Selectie")
        grid = QGridLayout()
        
        row = 0
        # Book list selector
        self.lbl_book_list_selector = QLabel("Book List Selector:")
        self.txt_book_list_selector = QLineEdit()
        self.txt_book_list_selector.setText(".my-books .book-item")
        grid.addWidget(self.lbl_book_list_selector, row, 0)
        grid.addWidget(self.txt_book_list_selector, row, 1)
        row += 1
        
        # Book title selector
        self.lbl_book_title_selector = QLabel("Book Title Selector:")
        self.txt_book_title_selector = QLineEdit()
        self.txt_book_title_selector.setText(".title")
        grid.addWidget(self.lbl_book_title_selector, row, 0)
        grid.addWidget(self.txt_book_title_selector, row, 1)
        row += 1
        
        # Book dropdown
        self.lbl_book_dropdown = QLabel("Beschikbare Boeken:")
        self.cmb_books = QComboBox()
        self.cmb_books.setEnabled(False)
        self.btn_refresh_books = QPushButton("Vernieuw")
        self.btn_refresh_books.setEnabled(False)
        
        grid.addWidget(self.lbl_book_dropdown, row, 0)
        grid.addWidget(self.cmb_books, row, 1)
        grid.addWidget(self.btn_refresh_books, row, 2)
        self.btn_book_select = QPushButton("Selecteer Boek")
        self.btn_book_select.setEnabled(False)
        grid.addWidget(self.btn_book_select, row, 3)
        row += 1
        
        # Auto select checkbox
        self.chk_auto_select_book = QCheckBox("Autoselecteer eerste boek")
        self.chk_auto_select_book.setChecked(False)
        grid.addWidget(self.chk_auto_select_book, row, 0, 1, 2)
        
        group.setLayout(grid)
        group.setVisible(False)  # Verborgen maar functionaliteit behouden
        layout.addWidget(group)
        
    def setup_ui_structure_section(self, layout: QVBoxLayout):
        """Stel UI structuur sectie op"""
        group = QGroupBox("UI Structuur Selectors")
        grid = QGridLayout()
        
        row = 0
        # Greeting selector
        self.lbl_greeting_selector = QLabel("Greeting Selector:")
        self.txt_greeting_selector = QLineEdit()
        self.txt_greeting_selector.setText(".greeting")
        grid.addWidget(self.lbl_greeting_selector, row, 0)
        grid.addWidget(self.txt_greeting_selector, row, 1)
        row += 1
        
        # Sidebar chapter selector
        self.lbl_chapter_selector = QLabel("Chapter Selector:")
        self.txt_chapter_selector = QLineEdit()
        self.txt_chapter_selector.setText(".sidebar .chapter-button")
        grid.addWidget(self.lbl_chapter_selector, row, 0)
        grid.addWidget(self.txt_chapter_selector, row, 1)
        row += 1
        
        # Chapter paragraphs container
        self.lbl_paragraphs_container = QLabel("Paragraphs Container:")
        self.txt_paragraphs_container = QLineEdit()
        self.txt_paragraphs_container.setText(".chapter-children")
        grid.addWidget(self.lbl_paragraphs_container, row, 0)
        grid.addWidget(self.txt_paragraphs_container, row, 1)
        row += 1
        
        # Paragraph button selector
        self.lbl_paragraph_selector = QLabel("Paragraph Button Selector:")
        self.txt_paragraph_selector = QLineEdit()
        self.txt_paragraph_selector.setText(".paragraph-button")
        grid.addWidget(self.lbl_paragraph_selector, row, 0)
        grid.addWidget(self.txt_paragraph_selector, row, 1)
        row += 1
        
        # Learning objectives selector
        self.lbl_objectives_selector = QLabel("Learning Objectives Selector:")
        self.txt_objectives_selector = QLineEdit()
        self.txt_objectives_selector.setText(".learning-objectives")
        grid.addWidget(self.lbl_objectives_selector, row, 0)
        grid.addWidget(self.txt_objectives_selector, row, 1)
        row += 1
        
        # Lesson content selector
        self.lbl_lesson_selector = QLabel("Lesson Content Selector:")
        self.txt_lesson_selector = QLineEdit()
        self.txt_lesson_selector.setText(".lesson-content")
        grid.addWidget(self.lbl_lesson_selector, row, 0)
        grid.addWidget(self.txt_lesson_selector, row, 1)
        row += 1
        
        # Image selector
        self.lbl_image_selector = QLabel("Image Selector:")
        self.txt_image_selector = QLineEdit()
        self.txt_image_selector.setText(".lesson-content img")
        grid.addWidget(self.lbl_image_selector, row, 0)
        grid.addWidget(self.txt_image_selector, row, 1)
        
        group.setLayout(grid)
        group.setVisible(False)  # Verborgen maar functionaliteit behouden
        layout.addWidget(group)
        
    def setup_output_section(self, layout: QVBoxLayout):
        """Stel output configuratie sectie op"""
        group = QGroupBox("Output Configuratie")
        grid = QGridLayout()
        
        row = 0
        # Output directory
        self.lbl_output_dir = QLabel("Output Directory:")
        self.txt_output_dir = QLineEdit()
        self.txt_output_dir.setText(str(Path.home() / "Documents" / "boek-extracts"))
        self.btn_browse_output = QPushButton("Bladeren")
        grid.addWidget(self.lbl_output_dir, row, 0)
        grid.addWidget(self.txt_output_dir, row, 1)
        grid.addWidget(self.btn_browse_output, row, 2)
        row += 1
        
        # Filename template
        self.lbl_filename_template = QLabel("Filename Template:")
        self.txt_filename_template = QLineEdit()
        self.txt_filename_template.setText("{book}_{chapter_index}_{paragraph_index}_{label}.txt")
        grid.addWidget(self.lbl_filename_template, row, 0)
        grid.addWidget(self.txt_filename_template, row, 1)
        row += 1
        
        # Save images checkbox
        self.chk_save_images = QCheckBox("Afbeeldingen opslaan")
        self.chk_save_images.setChecked(False)
        grid.addWidget(self.chk_save_images, row, 0, 1, 2)
        row += 1
        
        # Download videos checkbox (Nieuw)
        self.chk_download_videos = QCheckBox("Video's downloaden")
        self.chk_download_videos.setChecked(False)
        grid.addWidget(self.chk_download_videos, row, 0, 1, 2)
        row += 1
        
        # Export Format (Nieuw)
        self.lbl_export_format = QLabel("Export Formaat:")
        self.cmb_export_format = QComboBox()
        self.cmb_export_format.addItems(["txt", "md", "pdf", "epub"])
        grid.addWidget(self.lbl_export_format, row, 0)
        grid.addWidget(self.cmb_export_format, row, 1)
        row += 1
        
        # Images directory (alleen zichtbaar als save images is aangevinkt)
        self.lbl_images_dir = QLabel("Afbeeldingen Directory:")
        self.txt_images_dir = QLineEdit()
        self.txt_images_dir.setPlaceholderText("Kies een directory voor afbeeldingen...")
        self.btn_browse_images = QPushButton("Bladeren")
        self.lbl_images_dir.setVisible(False)
        self.txt_images_dir.setVisible(False)
        self.btn_browse_images.setVisible(False)
        
        grid.addWidget(self.lbl_images_dir, row, 0)
        grid.addWidget(self.txt_images_dir, row, 1)
        grid.addWidget(self.btn_browse_images, row, 2)
        
        group.setLayout(grid)
        layout.addWidget(group)
        
    def setup_advanced_section(self, layout: QVBoxLayout):
        """Stel geavanceerde instellingen sectie op"""
        group = QGroupBox("Geavanceerde Instellingen")
        grid = QGridLayout()
        
        # Tab widget voor geavanceerde instellingen
        tabs = QTabWidget()
        
        # Browser tab
        browser_tab = QWidget()
        browser_layout = QGridLayout(browser_tab)
        
        row = 0
        self.chk_headless = QCheckBox("Headless modus (geen browser zichtbaar)")
        self.chk_headless.setChecked(False)
        browser_layout.addWidget(self.chk_headless, row, 0, 1, 2)
        row += 1
        
        self.chk_persistent_context = QCheckBox("Behoud browser sessie")
        self.chk_persistent_context.setChecked(True)
        browser_layout.addWidget(self.chk_persistent_context, row, 0, 1, 2)
        row += 1
        
        self.lbl_user_data_dir = QLabel("User Data Directory:")
        self.txt_user_data_dir = QLineEdit()
        self.txt_user_data_dir.setText(str(Path.home() / "AppData" / "Local" / "NoordhoffAgentProfile"))
        browser_layout.addWidget(self.lbl_user_data_dir, row, 0)
        browser_layout.addWidget(self.txt_user_data_dir, row, 1)
        row += 1
        
        self.chk_keep_open_on_error = QCheckBox("Houd browser open na run of bij fouten")
        self.chk_keep_open_on_error.setChecked(True)
        browser_layout.addWidget(self.chk_keep_open_on_error, row, 0, 1, 2)
        row += 1
        
        self.chk_auto_scrape = QCheckBox("Automatisch scrapen na login stappen")
        self.chk_auto_scrape.setChecked(False)
        self.chk_auto_scrape.setToolTip("Indien uitgevinkt, voert de runner alleen de stappen in de tabel uit en wacht dan op nieuwe input.")
        browser_layout.addWidget(self.chk_auto_scrape, row, 0, 1, 2)
        row += 1
        
        # Parallel Mode (Nieuw)
        self.chk_parallel_mode = QCheckBox("Parallel scrapen (sneller, maar risicovoller)")
        self.chk_parallel_mode.setChecked(False)
        browser_layout.addWidget(self.chk_parallel_mode, row, 0, 1, 2)
        row += 1
        
        # Stealth Mode (Nieuw)
        self.chk_use_stealth = QCheckBox("Stealth Mode (voorkom bot-detectie)")
        self.chk_use_stealth.setChecked(True)
        browser_layout.addWidget(self.chk_use_stealth, row, 0, 1, 2)
        row += 1
        
        # CDP Tab (nieuw)
        cdp_tab = QWidget()
        cdp_layout = QGridLayout(cdp_tab)
        
        row = 0
        self.chk_attach_to_existing = QCheckBox("Verbind met bestaande Chrome instance (via CDP)")
        self.chk_attach_to_existing.setChecked(False)
        cdp_layout.addWidget(self.chk_attach_to_existing, row, 0, 1, 2)
        row += 1
        
        self.lbl_cdp_url = QLabel("CDP URL:")
        self.txt_cdp_url = QLineEdit()
        self.txt_cdp_url.setText("http://localhost:9222")
        self.txt_cdp_url.setPlaceholderText("http://localhost:9222")
        cdp_layout.addWidget(self.lbl_cdp_url, row, 0)
        cdp_layout.addWidget(self.txt_cdp_url, row, 1)
        row += 1
        
        self.lbl_cdp_info = QLabel("Tip: Start Chrome met parameter: --remote-debugging-port=9222")
        self.lbl_cdp_info.setStyleSheet("color: #888; font-style: italic;")
        cdp_layout.addWidget(self.lbl_cdp_info, row, 0, 1, 2)
        
        tabs.addTab(browser_tab, "Browser")
        tabs.addTab(cdp_tab, "Bestaande Chrome")
        
        # Timeouts tab
        timeouts_tab = QWidget()
        timeouts_layout = QGridLayout(timeouts_tab)
        
        row = 0
        self.lbl_navigation_timeout = QLabel("Navigation Timeout (ms):")
        self.spin_navigation_timeout = QLineEdit()
        self.spin_navigation_timeout.setText("15000")
        timeouts_layout.addWidget(self.lbl_navigation_timeout, row, 0)
        timeouts_layout.addWidget(self.spin_navigation_timeout, row, 1)
        row += 1
        
        self.lbl_selector_timeout = QLabel("Selector Timeout (ms):")
        self.spin_selector_timeout = QLineEdit()
        self.spin_selector_timeout.setText("8000")
        timeouts_layout.addWidget(self.lbl_selector_timeout, row, 0)
        timeouts_layout.addWidget(self.spin_selector_timeout, row, 1)
        
        tabs.addTab(timeouts_tab, "Timeouts")
        
        # Retry policy tab
        retry_tab = QWidget()
        retry_layout = QGridLayout(retry_tab)
        
        row = 0
        self.lbl_click_attempts = QLabel("Click Attempts:")
        self.spin_click_attempts = QLineEdit()
        self.spin_click_attempts.setText("2")
        retry_layout.addWidget(self.lbl_click_attempts, row, 0)
        retry_layout.addWidget(self.spin_click_attempts, row, 1)
        row += 1
        
        self.lbl_click_delay = QLabel("Click Delay (ms):")
        self.spin_click_delay = QLineEdit()
        self.spin_click_delay.setText("500")
        retry_layout.addWidget(self.lbl_click_delay, row, 0)
        retry_layout.addWidget(self.spin_click_delay, row, 1)
        
        tabs.addTab(retry_tab, "Retry Policy")
        
        grid.addWidget(tabs, 0, 0)
        group.setLayout(grid)
        layout.addWidget(group)
        
    def setup_connections(self):
        """Stel signal-slot verbindingen op"""
        # Button connections
        if hasattr(self, 'btn_run_toggle'):
            self.btn_run_toggle.clicked.connect(self.toggle_run)
        
        # Voor backward compatibility als andere delen nog naar btn_start of btn_stop zoeken
        if not hasattr(self, 'btn_start'):
            self.btn_start = self.btn_run_toggle
        if not hasattr(self, 'btn_stop'):
            self.btn_stop = self.btn_run_toggle

        self.btn_browse_output.clicked.connect(self.browse_output_dir)
        self.btn_browse_images.clicked.connect(self.browse_images_dir)
        self.btn_test_selectors.clicked.connect(self.open_selector_tester)
        self.btn_install_browsers.clicked.connect(self.install_browsers)
        self.btn_refresh_books.clicked.connect(self.refresh_books)
        self.btn_book_select.clicked.connect(self.on_book_selected)
        self.btn_focus_and_start.clicked.connect(self.on_focus_and_start_clicked)
        
        # Checkbox connections
        self.chk_save_images.stateChanged.connect(self.toggle_images_dir)
        self.chk_persistent_context.stateChanged.connect(self.toggle_user_data_dir)
        self.chk_use_login_steps.stateChanged.connect(self.toggle_login_fields)
        self.chk_attach_to_existing.stateChanged.connect(self.toggle_cdp_fields)
        
        # Auto-save triggers
        self.txt_url.textChanged.connect(self.auto_save_state)
        self.txt_username_value.textChanged.connect(self.auto_save_state)
        self.txt_target_books.textChanged.connect(self.auto_save_state)
        self.txt_target_chapters.textChanged.connect(self.auto_save_state)
        self.txt_target_paragraphs.textChanged.connect(self.auto_save_state)
        self.login_steps_table.itemChanged.connect(self.auto_save_state)
        
        # Live sync: Connect table changes to sync if running
        self.login_steps_table.itemChanged.connect(self.on_table_data_changed)
        # Also connect to row additions/removals if possible
        model = self.login_steps_table.model()
        model.rowsInserted.connect(lambda: (self.on_table_data_changed(None), self.auto_save_state()))
        model.rowsRemoved.connect(lambda: (self.on_table_data_changed(None), self.auto_save_state()))
        model.dataChanged.connect(lambda: (self.on_table_data_changed(None), self.auto_save_state()))
        
        # Initial state
        self.toggle_login_fields()
        self.toggle_images_dir()
        self.toggle_user_data_dir()

        # Load last state on startup
        QTimer.singleShot(100, self.load_last_state)

        # Ensure new login table exists before connecting any signals that might use it
        try:
            # If table exists, ensure selection behavior is reasonable
            self.login_steps_table.setSelectionBehavior(self.login_steps_table.SelectionBehavior.SelectRows)
        except Exception:
            pass
        
    def refresh_presets_list(self):
        """Vernieuw de lijst met presets in de dropdown"""
        if not hasattr(self, 'cmb_presets'):
            return
        self.cmb_presets.clear()
        presets = self.config_manager.list_presets()
        self.cmb_presets.addItems(presets)

    def new_preset(self):
        """Maak een nieuwe lege preset aan door de UI te resetten"""
        reply = QMessageBox.question(
            self, "Nieuwe Preset",
            "Weet u zeker dat u een nieuwe preset wilt maken? Alle niet-opgeslagen wijzigingen gaan verloren.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            # Reset naar basis configuratie
            from config.config_manager import ScraperConfig
            # Gebruik een lege start_url als basis
            empty_config = ScraperConfig(start_url="https://")
            self.set_config(empty_config)
            
            # Reset dropdown selectie
            self.cmb_presets.setCurrentIndex(-1)
            self.statusBar().showMessage("Nieuwe configuratie gestart", 3000)

    def save_current_as_preset(self):
        """Sla de huidige configuratie op als een nieuwe preset"""
        name, ok = QInputDialog.getText(self, "Preset Opslaan", "Naam voor preset:")
        if ok and name:
            # Check of preset al bestaat
            existing_presets = self.config_manager.list_presets()
            if name in existing_presets:
                reply = QMessageBox.question(
                    self, "Preset Overschrijven",
                    f"Preset '{name}' bestaat al. Wilt u deze overschrijven?",
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
                )
                if reply == QMessageBox.StandardButton.No:
                    return

            config = self.get_current_config()
            self.config_manager.save_preset(name, config)
            self.refresh_presets_list()
            # Selecteer de nieuwe preset in de dropdown
            index = self.cmb_presets.findText(name)
            if index >= 0:
                self.cmb_presets.setCurrentIndex(index)
            self.statusBar().showMessage(f"Preset '{name}' opgeslagen", 3000)

    def delete_selected_preset(self):
        """Verwijder de geselecteerde preset"""
        name = self.cmb_presets.currentText()
        if not name:
            return
            
        reply = QMessageBox.question(
            self, "Preset Verwijderen",
            f"Weet u zeker dat u preset '{name}' wilt verwijderen?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            if self.config_manager.delete_preset(name):
                self.refresh_presets_list()
                self.statusBar().showMessage(f"Preset '{name}' verwijderd", 3000)
            else:
                QMessageBox.critical(self, "Fout", f"Kon preset '{name}' niet verwijderen")

    def duplicate_selected_preset(self):
        """Dupliceer de geselecteerde preset"""
        name = self.cmb_presets.currentText()
        if not name:
            return
            
        new_name, ok = QInputDialog.getText(
            self, "Preset Dupliceren", 
            "Naam voor nieuwe preset:", 
            text=f"{name}_copy"
        )
        
        if ok and new_name:
            # Check of preset al bestaat
            existing_presets = self.config_manager.list_presets()
            if new_name in existing_presets:
                reply = QMessageBox.question(
                    self, "Preset Overschrijven",
                    f"Preset '{new_name}' bestaat al. Wilt u deze overschrijven?",
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
                )
                if reply == QMessageBox.StandardButton.No:
                    return

            # Laad de geselecteerde preset data
            config = self.config_manager.load_preset(name)
            if config:
                self.config_manager.save_preset(new_name, config)
                self.refresh_presets_list()
                # Selecteer de nieuwe preset
                index = self.cmb_presets.findText(new_name)
                if index >= 0:
                    self.cmb_presets.setCurrentIndex(index)
                self.statusBar().showMessage(f"Preset '{name}' gedupliceerd als '{new_name}'", 3000)
            else:
                QMessageBox.critical(self, "Fout", f"Kon preset '{name}' niet laden voor duplicatie")

    def load_selected_preset(self):
        """Laad de geselecteerde preset uit de dropdown"""
        name = self.cmb_presets.currentText()
        if name:
            try:
                config = self.config_manager.load_preset(name)
                self.set_config(config)
                self.statusBar().showMessage(f"Preset '{name}' geladen", 3000)
            except Exception as e:
                QMessageBox.critical(self, "Fout", f"Kon preset niet laden: {e}")

    def auto_save_state(self, *args):
        """Sla de huidige staat automatisch op"""
        # We gebruiken een kleine delay om te voorkomen dat we bij elke toetsaanslag opslaan
        if not hasattr(self, '_auto_save_timer'):
            self._auto_save_timer = QTimer()
            self._auto_save_timer.setSingleShot(True)
            self._auto_save_timer.timeout.connect(self._do_auto_save)
        
        self._auto_save_timer.start(2000) # Wacht 2 seconden na laatste wijziging

    def _do_auto_save(self):
        """Voer de daadwerkelijke auto-save uit"""
        try:
            config = self.get_current_config()
            self.config_manager.save_last_state(config)
            from datetime import datetime
            self.statusBar().showMessage(f"Status: Automatisch opgeslagen ({datetime.now().strftime('%H:%M:%S')})", 3000)
        except:
            pass # Silent failure for auto-save

    def load_last_state(self):
        """Laad de laatste opgeslagen staat"""
        config = self.config_manager.load_last_state()
        if config:
            self.set_config(config)
            self.statusBar().showMessage("Laatste staat hersteld", 3000)
        
    def setup_logger(self):
        """Stel logger in voor GUI logging"""
        self.logger = Logger("NoordhoffScraperGUI")
        qt_handler = self.logger.get_qt_handler()
        qt_handler.log_signal.connect(self.handle_log_message)
        
    def handle_log_message(self, message: str, level):
        """Verwerk log berichten voor GUI weergave.
        Ondersteunt zowel logger (int levels) als runner (str levels)."""
        # Limiteer log regels voor geheugenbeheer bij HEEL VEEL data/langdurige sessies
        if self.log_text.document().blockCount() > 1000:
            cursor = self.log_text.textCursor()
            cursor.movePosition(QTextCursor.MoveOperation.Start)
            cursor.movePosition(QTextCursor.MoveOperation.Down, QTextCursor.MoveMode.KeepAnchor, 100)
            cursor.removeSelectedText()

        # Runner emits string levels like "INFO", "ERROR"
        try:
            if isinstance(level, int):
                cursor = self.log_text.textCursor()
                cursor.movePosition(QTextCursor.MoveOperation.End)
                if level >= 40:
                    color = "#ff4444"
                elif level >= 30:
                    color = "#ffaa00"
                elif level >= 20:
                    color = "#4444ff"
                else:
                    color = "#666666"
                self.log_text.setTextColor(QColor(color))
                cursor.insertText(f"{message}\n")
                self.log_text.setTextCursor(cursor)
                self.log_text.ensureCursorVisible()
            else:
                # assume string level from runner
                try:
                    self.log_text.append_log(message, level)
                except Exception:
                    # fallback to plain append
                    self.log_text.append(f"[{level}] {message}")

                if isinstance(level, str) and level in ["ERROR", "WARNING"]:
                    self.statusBar().showMessage(message, 5000)
        except Exception:
            # ensure logging doesn't crash UI
            try:
                self.log_text.append(message)
            except Exception:
                pass
    
    def _setup_templates_menu(self):
        """Configureer het sjablonen menu voor veelgebruikte login stappen"""
        menu = QMenu(self)
        
        # Individuele stappen
        step_menu = menu.addMenu("✨ Losse Stappen")
        
        actions = [
            ("Wacht 2 seconden", "wait", "", "", "2000"),
            ("Klik op Element", "click", "button", "", "1000"),
            ("Vul tekst in", "fill", "input", "waarde", "500"),
            ("Scroll naar beneden", "scroll", "", "500", "500"),
            ("Screenshot maken", "screenshot", "", "stap_screenshot", "0"),
        ]
        
        for label, action, selector, value, wait in actions:
            act = QAction(label, self)
            act.triggered.connect(lambda checked, a=action, s=selector, v=value, w=wait: 
                                 self.add_login_step(action=a, selector=s, value=v, wait_ms=w))
            step_menu.addAction(act)
            
        menu.addSeparator()
        
        # Sequenties (meerdere stappen)
        seq_menu = menu.addMenu("📚 Sequenties")
        
        sequences = [
            ("Noordhoff Login Flow", [
                ("fill", "#email", "gebruikersnaam", "500"),
                ("fill", "#password", "wachtwoord", "500"),
                ("click", "button[type='submit']", "", "2000")
            ]),
            ("Pagina Navigatie", [
                ("click", ".next-button", "", "1000"),
                ("wait", "", "", "2000"),
                ("scroll", "", "1000", "500")
            ]),
            ("Loop Structuur", [
                ("loop_books", "", "", "0"),
                ("loop_chapters", "", "", "0"),
                ("loop_paragraphs", "", "", "0"),
                ("end_loop", "", "", "0")
            ])
        ]
        
        for label, steps in sequences:
            act = QAction(label, self)
            act.triggered.connect(lambda checked, s=steps: self._add_sequence(s))
            seq_menu.addAction(act)
            
        self.btn_templates.setMenu(menu)

    def _add_sequence(self, steps):
        """Voegt een reeks stappen toe aan de tabel"""
        for action, selector, value, wait in steps:
            self.add_login_step(action=action, selector=selector, value=value, wait_ms=wait)
        self.statusBar().showMessage(f"{len(steps)} stappen toegevoegd uit sjabloon", 3000)

    def highlight_step(self, index: int, status: str = "running"):
        """Highlight de rij in de tabel met een status-specifieke kleur en status tekst"""
        self.clear_step_highlights()
        if index < self.login_steps_table.rowCount():
            # Kies kleur en icoon op basis van status
            status_data = {
                "running": {"color": "#fff59d", "icon": "⏳"}, # Helder geel
                "success": {"color": "#c8e6c9", "icon": "✅"}, # Licht groen
                "error": {"color": "#ffccbc", "icon": "❌"}     # Licht rood
            }
            data = status_data.get(status, status_data["running"])
            color_code = data["color"]
            icon = data["icon"]
            
            # Update status kolom
            status_item = self.login_steps_table.item(index, 0)
            if not status_item:
                status_item = QTableWidgetItem(icon)
                status_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
                self.login_steps_table.setItem(index, 0, status_item)
            else:
                status_item.setText(icon)
            
            for col in range(self.login_steps_table.columnCount()):
                item = self.login_steps_table.item(index, col)
                if item:
                    item.setBackground(QColor(color_code))
                else:
                    widget = self.login_steps_table.cellWidget(index, col)
                    if widget:
                        # Behoud bestaande styles maar voeg achtergrond toe
                        current_style = widget.styleSheet()
                        if f"background-color: {color_code}" not in current_style:
                            widget.setStyleSheet(f"{current_style} background-color: {color_code};")
            
            # Scroll naar de actieve rij
            self.login_steps_table.scrollToItem(self.login_steps_table.item(index, 0))

    def finish_step(self, index: int, success: bool):
        """Update de rij highlight op basis van succes/fout"""
        self.highlight_step(index, "success" if success else "error")

    def clear_step_highlights(self):
        """Verwijder alle highlights en status iconen uit de tabel"""
        for row in range(self.login_steps_table.rowCount()):
            # Reset status kolom
            status_item = self.login_steps_table.item(row, 0)
            if status_item:
                status_item.setText("")
            
            for col in range(self.login_steps_table.columnCount()):
                item = self.login_steps_table.item(row, col)
                if item:
                    item.setBackground(QColor("transparent"))
                else:
                    widget = self.login_steps_table.cellWidget(row, col)
                    if widget:
                        widget.setStyleSheet("")

    def _create_step_controls(self, row: int) -> QWidget:
        """Maak een widget met actie-knoppen voor een rij in de tabel"""
        widget = QWidget()
        layout = QHBoxLayout(widget)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(4)
        
        btn_up = QPushButton("↑")
        btn_up.setFixedWidth(25)
        btn_up.setToolTip("Stap omhoog")
        btn_up.clicked.connect(lambda checked, r=row: self.move_step_to_row(r, "up"))
        
        btn_down = QPushButton("↓")
        btn_down.setFixedWidth(25)
        btn_down.setToolTip("Stap omlaag")
        btn_down.clicked.connect(lambda checked, r=row: self.move_step_to_row(r, "down"))
        
        btn_del = QPushButton("×")
        btn_del.setFixedWidth(25)
        btn_del.setToolTip("Stap verwijderen")
        btn_del.setStyleSheet("background-color: #ff4444; color: white; font-weight: bold;")
        btn_del.clicked.connect(lambda checked, r=row: self.remove_step_at_row(r))
        
        layout.addWidget(btn_up)
        layout.addWidget(btn_down)
        layout.addWidget(btn_del)
        layout.addStretch()
        
        return widget

    def move_step_to_row(self, current_row: int, direction: str):
        """Verplaats een stap op basis van een specifieke rij"""
        steps = self.get_login_steps_from_ui()
        if not steps:
            return

        new_row = current_row
        if direction == "up" and current_row > 0:
            steps[current_row], steps[current_row-1] = steps[current_row-1], steps[current_row]
            new_row = current_row - 1
        elif direction == "down" and current_row < len(steps) - 1:
            steps[current_row], steps[current_row+1] = steps[current_row+1], steps[current_row]
            new_row = current_row + 1
        else:
            return

        self.set_login_steps_to_ui(steps)
        self.login_steps_table.setCurrentCell(new_row, 1)
        self.auto_save_state()

    def remove_step_at_row(self, row: int):
        """Verwijder een specifieke stap"""
        steps = self.get_login_steps_from_ui()
        if 0 <= row < len(steps):
            steps.pop(row)
            self.set_login_steps_to_ui(steps)
            self.auto_save_state()

    def add_login_step(self, action="click", selector="", value="", wait_ms=1000):
        """Voeg nieuwe login stap toe aan tabel"""
        steps = self.get_login_steps_from_ui()
        steps.append({
            "action": action,
            "selector": selector,
            "value": value,
            "wait_after_ms": int(wait_ms) if str(wait_ms).isdigit() else 1000,
            "expected_element": "",
            "indices": None
        })
        self.set_login_steps_to_ui(steps)
        self.auto_save_state()

    def open_indices_helper(self, row: int):
        """Helper om indices in te vullen voor een specifieke rij"""
        action_widget = self.login_steps_table.cellWidget(row, 1)
        if not action_widget:
            return
            
        action = action_widget.currentText()
        
        # Bepaal welke globale waarde we kunnen voorstellen
        suggestion = ""
        if "book" in action.lower():
            suggestion = self.txt_target_books.text()
        elif "chapter" in action.lower():
            suggestion = self.txt_target_chapters.text()
        elif "paragraph" in action.lower():
            suggestion = self.txt_target_paragraphs.text()
            
        # Haal de huidige waarde op
        indices_widget = self.login_steps_table.cellWidget(row, 6)
        current_val = ""
        if indices_widget:
            line_edit = indices_widget.findChild(QLineEdit)
            if line_edit:
                current_val = line_edit.text()
        
        # Toon input dialoog
        text, ok = QInputDialog.getText(
            self, 
            "Indices Helper", 
            f"Voer indices in voor actie '{action}':\n(Bijv: 0, 1, 2-5)",
            text=current_val or suggestion
        )
        
        if ok:
            if indices_widget:
                line_edit = indices_widget.findChild(QLineEdit)
                if line_edit:
                    line_edit.setText(text)
                    self.auto_save_state()

    def remove_login_step(self):
        """Verwijder geselecteerde login stap"""
        current_row = self.login_steps_table.currentRow()
        if current_row >= 0:
            self.remove_step_at_row(current_row)

    def move_login_step_up(self):
        """Verplaats stap omhoog"""
        current_row = self.login_steps_table.currentRow()
        if current_row > 0:
            self.move_step_to_row(current_row, "up")

    def move_login_step_down(self):
        """Verplaats stap omlaag"""
        current_row = self.login_steps_table.currentRow()
        if current_row < self.login_steps_table.rowCount() - 1:
            self.move_step_to_row(current_row, "down")

    def _swap_login_steps(self, row1: int, row2: int):
        """DEPRECATED: Gebruik move_step_to_row voor veilige verplaatsing met lambda bindings"""
        self.move_step_to_row(row1, "up" if row2 < row1 else "down")

    def show_login_steps_context_menu(self, position):
        """Toon context menu voor login stappen tabel"""
        menu = QMenu()
        
        add_action = QAction("Stap Toevoegen", self)
        add_action.triggered.connect(self.add_login_step)
        menu.addAction(add_action)
        
        if self.login_steps_table.selectedItems():
            remove_action = QAction("Stap Verwijderen", self)
            remove_action.triggered.connect(self.remove_login_step)
            menu.addAction(remove_action)
            
            test_action = QAction("Test Deze Stap", self)
            test_action.triggered.connect(self.test_selected_login_step)
            menu.addAction(test_action)
        
        menu.exec(self.login_steps_table.viewport().mapToGlobal(position))

    def test_selected_login_step(self):
        """Test de geselecteerde login stap"""
        selected_items = self.login_steps_table.selectedItems()
        if not selected_items:
            return
        
        row = selected_items[0].row()
        
        # Haal stap informatie op
        action_widget = self.login_steps_table.cellWidget(row, 0)
        selector_item = self.login_steps_table.item(row, 1)
        value_item = self.login_steps_table.item(row, 2)
        
        if not selector_item:
            QMessageBox.warning(self, "Fout", "Selector is verplicht")
            return
        
        action = action_widget.currentText() if action_widget else ""
        selector = selector_item.text()
        value = value_item.text() if value_item else ""
        
        # Toon test dialoog
        QMessageBox.information(
            self,
            "Test Login Stap",
            f"Stap zou worden uitgevoerd:\n\n"
            f"Actie: {action}\n"
            f"Selector: {selector}\n"
            f"Waarde: {'***' if 'password' in selector.lower() else value}"
        )

    def get_login_steps_from_ui(self):
        """Haal login stappen op uit UI"""
        steps = []
        from utils.helpers import parse_indices
        
        for row in range(self.login_steps_table.rowCount()):
            # Haal widgets op (Nieuwe kolom-indices)
            action_widget = self.login_steps_table.cellWidget(row, 1)
            selector_item = self.login_steps_table.item(row, 2)
            value_item = self.login_steps_table.item(row, 3)
            wait_widget = self.login_steps_table.cellWidget(row, 4)
            expected_item = self.login_steps_table.item(row, 5)
            indices_widget = self.login_steps_table.cellWidget(row, 6)
            indices_str = ""
            if indices_widget:
                line_edit = indices_widget.findChild(QLineEdit)
                if line_edit:
                    indices_str = line_edit.text()
            
            indices = parse_indices(indices_str) if indices_str else None
            
            step = {
                "action": action_widget.currentText() if action_widget else "click",
                "selector": selector_item.text() if selector_item else "",
                "value": value_item.text() if value_item else None,
                "wait_after_ms": wait_widget.value() if wait_widget else 1000,
                "expected_element": expected_item.text() if expected_item else None,
                "indices": indices
            }
            
            steps.append(step)
        
        return steps

    def set_login_steps_to_ui(self, steps):
        """Stel login stappen in UI"""
        self.login_steps_table.setRowCount(0)
        
        for step in steps:
            row = self.login_steps_table.rowCount()
            self.login_steps_table.insertRow(row)
            
            # Status (Kolom 0)
            item_status = QTableWidgetItem("")
            item_status.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            self.login_steps_table.setItem(row, 0, item_status)

            # Actie dropdown (Kolom 1)
            combo_action = QComboBox()
            combo_action.addItems(["click", "fill", "wait", "scrape", "loop_books", "loop_chapters", "loop_paragraphs", "end_loop"])
            combo_action.setCurrentText(step.get("action", "click"))
            self.login_steps_table.setCellWidget(row, 1, combo_action)
            
            # Selector (Kolom 2)
            item_selector = QTableWidgetItem(step.get("selector", ""))
            self.login_steps_table.setItem(row, 2, item_selector)
            
            # Waarde (Kolom 3)
            item_value = QTableWidgetItem(step.get("value", ""))
            self.login_steps_table.setItem(row, 3, item_value)
            
            # Wacht tijd (Kolom 4)
            spin_wait = QSpinBox()
            spin_wait.setRange(0, 60000) # Verhoogd bereik naar 60s
            spin_wait.setValue(step.get("wait_after_ms", 1000))
            spin_wait.setSuffix(" ms")
            self.login_steps_table.setCellWidget(row, 4, spin_wait)
            
            # Verwacht element (Kolom 5)
            item_expected = QTableWidgetItem(step.get("expected_element", ""))
            self.login_steps_table.setItem(row, 5, item_expected)

            # Indices (Kolom 6)
            indices = step.get("indices")
            indices_str = ""
            if indices and isinstance(indices, list):
                indices_str = ", ".join(map(str, indices))
            
            indices_widget = QWidget()
            indices_layout = QHBoxLayout(indices_widget)
            indices_layout.setContentsMargins(2, 2, 2, 2)
            indices_layout.setSpacing(2)
            
            line_edit = QLineEdit(indices_str)
            line_edit.setPlaceholderText("Bijv: 0, 1, 2-5")
            
            btn_helper = QPushButton("...")
            btn_helper.setFixedWidth(30)
            btn_helper.clicked.connect(lambda checked, r=row: self.open_indices_helper(r))
            
            indices_layout.addWidget(line_edit)
            indices_layout.addWidget(btn_helper)
            
            self.login_steps_table.setCellWidget(row, 6, indices_widget)

            # Acties (Kolom 7)
            self.login_steps_table.setCellWidget(row, 7, self._create_step_controls(row))

    def on_table_data_changed(self, item):
        """Wanneer data in de tabel verandert, stuur update naar runner indien actief"""
        if self.is_running and self.runner:
            self.logger.info("Tabel gewijzigd, runner bijwerken...")
            config = self.get_current_config()
            self.runner.update_config(config)
        
    def get_stylesheet(self) -> str:
        """Retourneer CSS stylesheet voor de applicatie (dark mode)"""
        return """
        QMainWindow {
            background-color: #2b2b2b;
            color: white;
        }
        QGroupBox {
            font-weight: bold;
            border: 1px solid #555;
            border-radius: 5px;
            margin-top: 10px;
            padding-top: 10px;
            color: white;
        }
        QGroupBox::title {
            subcontrol-origin: margin;
            left: 10px;
            padding: 0 5px 0 5px;
            color: white;
        }
        QPushButton {
            background-color: #4a86e8;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 3px;
            font-weight: bold;
        }
        QPushButton:hover {
            background-color: #3a76d8;
        }
        QPushButton:disabled {
            background-color: #555;
            color: #888;
        }
        QPushButton#btn_stop {
            background-color: #e84a4a;
        }
        QPushButton#btn_stop:hover {
            background-color: #d83a3a;
        }
        QLineEdit {
            padding: 5px;
            border: 1px solid #555;
            border-radius: 3px;
            background-color: #3b3b3b;
            color: white;
        }
        QLineEdit:focus {
            border: 1px solid #4a86e8;
        }
        QCheckBox {
            padding: 5px;
            color: white;
        }
        QLabel {
            padding: 2px;
            color: white;
        }
        QTextEdit {
            border: 1px solid #555;
            border-radius: 3px;
            font-family: Consolas, monospace;
            font-size: 12px;
            background-color: #3b3b3b;
            color: white;
        }
        QTabWidget::pane {
            border: 1px solid #555;
            background-color: #2b2b2b;
        }
        QTabBar::tab {
            background-color: #3b3b3b;
            padding: 5px 15px;
            margin-right: 2px;
            color: white;
        }
        QTabBar::tab:selected {
            background-color: #4b4b4b;
        }
        QProgressBar {
            border: 1px solid #555;
            border-radius: 3px;
            background-color: #3b3b3b;
            color: white;
            text-align: center;
        }
        QProgressBar::chunk {
            background-color: #4a86e8;
            width: 10px;
        }
        QTableWidget {
            background-color: #3b3b3b;
            color: white;
            border: 1px solid #555;
        }
        QTableWidget::item {
            background-color: #3b3b3b;
            color: white;
        }
        QTableWidget::item:selected {
            background-color: #4a86e8;
        }
        QHeaderView::section {
            background-color: #4b4b4b;
            color: white;
            border: 1px solid #555;
        }
        QComboBox {
            background-color: #3b3b3b;
            color: white;
            border: 1px solid #555;
            border-radius: 3px;
        }
        QComboBox::drop-down {
            border: none;
        }
        QComboBox::down-arrow {
            image: none;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 4px solid white;
        }
        """
        
    def toggle_login_fields(self):
        """Toon/verberg login velden gebaseerd op toggle"""
        use_steps = self.chk_use_login_steps.isChecked()
        self.steps_container.setVisible(use_steps)
        self.simple_login_group.setVisible(not use_steps)
        
    def toggle_cdp_fields(self):
        """Enable/disable CDP velden"""
        enabled = self.chk_attach_to_existing.isChecked()
        self.txt_cdp_url.setEnabled(enabled)
        
    def toggle_images_dir(self):
        """Toon/verberg afbeeldingen directory velden"""
        enabled = self.chk_save_images.isChecked()
        
        self.lbl_images_dir.setVisible(enabled)
        self.txt_images_dir.setVisible(enabled)
        self.btn_browse_images.setVisible(enabled)
        
    def toggle_user_data_dir(self):
        """Toon/verberg user data directory velden"""
        enabled = self.chk_persistent_context.isChecked()
        
        self.lbl_user_data_dir.setEnabled(enabled)
        self.txt_user_data_dir.setEnabled(enabled)
        
    def browse_output_dir(self):
        """Open directory browser voor output"""
        directory = QFileDialog.getExistingDirectory(
            self, 
            "Selecteer Output Directory",
            self.txt_output_dir.text() or str(Path.home())
        )
        if directory:
            self.txt_output_dir.setText(directory)
            
    def browse_images_dir(self):
        """Open directory browser voor afbeeldingen"""
        directory = QFileDialog.getExistingDirectory(
            self,
            "Selecteer Afbeeldingen Directory",
            self.txt_images_dir.text() or str(Path.home())
        )
        if directory:
            self.txt_images_dir.setText(directory)
            
    def open_selector_tester(self):
        """Open selector tester dialoog"""
        url = self.txt_url.text()
        if not url:
            QMessageBox.warning(self, "Waarschuwing", "Voer eerst een URL in")
            return
            
        dialog = SelectorTesterDialog(url, self)
        dialog.exec()
        
    def install_browsers(self):
        """Installeer Playwright browsers"""
        self.logger.info("Playwright browsers installeren...")
        self.statusBar().showMessage("Playwright browsers installeren...")
        
        import subprocess
        try:
            result = subprocess.run(
                ["python", "-m", "playwright", "install", "chromium"],
                capture_output=True,
                text=True,
                encoding="utf-8"
            )
            
            if result.returncode == 0:
                self.logger.info("Playwright browsers succesvol geïnstalleerd")
                QMessageBox.information(
                    self, 
                    "Succes", 
                    "Playwright browsers zijn succesvol geïnstalleerd"
                )
            else:
                error_msg = result.stderr or "Onbekende fout"
                self.logger.error(f"Installatie mislukt: {error_msg}")
                QMessageBox.critical(
                    self,
                    "Fout",
                    f"Installatie mislukt:\n{error_msg}"
                )
                
        except Exception as e:
            self.logger.error(f"Uitzondering tijdens installatie: {str(e)}")
            QMessageBox.critical(
                self,
                "Fout",
                f"Kon Playwright niet installeren: {str(e)}"
            )
            
        self.statusBar().showMessage("Klaar")
        
    def refresh_books(self):
        """Vernieuw beschikbare boeken lijst"""
        self.logger.info("Boekenlijst vernieuwen...")
        # Deze functionaliteit wordt geïmplementeerd in de runner
        
    def save_config(self):
        """Sla configuratie op naar bestand"""
        try:
            config = self.get_current_config()
            errors = self.config_manager.validate_config(config)
            
            if errors:
                QMessageBox.warning(
                    self,
                    "Validatie Fouten",
                    "\n".join(errors)
                )
                return
                
            filepath, _ = QFileDialog.getSaveFileName(
                self,
                "Configuratie Opslaan",
                str(Path.home() / "noordhoff_config.json"),
                "JSON Files (*.json)"
            )
            
            if filepath:
                save_creds = self.chk_save_credentials.isChecked()
                self.config_manager.save_config(config, filepath, save_creds)
                self.logger.info(f"Configuratie opgeslagen: {filepath}")
                QMessageBox.information(
                    self,
                    "Succes",
                    f"Configuratie opgeslagen in:\n{filepath}"
                )
                
        except Exception as e:
            self.logger.error(f"Fout bij opslaan config: {str(e)}")
            QMessageBox.critical(
                self,
                "Fout",
                f"Kon configuratie niet opslaan:\n{str(e)}"
            )
            
    def load_config(self):
        """Laad configuratie van bestand"""
        try:
            filepath, _ = QFileDialog.getOpenFileName(
                self,
                "Configuratie Laden",
                str(Path.home()),
                "JSON Files (*.json)"
            )
            
            if filepath:
                config = self.config_manager.load_config(filepath)
                self.set_config(config)
                self.logger.info(f"Configuratie geladen: {filepath}")
                QMessageBox.information(
                    self,
                    "Succes",
                    f"Configuratie geladen van:\n{filepath}"
                )
                
        except Exception as e:
            self.logger.error(f"Fout bij laden config: {str(e)}")
            QMessageBox.critical(
                self,
                "Fout",
                f"Kon configuratie niet laden:\n{str(e)}"
            )
            
    def get_current_config(self) -> ScraperConfig:
        """Haal huidige configuratie op vanuit UI velden - GEÜPDATEE VERSIE"""
        from config.config_manager import (
            ScraperConfig, LoginConfig, BookSelectionConfig,
            UIStructureConfig, OutputConfig, BrowserConfig,
            TimeoutsConfig, RetryPolicyConfig, LoginStep, UIConfig,
            TargetConfig
        )

        # Haal login stappen op
        login_steps_data = self.get_login_steps_from_ui()
        login_steps = [LoginStep(**step) for step in login_steps_data]

        login_config = LoginConfig(
            use_login=True,
            username_selector=self.txt_username_selector.text(),
            password_selector=self.txt_password_selector.text(),
            submit_selector=self.txt_submit_selector.text(),
            username_value=self.txt_username_value.text(),
            password_value=self.txt_password_value.text() or None,
            login_steps=login_steps,
            school_login_button_selector=None,
            school_name_selector=None,
            school_name_value=None
        )

        book_selection_config = BookSelectionConfig(
            book_list_selector=self.txt_book_list_selector.text(),
            book_item_title_selector=self.txt_book_title_selector.text(),
            book_item_click_selector="self"
        )

        ui_structure_config = UIStructureConfig(
            greeting_selector=self.txt_greeting_selector.text(),
            sidebar_chapter_selector=self.txt_chapter_selector.text(),
            chapter_paragraphs_container_selector=self.txt_paragraphs_container.text(),
            paragraph_button_selector=self.txt_paragraph_selector.text(),
            learning_objectives_selector=self.txt_objectives_selector.text(),
            start_assignments_button_selector="button.start-opdrachten",
            assignments_sidebar_item_selector=".assignments .nav-item",
            lesson_content_selector=self.txt_lesson_selector.text(),
            image_selector=self.txt_image_selector.text()
        )

        output_config = OutputConfig(
            output_dir=self.txt_output_dir.text(),
            filename_template=self.txt_filename_template.text(),
            manifest_filename="manifest.json",
            save_images=self.chk_save_images.isChecked(),
            export_format=self.cmb_export_format.currentText(),
            download_videos=self.chk_download_videos.isChecked()
        )

        browser_config = BrowserConfig(
            headless=self.chk_headless.isChecked(),
            use_persistent_context=self.chk_persistent_context.isChecked(),
            user_data_dir=self.txt_user_data_dir.text() if self.chk_persistent_context.isChecked() else "",
            attach_to_existing=self.chk_attach_to_existing.isChecked(),
            cdp_url=self.txt_cdp_url.text(),
            keep_open_on_error=self.chk_keep_open_on_error.isChecked(),
            resume_mode=getattr(self, '_resume_mode', False),
            parallel_mode=self.chk_parallel_mode.isChecked(),
            use_stealth=self.chk_use_stealth.isChecked()
        )

        timeouts_config = TimeoutsConfig(
            navigation=int(self.spin_navigation_timeout.text()),
            selector=int(self.spin_selector_timeout.text())
        )

        retry_policy_config = RetryPolicyConfig(
            click_attempts=int(self.spin_click_attempts.text()),
            click_delay_ms=int(self.spin_click_delay.text())
        )

        ui_config = UIConfig(
            theme=self.current_theme
        )

        # Haal custom fields op (Point-and-Click Scraper)
        from config.config_manager import ScrapeField
        custom_fields = []
        for row in range(self.field_table.rowCount()):
            name_item = self.field_table.item(row, 0)
            selector_item = self.field_table.item(row, 1)
            action_widget = self.field_table.cellWidget(row, 2)
            
            if name_item and selector_item and isinstance(action_widget, QComboBox):
                custom_fields.append(ScrapeField(
                    name=name_item.text(),
                    selector=selector_item.text(),
                    action=action_widget.currentText()
                ))

        # Haal target configuratie op
        from utils.helpers import parse_indices
        target_config = TargetConfig(
            books=parse_indices(self.txt_target_books.text()),
            chapters=parse_indices(self.txt_target_chapters.text()),
            paragraphs=parse_indices(self.txt_target_paragraphs.text())
        )

        return ScraperConfig(
            start_url=self.txt_url.text(),
            login=login_config,
            book_selection=book_selection_config,
            ui_structure=ui_structure_config,
            ui=ui_config,
            output=output_config,
            browser=browser_config,
            timeouts=timeouts_config,
            retry_policy=retry_policy_config,
            auto_scrape=self.chk_auto_scrape.isChecked(),
            custom_fields=custom_fields,
            target=target_config
        )
        
    def set_config(self, config: ScraperConfig):
        """Stel UI velden in vanuit configuratie - GEÜPDATEE VERSIE"""
        self.txt_url.setText(config.start_url)

        # Login config
        self.chk_use_login_steps.setChecked(bool(config.login.login_steps))

        # Toon login stappen
        if config.login.login_steps:
            steps_data = [step.model_dump() for step in config.login.login_steps]
            self.set_login_steps_to_ui(steps_data)
        else:
            self.set_login_steps_to_ui([]) # Tabel leegmaken als er geen stappen zijn

        self.txt_username_selector.setText(config.login.username_selector)
        self.txt_username_value.setText(config.login.username_value or "")
        self.txt_password_selector.setText(config.login.password_selector)
        self.txt_password_value.setText("")  # Wachtwoord nooit tonen
        self.txt_submit_selector.setText(config.login.submit_selector)

        # Book selection config
        self.txt_book_list_selector.setText(config.book_selection.book_list_selector)
        self.txt_book_title_selector.setText(config.book_selection.book_item_title_selector)

        # UI structure config
        self.txt_greeting_selector.setText(config.ui_structure.greeting_selector)
        self.txt_chapter_selector.setText(config.ui_structure.sidebar_chapter_selector)
        self.txt_paragraphs_container.setText(config.ui_structure.chapter_paragraphs_container_selector)
        self.txt_paragraph_selector.setText(config.ui_structure.paragraph_button_selector)
        self.txt_objectives_selector.setText(config.ui_structure.learning_objectives_selector)
        self.txt_lesson_selector.setText(config.ui_structure.lesson_content_selector)
        self.txt_image_selector.setText(config.ui_structure.image_selector)

        # Output config
        self.txt_output_dir.setText(config.output.output_dir)
        self.txt_filename_template.setText(config.output.filename_template)
        self.chk_save_images.setChecked(config.output.save_images)
        
        # New Output settings
        self.chk_download_videos.setChecked(getattr(config.output, 'download_videos', False))
        export_format = getattr(config.output, 'export_format', 'txt')
        if hasattr(export_format, 'value'): # Als het een enum is
            export_format = export_format.value
        index = self.cmb_export_format.findText(export_format)
        if index >= 0:
            self.cmb_export_format.setCurrentIndex(index)

        # Browser config
        self.chk_headless.setChecked(config.browser.headless)
        self.chk_persistent_context.setChecked(config.browser.use_persistent_context)
        self.txt_user_data_dir.setText(config.browser.user_data_dir)
        self.chk_attach_to_existing.setChecked(config.browser.attach_to_existing)
        self.txt_cdp_url.setText(config.browser.cdp_url)
        self.chk_keep_open_on_error.setChecked(config.browser.keep_open_on_error)
        
        # UI config
        if hasattr(config, 'ui') and config.ui:
            self.current_theme = config.ui.theme
            self.btn_theme_toggle.setChecked(self.current_theme == UITheme.DARK)
            self.btn_theme_toggle.setText("🌙 Dark Mode" if self.current_theme == UITheme.DARK else "☀️ Light Mode")
            ThemeManager.apply_theme(QApplication.instance(), self.current_theme)
        
        # New Browser settings
        self.chk_parallel_mode.setChecked(getattr(config.browser, 'parallel_mode', False))
        self.chk_use_stealth.setChecked(getattr(config.browser, 'use_stealth', True))

        # Timeouts config
        self.spin_navigation_timeout.setText(str(config.timeouts.navigation))
        self.spin_selector_timeout.setText(str(config.timeouts.selector))

        # Retry policy config
        self.spin_click_attempts.setText(str(config.retry_policy.click_attempts))
        self.spin_click_delay.setText(str(config.retry_policy.click_delay_ms))
        
        # Auto scrape config
        self.chk_auto_scrape.setChecked(getattr(config, 'auto_scrape', False))
        
        # Target selection config
        if hasattr(config, 'target') and config.target:
            from utils.helpers import format_indices
            self.txt_target_books.setText(format_indices(config.target.books))
            self.txt_target_chapters.setText(format_indices(config.target.chapters))
            self.txt_target_paragraphs.setText(format_indices(config.target.paragraphs))
        
        # Custom fields config (Point-and-Click Scraper)
        self.field_table.setRowCount(0)
        for field in getattr(config, 'custom_fields', []):
            self.add_scrape_field(name=field.name, selector=field.selector)
            # Stel actie in (de combobox staat in de laatste kolom)
            row = self.field_table.rowCount() - 1
            combo = self.field_table.cellWidget(row, 2)
            if isinstance(combo, QComboBox):
                combo.setCurrentText(field.action)
        
    def on_start_clicked(self, recording_mode=False):
        """Wanneer start knop wordt geklikt (backward compatibility)"""
        if not self.is_running:
            self.start_run(recording_mode=recording_mode)
        else:
            self.stop_run()

    def toggle_recording(self):
        """Start of stop een recording sessie"""
        if not self.is_recording:
            self.start_recording()
        else:
            self.stop_recording()

    def start_recording(self):
        """Start de action recorder"""
        url = self.txt_url.text()
        if not url:
            QMessageBox.warning(self, "Waarschuwing", "Voer eerst een Start URL in.")
            return

        self.is_recording = True
        self.btn_record_steps.setText("⏹ Stop Recording")
        self.btn_record_steps.setStyleSheet("background-color: #d83a3a; color: white;")
        self.chk_record_coords.setEnabled(False) # Deactiveer checkbox tijdens recording
        
        # Update mode status label
        mode_text = "COÖRDINATEN" if self.chk_record_coords.isChecked() else "SELECTORS"
        self.lbl_mode_status.setText(f"🔴 RECORDING: {mode_text}")
        self.lbl_mode_status.setStyleSheet("background-color: #ffcccc; color: #cc0000; font-weight: bold; padding: 5px; border-radius: 4px;")
        self.lbl_mode_status.setVisible(True)
        
        # Schakel automatisch scrapen uit tijdens recording om verwarring te voorkomen
        self.chk_auto_scrape.setChecked(False)
        
        # Start de runner in recording mode
        if not self.is_running:
            self.on_start_clicked(recording_mode=True)
        else:
            # Als de runner al draait, activeer recording
            if self.runner:
                use_coords = self.chk_record_coords.isChecked()
                self.runner.set_recording(True, use_coordinates=use_coords)

    def stop_recording(self):
        """Stop de action recorder"""
        self.is_recording = False
        self.btn_record_steps.setText("🔴 Start Recording")
        self.btn_record_steps.setStyleSheet("background-color: #ff4444; color: white;")
        self.chk_record_coords.setEnabled(True)
        
        # Hide mode status label
        self.lbl_mode_status.setVisible(False)
        
        if self.runner:
            self.runner.set_recording(False)
            
        self.statusBar().showMessage("Recording gestopt. Je kunt de stappen nu handmatig bewerken.", 5000)

    def on_focus_and_start_clicked(self):
        """Wanneer Focus & Start knop wordt geklikt"""
        self.chk_attach_to_existing.setChecked(True)
        self._resume_mode = True
        self.start_run()
        self._resume_mode = False # Reset after starting

    def start_run(self, recording_mode=False):
        """Start de scraping run"""
        if self._is_starting:
            return
            
        # Reset stop flag in runner als die nog bestaat
        if self.runner:
            self.runner.is_running = True

        try:
            self._is_starting = True
            # Valideer configuratie
            config = self.get_current_config()
            errors = self.config_manager.validate_config(config)
            
            if errors:
                QMessageBox.warning(
                    self,
                    "Validatie Fouten",
                    "\n".join(errors)
                )
                self._is_starting = False
                return
            
            # Controleer output directory
            from utils.helpers import validate_directory
            is_valid, error_msg = validate_directory(config.output.output_dir)
            if not is_valid:
                QMessageBox.critical(
                    self,
                    "Fout",
                    f"Output directory is niet geldig:\n{error_msg}"
                )
                self._is_starting = False
                return
            
            # Als afbeeldingen worden opgeslagen, controleer images directory
            if config.output.save_images:
                images_dir = self.txt_images_dir.text()
                if not images_dir:
                    QMessageBox.warning(
                        self,
                        "Waarschuwing",
                        "Selecteer een directory voor afbeeldingen of zet 'Afbeeldingen opslaan' uit"
                    )
                    self._is_starting = False
                    return
                
                is_valid, error_msg = validate_directory(images_dir)
                if not is_valid:
                    QMessageBox.critical(
                        self,
                        "Fout",
                        f"Afbeeldingen directory is niet geldig:\n{error_msg}"
                    )
                    self._is_starting = False
                    return
                
                # Update config met images directory
                config.output.output_dir = images_dir
            
            # Controleer of er al een runner draait
            if self.runner_thread and self.runner_thread.isRunning():
                # Als runner al actief is, stuur alleen de nieuwe config
                if self.runner:
                    self.logger.info("Runner is al actief, configuratie bijwerken...")
                    self.runner.is_recording = recording_mode or self.is_recording
                    if recording_mode or self.is_recording:
                        use_coords = self.chk_record_coords.isChecked()
                        self.runner.use_coordinate_recording = use_coords
                    self.runner.update_config(config)
                    self._is_starting = False
                    return
                else:
                    # Thread draait nog maar runner is weg? (Zou niet moeten kunnen)
                    self.runner_thread.quit()
                    self.runner_thread.wait()

            # Blokkeer signals van de tabel en het model tijdens startup om loops te voorkomen
            self.login_steps_table.blockSignals(True)
            if self.login_steps_table.model():
                self.login_steps_table.model().blockSignals(True)
            
            # Start runner
            self.is_running = True
            self.update_run_button_state()
            self.btn_test_selectors.setEnabled(False)
            self.progress_bar.setVisible(True)
            self.progress_bar.setValue(0)
            self.statusBar().showMessage("Run starten...")
            
            # Maak runner thread
            self.runner_thread = QThread()
            self.runner = BookScrapeRunner(config, self.logger)
            self.runner.is_recording = recording_mode or self.is_recording
            if recording_mode or self.is_recording:
                use_coords = self.chk_record_coords.isChecked()
                self.runner.use_coordinate_recording = use_coords
            self.runner.moveToThread(self.runner_thread)

            # Configureer Live Table kolommen op basis van custom fields
            base_headers = ["Hoofdstuk", "Paragraaf", "Type"]
            custom_headers = [f.name for f in config.custom_fields]
            all_headers = base_headers + custom_headers + ["Tijd"]
            
            self.live_table.setColumnCount(len(all_headers))
            self.live_table.setHorizontalHeaderLabels(all_headers)
            self.live_table.setRowCount(0)
            
            # Verbind signals
            self.runner_thread.started.connect(self.runner.run_sync)
            self.runner.finished.connect(self.on_run_finished)
            self.runner.user_action_recorded.connect(self.handle_recorded_action)
            
            # De runner wordt nu opgeschoond in on_run_finished
            # Verbindfinished van de runner met quit van de thread voor automatische cleanup
            self.runner.finished.connect(self.runner_thread.quit)
            
            self.runner.progress_update.connect(self.update_progress)
            self.runner.status_update.connect(self.update_status)
            self.runner.log_message.connect(self.handle_log_message)
            self.runner.error_occurred.connect(self.handle_runner_error)
            self.runner.captcha_detected.connect(self.handle_captcha)
            self.runner.book_found.connect(self.on_books_found)
            self.runner.step_started.connect(self.highlight_step)
            self.runner.step_finished.connect(self.finish_step)
            self.runner.data_collected.connect(self.update_live_table)
            self.runner.selector_captured.connect(self.handle_selector_captured)
            
            # Nieuwe hiërarchische voortgang verbindingen
            self.runner.book_started.connect(self.on_book_started)
            self.runner.chapter_started.connect(self.on_chapter_started)
            self.runner.paragraph_started.connect(self.on_paragraph_started)
            self.runner.item_completed.connect(self.on_item_completed)
            
            # Phase 4 Metrics Dashboard verbinding
            self.dashboard.reset()
            self.runner.metrics_updated.connect(self.dashboard.update_metrics)
            
            # Start thread
            self.runner_thread.start()
            
            self.logger.info("Run gestart")
            
        except Exception as e:
            self.logger.error(f"Fout bij starten run: {str(e)}")
            # Reset states bij fout
            self.is_running = False
            self._is_starting = False
            self.update_run_button_state()
            self.progress_bar.setVisible(False)
            
            QMessageBox.critical(
                self,
                "Fout",
                f"Kon run niet starten:\n{str(e)}"
            )
        finally:
            self._is_starting = False
            self.login_steps_table.blockSignals(False)
            if self.login_steps_table.model():
                self.login_steps_table.model().blockSignals(False)
            
    def stop_run(self):
        """Stop de huidige run onmiddellijk"""
        self.logger.info("Stop run aangevraagd...")
        
        if self.runner:
            # Directe stop via runner method
            self.runner.stop()
            self.logger.info("Onmiddellijk stop signaal verzonden naar runner...")
            
            # Update UI state onmiddellijk
            self.is_running = False
            self.update_run_button_state()
        else:
            self.logger.warning("Stop aangeroepen maar geen actieve runner gevonden. Status forceren naar gestopt.")
            self.on_run_finished()
        
        # We don't quit the thread immediately here if runner exists 
        # because the runner will emit 'finished' after cleanup.
        
    def update_progress(self, current: int, total: int):
        """Update progress bar"""
        if total > 0:
            percentage = int((current / total) * 100)
            self.progress_bar.setValue(percentage)
            
            # Update status
            self.statusBar().showMessage(f"Voortgang: {percentage}% ({current}/{total})")
        
    def update_status(self, message: str):
        """Update status bar"""
        self.status_label.setText(message)
        self.statusBar().showMessage(message, 3000)
        
    def handle_runner_error(self, error_message: str):
        """Verwerk runner fout"""
        self.logger.error(f"Runner fout: {error_message}")
        
        # Toon fout in message box
        QMessageBox.critical(
            self,
            "Runner Fout",
            f"Er is een fout opgetreden tijdens de run:\n\n{error_message}"
        )
        
        # Stop de run
        self.stop_run()
        
    def handle_captcha(self, screenshot_path: str, html_dump: str):
        """Verwerk CAPTCHA detectie"""
        self.logger.warning("CAPTCHA gedetecteerd, run gepauzeerd")
        
        # Toon CAPTCHA dialog
        dialog = CaptchaDialog(screenshot_path, self)
        dialog.resolved.connect(self.on_captcha_resolved)
        dialog.cancelled.connect(self.stop_run)
        
        dialog.exec()

    def on_captcha_resolved(self):
        """Wanneer CAPTCHA is opgelost"""
        if self.runner:
            self.runner.resume_after_captcha()
            self.logger.info("CAPTCHA opgelost, run hervat")

    def on_books_found(self, books):
        """Wanneer runner boeken heeft gevonden"""
        self.found_books = books
        
        # Update dropdown
        self.cmb_books.clear()
        self.cmb_books.addItem("-- Selecteer een boek --", -1)
        
        for title, index in books:
            self.cmb_books.addItem(title, index)
        
        # Enable boek selectie
        self.cmb_books.setEnabled(True)
        self.btn_book_select.setEnabled(True)
        
        # Toon bericht
        self.logger.info(f"{len(books)} boek(en) gevonden")
        self.statusBar().showMessage(f"{len(books)} boek(en) gevonden - selecteer een boek")

    def on_book_selected(self):
        """Wanneer gebruiker een boek selecteert"""
        index = self.cmb_books.currentData()
        if index == -1:
            QMessageBox.warning(self, "Waarschuwing", "Selecteer een boek")
            return
        
        # Stel geselecteerd boek in bij runner
        if self.runner:
            self.runner.set_selected_book(index)
            self.logger.info(f"Boek geselecteerd: index {index}")
            
            # Disable boek selectie
            self.cmb_books.setEnabled(False)
            self.btn_book_select.setEnabled(False)
            
            # Hervat runner
            self.runner.resume_after_book_selection()

    def on_run_finished(self):
        """Wanneer run is voltooid"""
        # Voorkom dubbele afhandeling
        if not self.is_running and self.runner is None and self.runner_thread is None:
            return
            
        self.is_running = False
        self._is_starting = False
        self.update_run_button_state()
        self.btn_test_selectors.setEnabled(True)
        self.progress_bar.setVisible(False)
        
        # Reset highlights
        self.clear_step_highlights()
        
        # Reset boek selectie
        self.cmb_books.clear()
        self.cmb_books.setEnabled(False)
        self.btn_book_select.setEnabled(False)
        
        self.statusBar().showMessage("Run voltooid")
        self.logger.info("Runner proces voltooid")
        
        # De-block signals just in case they were left blocked
        self.login_steps_table.blockSignals(False)
        
        # Cleanup runner and thread
        if self.runner_thread:
            try:
                self.runner_thread.quit()
                if not self.runner_thread.wait(3000): # Wait max 3 seconds
                    self.runner_thread.terminate()
                    self.runner_thread.wait()
            except Exception as e:
                self.logger.error(f"Fout bij cleanup thread: {str(e)}")
            self.runner_thread = None
        
        self.runner = None
        
    def on_book_started(self, title: str):
        """Wanneer een nieuw boek wordt gestart"""
        self.current_book_item = self.progress_tree.add_book(title)
        self.progress_tree.update_status(self.current_book_item, "🔄", "Bezig...")

    def on_chapter_started(self, title: str, index: int):
        """Wanneer een nieuw hoofdstuk wordt gestart"""
        if hasattr(self, 'current_book_item'):
            self.current_chapter_item = self.progress_tree.add_chapter(self.current_book_item, f"H{index}: {title}")
            self.progress_tree.update_status(self.current_chapter_item, "🔄", "Bezig...")

    def on_paragraph_started(self, title: str, index: int):
        """Wanneer een nieuwe paragraaf wordt gestart"""
        if hasattr(self, 'current_chapter_item'):
            self.current_paragraph_item = self.progress_tree.add_paragraph(self.current_chapter_item, f"P{index}: {title}")
            self.progress_tree.update_status(self.current_paragraph_item, "🔄", "Bezig...")

    def toggle_selection_mode(self):
        """Schakel tussen normale modus en element selectie modus"""
        is_active = self.btn_toggle_selection.isChecked()
        if is_active:
            self.btn_toggle_selection.setText("⏹ Stop Selectie")
            self.btn_toggle_selection.setStyleSheet("background-color: #f44336; color: white; font-weight: bold;")
            
            # Update mode status label
            self.lbl_mode_status.setText("🖱 SELECTIE MODUS ACTIEF")
            self.lbl_mode_status.setStyleSheet("background-color: #e8f5e9; color: #2e7d32; font-weight: bold; padding: 5px; border-radius: 4px;")
            self.lbl_mode_status.setVisible(True)
            
            self.statusBar().showMessage("Selectie Mode Actief: Klik op een element in de browser om de selector te vangen.", 5000)
            
            # Start runner als deze nog niet draait (in focus mode)
            if not self.is_running:
                self.on_focus_and_start_clicked()
        else:
            self.btn_toggle_selection.setText("🖱 Start Data Selectie")
            self.btn_toggle_selection.setStyleSheet("background-color: #4caf50; color: white; font-weight: bold;")
            
            # Hide mode status label
            self.lbl_mode_status.setVisible(False)
            
            self.statusBar().showMessage("Selectie Mode Gedeactiveerd.", 3000)
        
        if self.runner:
            self.runner.set_selection_mode(is_active)

    def add_scrape_field(self, name: str = "", selector: str = ""):
        """Voeg een nieuw veld toe aan de scrape tabel"""
        row = self.field_table.rowCount()
        self.field_table.insertRow(row)
        
        name_item = QTableWidgetItem(name or f"veld_{row + 1}")
        self.field_table.setItem(row, 0, name_item)
        
        selector_item = QTableWidgetItem(selector)
        self.field_table.setItem(row, 1, selector_item)
        
        # Actie kolom (bijv. "Tekst", "Attribuut", "HTML")
        combo = QComboBox()
        combo.addItems(["Tekst", "HTML", "Link (href)", "Afbeelding (src)"])
        self.field_table.setCellWidget(row, 2, combo)
        
        # Selecteer de nieuwe rij
        self.field_table.setCurrentCell(row, 0)

    def remove_scrape_field(self):
        """Verwijder het geselecteerde veld"""
        current_row = self.field_table.currentRow()
        if current_row >= 0:
            self.field_table.removeRow(current_row)

    def handle_selector_captured(self, selector: str):
        """Wordt aangeroepen wanneer een selector is gevangen in de browser"""
        current_row = self.field_table.currentRow()
        if current_row < 0:
            # Geen rij geselecteerd, voeg een nieuwe toe
            self.add_scrape_field(selector=selector)
        else:
            # Update de huidige rij
            item = self.field_table.item(current_row, 1)
            if item:
                item.setText(selector)
            else:
                self.field_table.setItem(current_row, 1, QTableWidgetItem(selector))
        
        self.statusBar().showMessage(f"Selector gevangen: {selector}", 3000)

    def handle_recorded_action(self, action_data: dict):
        """Wordt aangeroepen wanneer een actie is opgenomen in de browser"""
        self.logger.info(f"Actie opgenomen: {action_data}")
        
        # Check of we een loop moeten voorstellen
        selector = action_data.get('selector', '')
        action = action_data.get('action', 'click')
        
        # Simpele heuristiek: als de selector 'chapter' of 'paragraph' bevat, 
        # en we hebben nog geen loop voor dit type, stel voor om een loop te maken.
        suggest_loop = False
        loop_type = ""
        if "book" in selector.lower() and action == "click":
            suggest_loop = True
            loop_type = "loop_books"
        elif "chapter" in selector.lower() and action == "click":
            suggest_loop = True
            loop_type = "loop_chapters"
        elif ("paragraph" in selector.lower() or "lesson" in selector.lower()) and action == "click":
            suggest_loop = True
            loop_type = "loop_paragraphs"
            
        if suggest_loop:
            reply = QMessageBox.question(
                self, 
                "Loop Detectie", 
                f"Je klikte op een element dat lijkt op een {loop_type.split('_')[1]}.\n"
                "Wilt u deze actie omzetten naar een automatische loop voor alle items?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply == QMessageBox.StandardButton.Yes:
                action_data['action'] = loop_type
        
        # Blokkeer signalen tijdelijk
        self.login_steps_table.blockSignals(True)
        
        try:
            row = self.login_steps_table.rowCount()
            self.login_steps_table.insertRow(row)
            
            # Actie dropdown
            combo_action = QComboBox()
            combo_action.addItems(["click", "fill", "wait", "scrape", "loop_books", "loop_chapters", "loop_paragraphs", "end_loop"])
            combo_action.setCurrentText(action_data.get('action', 'click'))
            self.login_steps_table.setCellWidget(row, 0, combo_action)
            
            # Selector
            self.login_steps_table.setItem(row, 1, QTableWidgetItem(selector))
            
            # Waarde
            value = action_data.get('value', '')
            self.login_steps_table.setItem(row, 2, QTableWidgetItem(value))
            
            # Wacht tijd
            spin_wait = QSpinBox()
            spin_wait.setRange(0, 10000)
            spin_wait.setValue(action_data.get('wait_after_ms', 1000))
            spin_wait.setSuffix(" ms")
            self.login_steps_table.setCellWidget(row, 3, spin_wait)
            
            # Verwacht element
            self.login_steps_table.setItem(row, 4, QTableWidgetItem(""))
            
            # Indices widget
            indices_widget = QWidget()
            indices_layout = QHBoxLayout(indices_widget)
            indices_layout.setContentsMargins(2, 2, 2, 2)
            indices_layout.setSpacing(2)
            
            # Stel standaard indices in als het een loop is
            default_indices = ""
            if action_data['action'] == "loop_chapters":
                default_indices = self.txt_target_chapters.text()
            elif action_data['action'] == "loop_paragraphs":
                default_indices = self.txt_target_paragraphs.text()
                
            line_edit = QLineEdit(default_indices)
            line_edit.setPlaceholderText("Bijv: 0, 1, 2-5")
            
            btn_helper = QPushButton("...")
            btn_helper.setFixedWidth(30)
            btn_helper.clicked.connect(lambda checked, r=row: self.open_indices_helper(r))
            
            indices_layout.addWidget(line_edit)
            indices_layout.addWidget(btn_helper)
            self.login_steps_table.setCellWidget(row, 5, indices_widget)
            
            # Als we een loop hebben toegevoegd, voeg dan ook meteen een end_loop toe
            if suggest_loop and action_data['action'].startswith("loop_"):
                # Voeg scrape actie toe binnen de loop als het een paragraaf is
                if loop_type == "loop_paragraphs":
                    # We kunnen hier niet makkelijk 'scrape' toevoegen omdat we de selector nog niet weten,
                    # maar we kunnen de gebruiker vragen om op de tekst te klikken.
                    self.statusBar().showMessage("Loop toegevoegd. Klik nu op de tekst die je wilt scrapen.", 5000)
                
                # Voeg end_loop toe
                end_row = self.login_steps_table.rowCount()
                self.login_steps_table.insertRow(end_row)
                combo_end = QComboBox()
                combo_end.addItems(["click", "fill", "wait", "scrape", "loop_books", "loop_chapters", "loop_paragraphs", "end_loop"])
                combo_end.setCurrentText("end_loop")
                self.login_steps_table.setCellWidget(end_row, 0, combo_end)
                self.login_steps_table.setItem(end_row, 1, QTableWidgetItem("")) # Geen selector nodig
                self.login_steps_table.setItem(end_row, 2, QTableWidgetItem(""))
                
                # Lege indices voor end_loop
                indices_widget_end = QWidget()
                indices_layout_end = QHBoxLayout(indices_widget_end)
                indices_layout_end.setContentsMargins(2, 2, 2, 2)
                indices_layout_end.addWidget(QLineEdit())
                self.login_steps_table.setCellWidget(end_row, 5, indices_widget_end)

            # Forceer een update van de UI
            self.login_steps_table.viewport().update()
            self.login_steps_table.scrollToBottom()
            
            # Geef feedback in status bar
            self.statusBar().showMessage(f"Actie opgenomen: {action_data.get('action')} op {selector}", 3000)
            
        finally:
            self.login_steps_table.blockSignals(False)
            self.auto_save_state()
            # Update de runner configuratie (één keer voor de hele rij)
            self.on_table_data_changed(None)

    def on_item_completed(self, item_type: str, status: str, info: str):
        """Wanneer een item (boek/hoofdstuk/paragraaf) klaar is"""
        if item_type == "paragraph" and hasattr(self, 'current_paragraph_item'):
            self.progress_tree.update_status(self.current_paragraph_item, status, info)
        elif item_type == "chapter" and hasattr(self, 'current_chapter_item'):
            self.progress_tree.update_status(self.current_chapter_item, status, info)
        elif item_type == "book" and hasattr(self, 'current_book_item'):
            self.progress_tree.update_status(self.current_book_item, status, info)

    def update_live_table(self, data: dict):
        """Update de Live Data tabel met nieuwe gescrapte informatie"""
        from datetime import datetime
        row = self.live_table.rowCount()
        self.live_table.insertRow(row)
        
        # Basis data
        chapter = data.get("chapter_title", f"H{data.get('chapter_index', '?')}")
        paragraph = data.get("paragraph_title", f"P{data.get('paragraph_index', '?')}")
        item_type = data.get("type", "content")
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Vul basis kolommen in
        self.live_table.setItem(row, 0, QTableWidgetItem(str(chapter)))
        self.live_table.setItem(row, 1, QTableWidgetItem(str(paragraph)))
        self.live_table.setItem(row, 2, QTableWidgetItem(str(item_type)))
        
        # Vul custom data in
        custom_data = data.get("custom_data", {})
        col_idx = 3
        
        # De tabel heeft kolommen in de volgorde: [Hoofdstuk, Paragraaf, Type, ...custom_fields..., Tijd]
        # We halen de namen van de custom fields op uit de tabel headers
        for i in range(3, self.live_table.columnCount() - 1):
            header_name = self.live_table.horizontalHeaderItem(i).text()
            val = custom_data.get(header_name, "")
            
            # Inkorten voor weergave
            str_val = str(val)
            if len(str_val) > 100:
                str_val = str_val[:97] + "..."
                
            self.live_table.setItem(row, i, QTableWidgetItem(str_val))
            col_idx += 1
            
        # Laatste kolom is altijd tijd
        self.live_table.setItem(row, self.live_table.columnCount() - 1, QTableWidgetItem(timestamp))
        
        # Scroll naar beneden
        self.live_table.scrollToBottom()
        self.live_table.scrollToBottom()
        
        # Selecteer de Live Data tab als er nieuwe data binnenkomt (optioneel, misschien irritant)
        # self.right_tabs.setCurrentIndex(2) 

    def filter_logs(self, text: str):
        """Filter de logs op basis van de zoekbalk"""
        self.log_text.filter_logs(text)
        
        # Toon samenvatting (VERWIJDERD: Gebruiker wil geen storende popups)
        # if self.runner and hasattr(self.runner, 'saver'):
        #     run_info = self.runner.saver.get_run_info()
        #     QMessageBox.information(
        #         self,
        #         "Run Voltooid",
        #         f"Run succesvol voltooid!\n\n"
        #         f"Run ID: {run_info['run_id']}\n"
        #         f"Bestanden: {run_info['total_files']}\n"
        #         f"Afbeeldingen: {run_info['total_images']}\n"
        #         f"Output directory:\n{run_info['run_dir']}"
        #     )
            
    def closeEvent(self, event):
        """Afhandeling venster sluiten"""
        if self.is_running:
            reply = QMessageBox.question(
                self,
                "Run actief",
                "Er is een actieve run. Weet je zeker dat je wilt afsluiten?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.No
            )
            
            if reply == QMessageBox.StandardButton.Yes:
                self.stop_run()
                if hasattr(self, 'logger'):
                    self.logger.cleanup()
                event.accept()
            else:
                event.ignore()
        else:
            if hasattr(self, 'logger'):
                self.logger.cleanup()
            event.accept()