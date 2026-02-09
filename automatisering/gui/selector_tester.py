# gui/selector_tester.py
import asyncio
import re
from typing import List, Optional
from pathlib import Path

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QGroupBox,
    QLabel, QLineEdit, QPushButton, QTextEdit,
    QComboBox, QCheckBox, QSpinBox, QScrollArea,
    QWidget, QMessageBox, QProgressBar,
    QTableWidget, QTableWidgetItem, QHeaderView,
    QSplitter, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QUrl
from PyQt6.QtGui import QFont, QColor, QTextCursor, QDesktopServices

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
import asyncio

class SelectorTesterWorker(QThread):
    """Worker thread voor selector testing om GUI niet te blokkeren"""
    
    # Signalen voor communicatie met GUI
    status_update = pyqtSignal(str)
    element_found = pyqtSignal(list)  # List van (selector, text, count)
    screenshot_taken = pyqtSignal(str)  # Pad naar screenshot
    error_occurred = pyqtSignal(str)
    
    def __init__(self, url: str, selector: str = "", headless: bool = False):
        super().__init__()
        self.url = url
        self.selector = selector
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.context: Optional[BrowserContext] = None
        self.is_running = True
        
    def run(self):
        """Hoofd thread functie - gebruikt asyncio event loop"""
        asyncio.run(self._async_run())
        
    async def _async_run(self):
        """Asynchrone hoofd functie"""
        try:
            self.status_update.emit("Playwright starten...")
            playwright = await async_playwright().start()
            
            self.status_update.emit("Browser starten...")
            self.browser = await playwright.chromium.launch(headless=self.headless)
            
            self.status_update.emit("Nieuwe pagina aanmaken...")
            self.page = await self.browser.new_page()
            
            self.status_update.emit(f"Navigeren naar: {self.url}")
            await self.page.goto(self.url, wait_until="networkidle")
            
            # Als selector gegeven is, test deze
            if self.selector:
                await self.test_selector(self.selector)
                
        except Exception as e:
            self.error_occurred.emit(f"Fout: {str(e)}")
        finally:
            # Sluit browser als thread stopt
            if self.browser:
                await self.browser.close()
                
    async def test_selector(self, selector: str):
        """Test een selector op de huidige pagina"""
        try:
            self.status_update.emit(f"Selector testen: {selector}")
            
            # Bepaal of het CSS of XPath is
            is_xpath = selector.startswith('//') or selector.startswith('.//')
            
            if is_xpath:
                elements = await self.page.query_selector_all(f"xpath={selector}")
            else:
                elements = await self.page.query_selector_all(selector)
                
            count = len(elements)
            
            if count == 0:
                self.element_found.emit([(selector, "Geen elementen gevonden", 0)])
                return
                
            # Verzamel informatie over gevonden elementen
            element_info = []
            for i, element in enumerate(elements[:10]):  # Beperk tot eerste 10
                # Haal tekst op
                text = await element.inner_text()
                text_preview = text[:200] + "..." if len(text) > 200 else text
                
                # Haal attributen op
                tag_name = await element.evaluate("element => element.tagName")
                id_attr = await element.get_attribute("id")
                class_attr = await element.get_attribute("class")
                
                # Maak beschrijving
                description = f"[{i+1}] {tag_name}"
                if id_attr:
                    description += f"#id='{id_attr}'"
                if class_attr:
                    description += f".class='{class_attr[:30]}'"
                    
                element_info.append((selector, description, text_preview, i+1))
                
            self.element_found.emit(element_info)
            
            # Highlight elementen in browser
            await self.highlight_elements(selector, is_xpath)
            
            # Neem screenshot
            await self.take_screenshot()
            
        except Exception as e:
            self.error_occurred.emit(f"Selector test fout: {str(e)}")
            
    async def highlight_elements(self, selector: str, is_xpath: bool = False):
        """Highlight gevonden elementen in de browser"""
        if not self.page:
            return
            
        try:
            # JavaScript om elementen te highlighten
            highlight_script = """
            (selector, isXPath, index) => {
                let elements;
                if (isXPath) {
                    const result = document.evaluate(
                        selector, 
                        document, 
                        null, 
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                        null
                    );
                    elements = [];
                    for (let i = 0; i < result.snapshotLength; i++) {
                        elements.push(result.snapshotItem(i));
                    }
                } else {
                    elements = document.querySelectorAll(selector);
                }
                
                // Verwijder vorige highlights
                document.querySelectorAll('.playwright-highlight').forEach(el => {
                    el.style.outline = '';
                    el.classList.remove('playwright-highlight');
                });
                
                // Pas highlight toe
                elements.forEach((el, i) => {
                    el.classList.add('playwright-highlight');
                    const color = i === index ? '#ff4444' : '#44ff44';
                    el.style.outline = `3px solid ${color}`;
                    el.style.outlineOffset = '2px';
                });
                
                return elements.length;
            }
            """
            
            index = 0  # Highlight eerste element rood, rest groen
            await self.page.evaluate(highlight_script, selector, is_xpath, index)
            
        except Exception as e:
            print(f"Highlight error: {e}")
            
    async def take_screenshot(self):
        """Neem screenshot van huidige pagina"""
        if not self.page:
            return
            
        try:
            # Maak screenshot directory
            screenshot_dir = Path.home() / ".noordhoff-scraper" / "screenshots"
            screenshot_dir.mkdir(parents=True, exist_ok=True)
            
            # Genereer unieke bestandsnaam
            import time
            timestamp = int(time.time())
            screenshot_path = screenshot_dir / f"selector_test_{timestamp}.png"
            
            # Neem screenshot
            await self.page.screenshot(path=str(screenshot_path), full_page=True)
            self.screenshot_taken.emit(str(screenshot_path))
            
        except Exception as e:
            print(f"Screenshot error: {e}")
            
    def stop(self):
        """Stop de worker thread"""
        self.is_running = False
        
class SelectorTesterDialog(QDialog):
    """Dialoog voor het testen van selectors"""
    
    def __init__(self, url: str, parent=None):
        super().__init__(parent)
        self.url = url
        self.worker: Optional[SelectorTesterWorker] = None
        
        self.setup_ui()
        self.setup_connections()
        
    def setup_ui(self):
        """Stel de gebruikersinterface op"""
        self.setWindowTitle("Selector Tester")
        self.setGeometry(200, 200, 1000, 700)
        
        # Hoofd layout
        main_layout = QVBoxLayout(self)
        
        # Controle groep
        control_group = QGroupBox("Selector Testen")
        control_layout = QVBoxLayout()
        
        # URL weergave
        url_layout = QHBoxLayout()
        url_layout.addWidget(QLabel("URL:"))
        self.lbl_url = QLabel(self.url)
        self.lbl_url.setStyleSheet("padding: 5px; background-color: #f0f0f0;")
        url_layout.addWidget(self.lbl_url, 1)
        control_layout.addLayout(url_layout)
        
        # Selector input
        selector_layout = QHBoxLayout()
        selector_layout.addWidget(QLabel("Selector:"))
        self.txt_selector = QLineEdit()
        self.txt_selector.setPlaceholderText("Voer CSS selector of XPath in...")
        selector_layout.addWidget(self.txt_selector, 1)
        
        self.btn_test = QPushButton("Test Selector")
        selector_layout.addWidget(self.btn_test)
        control_layout.addLayout(selector_layout)
        
        # Voorbeeld selectors
        example_layout = QHBoxLayout()
        example_layout.addWidget(QLabel("Voorbeelden:"))
        self.btn_example_css = QPushButton(".my-class")
        self.btn_example_css.clicked.connect(lambda: self.txt_selector.setText(".my-class"))
        example_layout.addWidget(self.btn_example_css)
        
        self.btn_example_id = QPushButton("#my-id")
        self.btn_example_id.clicked.connect(lambda: self.txt_selector.setText("#my-id"))
        example_layout.addWidget(self.btn_example_id)
        
        self.btn_example_xpath = QPushButton("//div[@class='test']")
        self.btn_example_xpath.clicked.connect(lambda: self.txt_selector.setText("//div[@class='test']"))
        example_layout.addWidget(self.btn_example_xpath)
        
        example_layout.addStretch()
        control_layout.addLayout(example_layout)
        
        control_group.setLayout(control_layout)
        main_layout.addWidget(control_group)
        
        # Resultaten gebied
        results_splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Linker kant: Element informatie
        elements_widget = QWidget()
        elements_layout = QVBoxLayout(elements_widget)
        
        elements_header = QLabel("Gevonden Elementen:")
        elements_header.setStyleSheet("font-weight: bold; font-size: 14px;")
        elements_layout.addWidget(elements_header)
        
        # Tabel voor elementen
        self.table_elements = QTableWidget()
        self.table_elements.setColumnCount(3)
        self.table_elements.setHorizontalHeaderLabels(["#", "Element", "Text Preview"])
        self.table_elements.horizontalHeader().setStretchLastSection(True)
        self.table_elements.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table_elements.itemSelectionChanged.connect(self.on_element_selected)
        
        elements_layout.addWidget(self.table_elements)
        
        # Element details
        details_group = QGroupBox("Element Details")
        details_layout = QVBoxLayout()
        
        self.txt_element_details = QTextEdit()
        self.txt_element_details.setReadOnly(True)
        self.txt_element_details.setMaximumHeight(150)
        details_layout.addWidget(self.txt_element_details)
        
        self.btn_copy_selector = QPushButton("Kopieer Selector naar Hoofdvenster")
        self.btn_copy_selector.setEnabled(False)
        details_layout.addWidget(self.btn_copy_selector)
        
        details_group.setLayout(details_layout)
        elements_layout.addWidget(details_group)
        
        results_splitter.addWidget(elements_widget)
        
        # Rechter kant: Browser status
        status_widget = QWidget()
        status_layout = QVBoxLayout(status_widget)
        
        # Browser status
        status_group = QGroupBox("Browser Status")
        status_inner_layout = QVBoxLayout()
        
        self.txt_status = QTextEdit()
        self.txt_status.setReadOnly(True)
        self.txt_status.setMaximumHeight(100)
        status_inner_layout.addWidget(self.txt_status)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        status_inner_layout.addWidget(self.progress_bar)
        
        # Browser opties
        options_layout = QHBoxLayout()
        self.chk_headless = QCheckBox("Headless modus")
        self.chk_headless.setChecked(False)
        options_layout.addWidget(self.chk_headless)
        
        self.btn_open_browser = QPushButton("Open in Systeembrowser")
        options_layout.addWidget(self.btn_open_browser)
        
        options_layout.addStretch()
        status_inner_layout.addLayout(options_layout)
        
        # Screenshot weergave
        self.lbl_screenshot = QLabel("Screenshot verschijnt hier na test")
        self.lbl_screenshot.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.lbl_screenshot.setStyleSheet("border: 1px solid #ccc; background-color: #f0f0f0;")
        self.lbl_screenshot.setMinimumHeight(300)
        status_inner_layout.addWidget(self.lbl_screenshot)
        
        status_group.setLayout(status_inner_layout)
        status_layout.addWidget(status_group)
        
        results_splitter.addWidget(status_widget)
        results_splitter.setSizes([400, 600])
        
        main_layout.addWidget(results_splitter, 1)
        
        # Onderste knoppen
        button_layout = QHBoxLayout()
        self.btn_close = QPushButton("Sluiten")
        self.btn_launch = QPushButton("Browser Starten")
        
        button_layout.addWidget(self.btn_launch)
        button_layout.addStretch()
        button_layout.addWidget(self.btn_close)
        
        main_layout.addLayout(button_layout)
        
        # Initialiseer browser
        QTimer.singleShot(500, self.launch_browser)
        
    def setup_connections(self):
        """Stel signal-slot verbindingen op"""
        self.btn_test.clicked.connect(self.test_selector)
        self.btn_launch.clicked.connect(self.launch_browser)
        self.btn_close.clicked.connect(self.close)
        self.btn_open_browser.clicked.connect(self.open_in_system_browser)
        self.btn_copy_selector.clicked.connect(self.copy_selector_to_main)
        
        # Enter toets in selector veld
        self.txt_selector.returnPressed.connect(self.test_selector)
        
    def launch_browser(self):
        """Start de Playwright browser voor testing"""
        if self.worker and self.worker.isRunning():
            QMessageBox.information(self, "Info", "Browser is al gestart")
            return
            
        self.txt_status.append("Browser starten...")
        self.progress_bar.setVisible(True)
        self.btn_launch.setEnabled(False)
        
        self.worker = SelectorTesterWorker(
            self.url,
            headless=self.chk_headless.isChecked()
        )
        
        # Verbind signals
        self.worker.status_update.connect(self.update_status)
        self.worker.element_found.connect(self.display_elements)
        self.worker.screenshot_taken.connect(self.display_screenshot)
        self.worker.error_occurred.connect(self.handle_error)
        self.worker.finished.connect(self.on_worker_finished)
        
        # Start worker
        self.worker.start()
        
    def test_selector(self):
        """Test de ingevoerde selector"""
        selector = self.txt_selector.text().strip()
        if not selector:
            QMessageBox.warning(self, "Waarschuwing", "Voer een selector in")
            return
            
        if not self.worker or not self.worker.isRunning():
            QMessageBox.warning(self, "Waarschuwing", "Start eerst de browser")
            return
            
        # Update worker selector en test
        self.worker.selector = selector
        asyncio.create_task(self.worker.test_selector(selector))
        
    def update_status(self, message: str):
        """Update status tekst"""
        self.txt_status.append(message)
        cursor = self.txt_status.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.txt_status.setTextCursor(cursor)
        
    def display_elements(self, elements: list):
        """Toon gevonden elementen in tabel"""
        self.table_elements.setRowCount(len(elements))
        
        for row, (selector, description, text_preview, index) in enumerate(elements):
            # Index
            item_index = QTableWidgetItem(str(index))
            item_index.setData(Qt.ItemDataRole.UserRole, selector)
            self.table_elements.setItem(row, 0, item_index)
            
            # Beschrijving
            item_desc = QTableWidgetItem(description)
            self.table_elements.setItem(row, 1, item_desc)
            
            # Text preview
            item_text = QTableWidgetItem(text_preview)
            self.table_elements.setItem(row, 2, item_text)
            
        self.table_elements.resizeColumnsToContents()
        
        # Toon samenvatting
        count = len(elements)
        if count > 0:
            self.update_status(f"{count} element(en) gevonden met selector")
            self.btn_copy_selector.setEnabled(True)
        else:
            self.update_status("Geen elementen gevonden")
            self.btn_copy_selector.setEnabled(False)
            
    def display_screenshot(self, screenshot_path: str):
        """Toon screenshot in dialoog"""
        from PyQt6.QtGui import QPixmap
        pixmap = QPixmap(screenshot_path)
        if not pixmap.isNull():
            scaled_pixmap = pixmap.scaled(
                self.lbl_screenshot.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            )
            self.lbl_screenshot.setPixmap(scaled_pixmap)
            self.lbl_screenshot.setText("")
            self.update_status(f"Screenshot opgeslagen: {screenshot_path}")
        else:
            self.lbl_screenshot.setText("Kon screenshot niet laden")
            
    def handle_error(self, error_message: str):
        """Verwerk foutmelding"""
        self.txt_status.append(f"Fout: {error_message}")
        QMessageBox.critical(self, "Fout", error_message)
        
    def on_element_selected(self):
        """Wanneer een element in de tabel geselecteerd wordt"""
        selected_items = self.table_elements.selectedItems()
        if not selected_items:
            return
            
        row = selected_items[0].row()
        selector = self.table_elements.item(row, 0).data(Qt.ItemDataRole.UserRole)
        description = self.table_elements.item(row, 1).text()
        text_preview = self.table_elements.item(row, 2).text()
        
        # Toon details
        details = f"Selector: {selector}\n"
        details += f"Beschrijving: {description}\n"
        details += f"Tekst:\n{text_preview}"
        
        self.txt_element_details.setText(details)
        
    def copy_selector_to_main(self):
        """Kopieer geselecteerde selector naar hoofdvenster"""
        selected_items = self.table_elements.selectedItems()
        if not selected_items:
            QMessageBox.warning(self, "Waarschuwing", "Selecteer eerst een element")
            return
            
        row = selected_items[0].row()
        selector = self.table_elements.item(row, 0).data(Qt.ItemDataRole.UserRole)
        
        # Stuur selector naar hoofdvenster
        main_window = self.parent()
        if hasattr(main_window, 'receive_selector_from_tester'):
            main_window.receive_selector_from_tester(selector)
            self.update_status(f"Selector gekopieerd naar hoofdvenster: {selector}")
        else:
            # Fallback: kopieer naar clipboard
            from PyQt6.QtWidgets import QApplication
            clipboard = QApplication.clipboard()
            clipboard.setText(selector)
            self.update_status(f"Selector gekopieerd naar clipboard: {selector}")
            
    def open_in_system_browser(self):
        """Open URL in systeembrowser"""
        QDesktopServices.openUrl(QUrl(self.url))
        
    def on_worker_finished(self):
        """Wanneer worker thread klaar is"""
        self.progress_bar.setVisible(False)
        self.btn_launch.setEnabled(True)
        self.update_status("Browser gesloten")
        
    def closeEvent(self, event):
        """Afhandeling dialoog sluiten"""
        if self.worker and self.worker.isRunning():
            self.worker.stop()
            self.worker.wait(2000)  # Wacht maximaal 2 seconden
            
        event.accept()