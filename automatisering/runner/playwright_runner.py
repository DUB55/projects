# runner/playwright_runner.py
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass

from PyQt6.QtCore import QObject, pyqtSignal, QThread
import threading

from playwright.async_api import async_playwright, Page, Browser, BrowserContext, Response
try:
    from playwright_stealth import stealth_async
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False

OVERLAY_JS = """
(function() {
    if (window.__logOverlay) return;
    
    const container = document.createElement('div');
    container.id = 'automation-log-overlay';
    Object.assign(container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '450px',
        maxHeight: '400px',
        backgroundColor: 'rgba(25, 25, 25, 0.95)',
        color: '#f0f0f0',
        padding: '0',
        borderRadius: '12px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        fontSize: '13px',
        zIndex: '2147483647',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        border: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'opacity 0.3s',
        backdropFilter: 'blur(8px)',
        userSelect: 'none'
    });
    
    // Header (Drag Handle)
    const header = document.createElement('div');
    header.id = 'automation-overlay-header';
    Object.assign(header.style, {
        padding: '12px 16px',
        backgroundColor: '#333',
        cursor: 'move',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #444',
        fontWeight: 'bold',
        fontSize: '14px'
    });
    header.innerHTML = `
        <div style="display: flex; alignItems: center; gap: 8px;">
            <span style="color: #4CAF50; font-size: 18px;">●</span>
            <span>Automation Monitor</span>
        </div>
        <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Live</div>
    `;
    container.appendChild(header);

    // Current Step Section
    const statusSection = document.createElement('div');
    statusSection.id = 'automation-status-section';
    Object.assign(statusSection.style, {
        padding: '12px 16px',
        backgroundColor: '#222',
        borderBottom: '1px solid #333',
        fontSize: '13px',
        lineHeight: '1.5'
    });
    statusSection.innerHTML = `
        <div style="color: #888; font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Huidige Stap</div>
        <div id="automation-current-step" style="color: #64B5F6; font-weight: 500;">Initialiseren...</div>
        <div id="automation-current-detail" style="color: #aaa; font-size: 11px; margin-top: 2px;">Wachten op actie...</div>
    `;
    container.appendChild(statusSection);

    // Mode Indicator Section
    const modeSection = document.createElement('div');
    modeSection.id = 'automation-mode-section';
    Object.assign(modeSection.style, {
        padding: '8px 16px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'none',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 'bold'
    });
    modeSection.innerHTML = `
        <span id="automation-mode-dot" style="color: #ff4444; font-size: 14px;">●</span>
        <span id="automation-mode-text" style="color: #fff; text-transform: uppercase;">RECORDING: SELECTORS</span>
    `;
    container.appendChild(modeSection);
    
    // Log List
    const logList = document.createElement('div');
    logList.id = 'automation-log-list';
    Object.assign(logList.style, {
        padding: '12px 16px',
        overflowY: 'auto',
        flexGrow: '1',
        fontSize: '12px',
        fontFamily: 'Consolas, monospace',
        backgroundColor: 'transparent'
    });
    container.appendChild(logList);

    // Live Controls Section (Pause, Resume, Skip, Rewind)
    const liveControls = document.createElement('div');
    liveControls.id = 'automation-live-controls';
    Object.assign(liveControls.style, {
        padding: '12px 16px',
        backgroundColor: '#222',
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '8px',
        justifyContent: 'center'
    });

    function createControlButton(text, title, color, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.title = title;
        Object.assign(btn.style, {
            backgroundColor: color,
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            flex: '1',
            transition: 'opacity 0.2s'
        });
        btn.onclick = onClick;
        btn.onmouseover = () => btn.style.opacity = '0.8';
        btn.onmouseout = () => btn.style.opacity = '1';
        return btn;
    }

    const rewindBtn = createControlButton('⏮', 'Stap terug', '#555', () => {
        localStorage.setItem('skipDirection', '-1');
        localStorage.setItem('isPaused', 'false');
        window.isPaused = false;
        window.__logOverlay.addLog("Opdracht verzonden: Stap terug", "INFO");
    });

    const pauseBtn = createControlButton('⏸', 'Pauzeer', '#f44336', () => {
        localStorage.setItem('isPaused', 'true');
        window.isPaused = true;
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'block';
        window.__logOverlay.addLog("Automatisering gepauzeerd", "WARNING");
    });

    const resumeBtn = createControlButton('▶', 'Hervat', '#4CAF50', () => {
        localStorage.setItem('isPaused', 'false');
        window.isPaused = false;
        resumeBtn.style.display = 'none';
        pauseBtn.style.display = 'block';
        window.__logOverlay.addLog("Automatisering hervat", "SUCCESS");
    });

    const skipBtn = createControlButton('⏭', 'Stap overslaan', '#555', () => {
        localStorage.setItem('skipDirection', '1');
        localStorage.setItem('isPaused', 'false');
        window.isPaused = false;
        window.__logOverlay.addLog("Opdracht verzonden: Stap overslaan", "INFO");
    });

    // Initial button state
    if (localStorage.getItem('isPaused') === 'true') {
        pauseBtn.style.display = 'none';
    } else {
        resumeBtn.style.display = 'none';
    }

    liveControls.appendChild(rewindBtn);
    liveControls.appendChild(pauseBtn);
    liveControls.appendChild(resumeBtn);
    liveControls.appendChild(skipBtn);
    container.appendChild(liveControls);

    // Recording Controls Section
    const controlsSection = document.createElement('div');
    controlsSection.id = 'automation-controls-section';
    Object.assign(controlsSection.style, {
        padding: '12px 16px',
        backgroundColor: '#222',
        borderTop: '1px solid #333',
        display: 'none', // Alleen zichtbaar tijdens opname
        gap: '8px'
    });
    
    const scrapeBtn = document.createElement('button');
    scrapeBtn.id = 'automation-scrape-text-btn';
    scrapeBtn.innerText = '📸 Tekst Scrapen';
    Object.assign(scrapeBtn.style, {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        flexGrow: '1'
    });
    
    scrapeBtn.onclick = () => {
        window.__setSelectionMode(true, 'scrape');
        window.__logOverlay.addLog("Selecteer de tekst die je wilt exporteren...", "INFO");
    };
    
    controlsSection.appendChild(scrapeBtn);
    container.appendChild(controlsSection);
    
    // Drag Logic
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, container);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
    
    window.__logOverlay = {
        updateStatus: function(step, detail) {
            const stepEl = document.getElementById('automation-current-step');
            const detailEl = document.getElementById('automation-current-detail');
            if (stepEl) stepEl.textContent = step;
            if (detailEl) detailEl.textContent = detail || '';
            this.addLog(`Status: ${step}`, "INFO");
        },
        addLog: function(msg, level) {
            const logList = document.getElementById('automation-log-list');
            if (!logList) {
                // Buffer logs if list isn't ready yet
                if (!window.__logBuffer) window.__logBuffer = [];
                window.__logBuffer.push({msg, level});
                return;
            }

            const entry = document.createElement('div');
            Object.assign(entry.style, {
                marginBottom: '6px',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                borderLeft: '2px solid transparent',
                paddingLeft: '8px'
            });
            
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            
            let color = '#e0e0e0';
            let prefix = 'INFO';
            let borderColor = '#444';
            
            if (level === 'ERROR') { 
                color = '#ff5252'; prefix = 'FAIL'; borderColor = '#ff5252';
            } else if (level === 'WARNING') { 
                color = '#ffd740'; prefix = 'WARN'; borderColor = '#ffd740';
            } else if (level === 'SUCCESS') { 
                color = '#69f0ae'; prefix = 'DONE'; borderColor = '#69f0ae';
            } else if (level === 'STEP') {
                color = '#64B5F6'; prefix = 'STEP'; borderColor = '#64B5F6';
            }
            
            entry.style.borderLeftColor = borderColor;
            entry.innerHTML = `
                <span style="color: #666; font-size: 10px;">${time}</span>
                <span style="color: ${color}; font-weight: bold; font-size: 10px; margin: 0 4px;">[${prefix}]</span>
                <span style="color: ${color}">${msg}</span>
            `;
            
            logList.appendChild(entry);
            logList.scrollTop = logList.scrollHeight;
            
            while (logList.children.length > 50) {
                logList.removeChild(logList.firstChild);
            }
        },
        highlight: function(selectorOrEl) {
            const el = (typeof selectorOrEl === 'string') 
                ? document.querySelector(selectorOrEl) 
                : selectorOrEl;
            
            if (!el || !(el instanceof HTMLElement)) return;
            
            const originalOutline = el.style.outline;
            const originalTransition = el.style.transition;
            
            el.style.transition = 'outline 0.2s ease-in-out';
            el.style.outline = '4px solid #4CAF50';
            el.style.outlineOffset = '2px';
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                el.style.outline = '2px solid rgba(74, 134, 232, 0.5)';
                setTimeout(() => {
                    el.style.outline = originalOutline;
                    el.style.transition = originalTransition;
                }, 1000);
            }, 1000);
        }
    };

    // Recording and Selection modes
    window.__setRecordingMode = function(enabled, useCoordinates = false) {
        const controls = document.getElementById('automation-controls-section');
        const modeSection = document.getElementById('automation-mode-section');
        const modeText = document.getElementById('automation-mode-text');
        const modeDot = document.getElementById('automation-mode-dot');
        
        window.__useCoordinates = useCoordinates;
        
        if (enabled) {
            document.addEventListener('click', handleRecordClick, true);
            document.addEventListener('input', handleRecordInput, true);
            window.__logOverlay.addLog(`Recording gestart (${useCoordinates ? 'Coördinaten' : 'Selectors'})`, "SUCCESS");
            if (controls) controls.style.display = 'flex';
            
            if (modeSection && modeText && modeDot) {
                modeSection.style.display = 'flex';
                modeSection.style.backgroundColor = '#2d1a1a';
                modeDot.style.color = '#ff4444';
                modeText.innerText = `RECORDING: ${useCoordinates ? 'COÖRDINATEN' : 'SELECTORS'}`;
            }
        } else {
            document.removeEventListener('click', handleRecordClick, true);
            document.removeEventListener('input', handleRecordInput, true);
            if (controls) controls.style.display = 'none';
            if (modeSection) modeSection.style.display = 'none';
        }
    };

    window.__setSelectionMode = function(enabled, mode = 'selector') {
        window.__selectionMode = mode; // 'selector' of 'scrape'
        const modeSection = document.getElementById('automation-mode-section');
        const modeText = document.getElementById('automation-mode-text');
        const modeDot = document.getElementById('automation-mode-dot');
        
        if (enabled) {
            document.addEventListener('click', handleSelectionClick, true);
            document.addEventListener('mouseover', handleSelectionMouseOver, true);
            window.__logOverlay.addLog(mode === 'scrape' ? "Klik op de tekst om te scrapen" : "Element selectie modus actief", "INFO");
            
            if (modeSection && modeText && modeDot) {
                modeSection.style.display = 'flex';
                modeSection.style.backgroundColor = '#1a2d1a';
                modeDot.style.color = '#4CAF50';
                modeText.innerText = mode === 'scrape' ? 'MODUS: TEKST SCRAPEN' : 'MODUS: ELEMENT SELECTIE';
            }
        } else {
            document.removeEventListener('click', handleSelectionClick, true);
            document.removeEventListener('mouseover', handleSelectionMouseOver, true);
            if (window.__lastHighlighted) {
                window.__lastHighlighted.style.outline = '';
            }
            if (modeSection) modeSection.style.display = 'none';
        }
    };

    function handleRecordClick(e) {
        if (container.contains(e.target)) return;
        
        const actionData = {
            action: 'click',
            value: '',
            wait_after_ms: 1000
        };

        if (window.__useCoordinates) {
            actionData.x = e.clientX;
            actionData.y = e.clientY;
            window.__logOverlay.addLog(`Klik geregistreerd op (${e.clientX}, ${e.clientY})`, "INFO");
        } else {
            actionData.selector = getSelector(e.target);
        }

        if (window.pythonRecordAction) {
            window.pythonRecordAction(actionData);
        }
    }

    function handleRecordInput(e) {
        if (container.contains(e.target)) return;
        const selector = getSelector(e.target);
        if (window.pythonRecordAction) {
            window.pythonRecordAction({
                action: 'fill',
                selector: selector,
                value: e.target.value,
                wait_after_ms: 1000
            });
        }
    }

    function handleSelectionClick(e) {
        if (container.contains(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        const selector = getSelector(e.target);
        
        if (window.__selectionMode === 'scrape') {
            if (window.pythonRecordAction) {
                window.pythonRecordAction({
                    action: 'scrape',
                    selector: selector,
                    value: '', // Wordt tijdens runtime ingevuld
                    wait_after_ms: 1000
                });
            }
            window.__setSelectionMode(false);
            window.__logOverlay.addLog("Scrape actie toegevoegd voor: " + selector, "SUCCESS");
        } else {
            if (window.pythonCaptureSelector) {
                window.pythonCaptureSelector(selector);
            }
        }
    }

    function handleSelectionMouseOver(e) {
        if (container.contains(e.target)) return;
        if (window.__lastHighlighted) {
            window.__lastHighlighted.style.outline = '';
        }
        e.target.style.outline = '2px solid #64B5F6';
        window.__lastHighlighted = e.target;
    }

    function getSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) {
            const classes = Array.from(el.classList).join('.');
            if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
        }
        return el.tagName.toLowerCase();
    }

    function init() {
        if (document.getElementById('automation-log-overlay')) return;
        
        if (!document.body) {
            setTimeout(init, 100);
            return;
        }
        
        document.body.appendChild(container);
        console.log("Automation Monitor overlay injected");
        
        // Flush buffered logs
        if (window.__logBuffer) {
            window.__logBuffer.forEach(log => window.__logOverlay.addLog(log.msg, log.level));
            window.__logBuffer = [];
        }

        // Check initial state from python
        if (window.pythonGetState) {
            window.pythonGetState().then(state => {
                if (state.is_recording) window.__setRecordingMode(true, state.use_coordinates);
                if (state.is_selection_mode) window.__setSelectionMode(true);
                if (state.current_step) window.__logOverlay.updateStatus(state.current_step, state.current_detail);
            }).catch(err => console.error("Error getting state:", err));
        }

        // Periodic check to ensure overlay is still there (some sites might clear body)
        // Also use MutationObserver for faster response
        const observer = new MutationObserver((mutations) => {
            if (!document.getElementById('automation-log-overlay') && document.body) {
                document.body.appendChild(container);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setInterval(() => {
            if (!document.getElementById('automation-log-overlay') && document.body) {
                document.body.appendChild(container);
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
"""


from storage.saver import DataSaver
from utils.helpers import generate_run_id, sanitize_filename
from config.config_manager import ScraperConfig, LoginStep

@dataclass
class RunStatus:
    """Status informatie voor een run"""
    is_running: bool = False
    current_book: str = ""
    current_chapter: int = 0
    total_chapters: int = 0
    current_paragraph: int = 0
    total_paragraphs: int = 0
    items_processed: int = 0
    total_items: int = 0
    
class NavigationInterrupt(Exception):
    """Exception om aan te geven dat de gebruiker een stap wil overslaan of terugspoelen"""
    def __init__(self, direction: int):
        self.direction = direction # 1 voor vooruit, -1 voor achteruit
        super().__init__(f"Navigation interrupt: {direction}")

class BookScrapeRunner(QObject):
    """Hoofd runner voor scraping met Playwright"""
    
    # Signalen voor GUI communicatie
    progress_update = pyqtSignal(int, int)  # current, total
    status_update = pyqtSignal(str)  # status message
    log_message = pyqtSignal(str, str)  # message, level
    error_occurred = pyqtSignal(str)  # error message
    captcha_detected = pyqtSignal(str, str)  # screenshot_path, html_dump
    finished = pyqtSignal()  # wanneer run klaar is
    book_found = pyqtSignal(list)  # list van (title, index)
    book_selection_needed = pyqtSignal()
    step_started = pyqtSignal(int)  # index van de stap die start
    step_finished = pyqtSignal(int, bool)  # index, success
    user_action_recorded = pyqtSignal(dict)  # actie, selector, waarde
    
    # Nieuwe signalen voor hiërarchische voortgang
    book_started = pyqtSignal(str)  # titel
    chapter_started = pyqtSignal(str, int)  # titel, index
    paragraph_started = pyqtSignal(str, int)  # titel, index
    item_completed = pyqtSignal(str, str, str)  # type (book/chapter/paragraph), status (✅/❌), info
    
    # Nieuwe signalen voor Phase 4
    metrics_updated = pyqtSignal(dict)  # Verzendt de samenvatting van metrics
    data_collected = pyqtSignal(dict)  # Verzendt de gescrapte data voor de live tabel
    selector_captured = pyqtSignal(str)  # Verzendt een CSS selector bij klik in selection mode

    def __init__(self, config: ScraperConfig, logger):
        super().__init__()
        self.config = config
        self.logger = logger
        
        # Metrics Tracker (Phase 4)
        from utils.metrics import MetricsTracker
        self.metrics = MetricsTracker()
        self.status = RunStatus()
        self.saver: Optional[DataSaver] = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.context: Optional[BrowserContext] = None
        self.is_running = True
        self.is_recording = False
        self.is_selection_mode = False
        self.captcha_paused = False
        self.run_id = generate_run_id()
        self.book_selection_paused = False
        self.selected_book_index: Optional[int] = None
        
        # Thread synchronisatie
        self.mutex = threading.Lock()
        self.book_selected_event = threading.Event()
        self.config_updated_event = asyncio.Event()
        self.last_executed_step_index = -1
        self.start_url_visited = False
        self.clicked_buttons_text = [] # Voor bestandsnaam generatie
        
    def log(self, message: str, level: str = "INFO"):
        """Log een bericht en stuur naar browser overlay indien beschikbaar"""
        try:
            self.log_message.emit(message, level)
        except RuntimeError:
            # Kan gebeuren als object al is verwijderd tijdens shutdown
            return
            
        if hasattr(self, 'logger') and self.logger:
            if hasattr(self.logger, level.lower()):
                getattr(self.logger, level.lower())(message)
            
        # Stuur naar browser overlay
        if self.page:
            try:
                # We gebruiken een veilige manier om JS uit te voeren
                # We moeten controleren of de overlay nog bestaat (bijv. na navigatie)
                asyncio.create_task(self._push_log_to_browser(message, level))
            except:
                pass

    async def update_overlay_status(self, step: str, detail: str = ""):
        """Update de status in de browser overlay"""
        # Sla op voor persistentie bij navigatie
        self._current_overlay_step = step
        self._current_overlay_detail = detail
        
        if not self.page:
            return
            
        try:
            # Update status direct als mogelijk
            await self.page.evaluate(f"window.__logOverlay.updateStatus({json.dumps(step)}, {json.dumps(detail)})")
        except:
            pass

    async def _push_log_to_browser(self, message: str, level: str):
        """Push een log bericht naar de browser overlay"""
        if not self.page:
            return
            
        try:
            # Zorg dat overlay bestaat
            await self.page.evaluate(OVERLAY_JS)
            # Voeg log toe
            await self.page.evaluate(f"window.__logOverlay.addLog({json.dumps(message)}, {json.dumps(level)})")
        except:
            # Kan gebeuren als pagina gesloten wordt of navigeert
            pass

    def update_config(self, new_config: ScraperConfig):
        """Bijwerken van configuratie vanuit GUI"""
        with self.mutex:
            self.config = new_config
            # Trigger event in de event loop
            if hasattr(self, 'loop') and self.loop:
                self.loop.call_soon_threadsafe(self.config_updated_event.set)

    def set_recording(self, enabled: bool, use_coordinates: bool = False):
        """Activeer of deactiveer de recorder vanuit de GUI"""
        self.is_recording = enabled
        self.use_coordinate_recording = use_coordinates
        if enabled and hasattr(self, 'loop') and self.loop:
            asyncio.run_coroutine_threadsafe(self._setup_recording_listeners(), self.loop)

    def set_selection_mode(self, enabled: bool):
        """Activeer of deactiveer de element selectie modus"""
        self.is_selection_mode = enabled
        if enabled and hasattr(self, 'loop') and self.loop:
            asyncio.run_coroutine_threadsafe(self._setup_selection_listeners(), self.loop)
        
        # Schakel visuele feedback in de browser in/uit
        if hasattr(self, 'loop') and self.loop:
            asyncio.run_coroutine_threadsafe(
                self.page.evaluate(f"window.__setSelectionMode({json.dumps(enabled)})"), 
                self.loop
            )
            
    async def _setup_recording_listeners(self):
        """Activeer de recording listeners in de browser via de overlay"""
        if not self.page:
            return
        try:
            use_coords = getattr(self, "use_coordinate_recording", False)
            await self.page.evaluate(f"window.__setRecordingMode({json.dumps(True)}, {json.dumps(use_coords)})")
        except: pass

    async def _setup_selection_listeners(self):
        """Activeer de selection listeners in de browser via de overlay"""
        if not self.page:
            return
        try:
            await self.page.evaluate(f"window.__setSelectionMode({json.dumps(True)})")
        except: pass

    async def run(self):
        """Asynchrone hoofd run functie - CONTINU EN LIVE VERSIE met robuuste foutafhandeling"""
        self.loop = asyncio.get_running_loop()
        
        # Voor herstel bij crashes
        max_total_retries = 5
        total_retries = 0
        
        while self.is_running and total_retries < max_total_retries:
            try:
                self.log(f"Runner start/herstart (Live Mode, poging {total_retries + 1})", "INFO")
                self.status_update.emit("Runner initialiseren...")
                
                # Initialiseer saver indien nog niet gedaan
                if not self.saver:
                    self.saver = DataSaver(self.config.output, self.run_id)
                
                # Start browser indien nog niet gestart
                if not self.browser and not self.context:
                    await self.setup_browser()
                
                # Hoofd loop voor continu luisteren naar updates
                while self.is_running:
                    try:
                        # Wacht op configuratie update of periodieke check
                        self.config_updated_event.clear()
                        
                        # Navigeer naar start URL indien niet in resume mode en nog niet bezocht
                        if not self.config.browser.resume_mode and not self.start_url_visited:
                            if self.page:
                                self.log(f"Navigeren naar start URL: {self.config.start_url}", "INFO")
                                self.status_update.emit(f"Navigeren naar {self.config.start_url}")
                                try:
                                    await self.page.goto(
                                        self.config.start_url,
                                        timeout=self.config.timeouts.navigation,
                                        wait_until="networkidle"
                                    )
                                    self.log(f"Pagina geladen: {self.page.url}", "SUCCESS")
                                    self.start_url_visited = True
                                except Exception as e:
                                    self.log(f"Fout bij navigeren naar start URL: {str(e)}", "ERROR")
                                    # Probeer het later opnieuw als het mislukt
                        
                        # Voer nieuwe login/automatisering stappen uit (NIET als we aan het opnemen zijn)
                        steps = self.config.login.login_steps
                        if not self.is_recording and len(steps) > self.last_executed_step_index + 1:
                            start_idx = self.last_executed_step_index + 1
                            
                            # Gebruik de nieuwe sequence executor die lussen ondersteunt
                            try:
                                await self._execute_sequence(steps, start_idx)
                                self.last_executed_step_index = len(steps) - 1
                            except Exception as seq_error:
                                self.log(f"Fout tijdens uitvoering van stappen: {str(seq_error)}", "ERROR")
                                # We gaan toch door
                                self.last_executed_step_index = len(steps) - 1
                        
                        # Als auto_scrape aan staat, doe dan de normale flow (NIET als we aan het opnemen zijn)
                        if not self.is_recording and self.config.auto_scrape:
                            # Zoek boeken
                            try:
                                books = await self.find_books()
                                if books:
                                    self.book_found.emit(books)
                                    self.book_selection_paused = True
                                    self.book_selection_needed.emit()
                                    self.status_update.emit("Wacht op boek selectie...")
                                    await self.wait_for_book_selection()
                                    if self.selected_book_index is not None:
                                        await self.select_book(self.selected_book_index)
                                        await self.scrape_content()
                            except Exception as scrape_error:
                                self.log(f"Fout tijdens scraping flow: {str(scrape_error)}", "ERROR")
                            
                        self.status_update.emit("Wachten op nieuwe acties...")
                        
                        # Periodieke garbage collection voor geheugenbeheer bij lange runs
                        import gc
                        gc.collect()
                        
                        # Wacht op configuratie update
                        try:
                            # Gebruik een timeout bij het wachten zodat we periodiek kunnen "ademen"
                            await asyncio.wait_for(self.config_updated_event.wait(), timeout=60.0)
                            self.log("Configuratie update ontvangen", "INFO")
                        except asyncio.TimeoutError:
                            # Geen update ontvangen in 60 sec, gewoon doorgaan naar volgende loop iteratie
                            pass

                    except Exception as e:
                        # Interne loop fout - log en probeer te herstellen zonder browser te sluiten
                        self.log(f"Waarschuwing in hoofdloop: {str(e)}", "WARNING")
                        await asyncio.sleep(2) # Korte pauze voor herstel
                        
                # Als we hier komen is is_running False
                break

            except Exception as e:
                total_retries += 1
                error_msg = f"Kritieke run fout (poging {total_retries}): {str(e)}"
                self.log(error_msg, "ERROR")
                
                if total_retries >= max_total_retries:
                    self.error_occurred.emit(f"Runner gestopt na {max_total_retries} kritieke fouten: {str(e)}")
                    break
                
                # Probeer browser te herstarten bij kritieke fout
                self.log("Poging tot herstel: Browser afsluiten en opnieuw opstarten...", "INFO")
                await self.cleanup()
                self.start_url_visited = False
                self.last_executed_step_index = -1 # Reset stappen bij volledige herstart
                await asyncio.sleep(5) # Wacht even voor herstart

        self.log("Runner proces voltooid", "INFO")
        # Sluit browser alleen als expliciet gevraagd
        await self.cleanup()
        self.finished.emit()

    def stop(self):
        """Stop de runner onmiddellijk"""
        self.log("Runner stop aangevraagd", "WARNING")
        self.is_running = False
        
        # Verbreek eventuele wacht-lussen in de event loop
        if hasattr(self, 'loop') and self.loop:
            self.loop.call_soon_threadsafe(self.config_updated_event.set)
            self.book_selected_event.set()
            
        # Zet is_running op False in de browser overlay
        if self.page:
            asyncio.run_coroutine_threadsafe(
                self.page.evaluate("if(window.__logOverlay) { localStorage.setItem('isPaused', 'false'); window.isPaused = false; }"),
                self.loop
            ) if hasattr(self, 'loop') else None

    async def check_status(self):
        """
        Controleert de status van de run (pauze, stop, skip).
        Wordt aangeroepen voor elke belangrijke actie.
        """
        if not self.is_running:
            raise asyncio.CancelledError("Runner gestopt")

        if not self.page:
            return

        try:
            # Controleer status in browser overlay
            status = await self.page.evaluate("""() => {
                return {
                    isPaused: localStorage.getItem('isPaused') === 'true',
                    skipDirection: parseInt(localStorage.getItem('skipDirection') || '0')
                };
            }""")

            # Verwerk skip/rewind (NavigationInterrupt)
            skip_direction = status.get('skipDirection', 0)
            if skip_direction != 0:
                # Reset skipDirection in browser
                await self.page.evaluate("localStorage.setItem('skipDirection', '0'); window.skipDirection = 0;")
                self.log(f"Navigatie interrupt gedetecteerd: {'vooruit' if skip_direction > 0 else 'achteruit'}", "INFO")
                raise NavigationInterrupt(skip_direction)

            # Verwerk pauze
            if status.get('isPaused', False):
                self.log("Run gepauzeerd via browser overlay...", "WARNING")
                self.status_update.emit("Gepauzeerd via overlay")
                
                while self.is_running:
                    # Check of pauze is opgeheven
                    is_paused = await self.page.evaluate("localStorage.getItem('isPaused') === 'true'")
                    if not is_paused:
                        self.log("Run hervat via browser overlay", "SUCCESS")
                        self.status_update.emit("Hervat...")
                        break
                        
                    # Check ook voor skip tijdens pauze
                    skip_direction = await self.page.evaluate("parseInt(localStorage.getItem('skipDirection') || '0')")
                    if skip_direction != 0:
                        await self.page.evaluate("localStorage.setItem('skipDirection', '0'); window.skipDirection = 0;")
                        raise NavigationInterrupt(skip_direction)
                        
                    await asyncio.sleep(0.5)

        except NavigationInterrupt:
            raise
        except asyncio.CancelledError:
            raise
        except Exception as e:
            # Bijv. als pagina navigeert of gesloten is, negeer en ga door
            pass

    async def _execute_sequence(self, steps, start_index=0):
        """Voert een reeks stappen uit, met ondersteuning voor lussen"""
        i = start_index
        while i < len(steps):
            await self.check_status() # Check status aan begin van elke stap
            
            if not self.is_running:
                break
                
            step = steps[i]
            
            # Als we in een loop zitten en een 'end_loop' tegenkomen, stoppen we deze sequence
            if step.action == "end_loop":
                return i
            
            try:
                # Als we een loop starten
                if step.action in ["loop_books", "loop_chapters", "loop_paragraphs"]:
                    # De _run_loop methode zal de stappen binnen de loop uitvoeren
                    # en de index teruggeven van waar we gebleven zijn (na de end_loop)
                    i = await self._run_loop(steps, i)
                else:
                    # Normale stap uitvoering
                    await self._execute_step(step, i + 1, len(steps))
                
                i += 1
                
            except NavigationInterrupt as ni:
                self.log(f"Stap onderbroken, richting: {ni.direction}", "INFO")
                # Pas index aan op basis van richting
                # Let op: i wordt aan het einde van de loop nog eens met 1 verhoogd (of we doen het hier handmatig)
                # Bij skip (1): we willen naar i+1, maar de loop doet i += 1. Dus i laten we zo.
                # Bij rewind (-1): we willen naar i-1. Omdat loop i += 1 doet, zetten we i op i-2.
                if ni.direction > 0:
                    self.log(f"Stap {i+1} overgeslagen", "INFO")
                    i += 1 # Ga naar volgende stap
                else:
                    self.log(f"Terug naar stap {max(1, i)}", "INFO")
                    i = max(0, i - 1) # Ga naar vorige stap
                
                # We gaan NIET i += 1 doen aan het einde van deze specifieke iteratie als we een interrupt hadden
                # Maar de `while` loop gaat gewoon door. 
                # Wacht even om te voorkomen dat we in een razendsnelle loop komen als iemand de knop ingedrukt houdt
                await asyncio.sleep(0.5)
                continue 

        return i

    async def _run_loop(self, steps, loop_start_index):
        """Voert een lus uit over een verzameling elementen"""
        loop_step = steps[loop_start_index]
        collection_selector = loop_step.selector
        
        self.log(f"Start lus: {loop_step.action} op {collection_selector}", "INFO")
        
        # Vind alle elementen in de collectie
        try:
            # We moeten de elementen elke keer opnieuw zoeken als de pagina navigeert
            # maar voor nu gaan we ervan uit dat de lijst persistent is of we navigeren terug
            elements = await self.page.query_selector_all(collection_selector)
            self.log(f"Lus gevonden: {len(elements)} elementen", "INFO")
            
            # Vind de bijbehorende end_loop stap om te weten welke stappen herhaald moeten worden
            loop_end_index = -1
            for j in range(loop_start_index + 1, len(steps)):
                if steps[j].action == "end_loop":
                    loop_end_index = j
                    break
            
            if loop_end_index == -1:
                self.log("Waarschuwing: Geen 'end_loop' gevonden voor lus. Lus wordt overgeslagen.", "WARNING")
                return loop_start_index
            
            # Stappen binnen de lus
            inner_steps = steps[loop_start_index + 1 : loop_end_index]
            
            # Voer de lus uit voor elk element
            indices_to_run = loop_step.indices
            
            # Gebruik globale indices als specifieke indices leeg zijn
            if indices_to_run is None or len(indices_to_run) == 0:
                if loop_step.action == "loop_books":
                    indices_to_run = self.config.target.books
                elif loop_step.action == "loop_chapters":
                    indices_to_run = self.config.target.chapters
                elif loop_step.action == "loop_paragraphs":
                    indices_to_run = self.config.target.paragraphs
            
            # Als er nog steeds geen indices zijn, gebruik alle gevonden elementen
            if indices_to_run is None or len(indices_to_run) == 0:
                indices_to_run = range(len(elements))
            
            for idx in indices_to_run:
                if not self.is_running:
                    break
                    
                self.log(f"Lus iteratie {idx + 1}/{len(elements)}", "INFO")
                
                # Zoek elementen opnieuw omdat de DOM veranderd kan zijn na navigatie
                elements = await self.page.query_selector_all(collection_selector)
                if idx >= len(elements):
                    self.log(f"Waarschuwing: Index {idx} buiten bereik (totaal {len(elements)} elementen)", "WARNING")
                    continue
                
                element = elements[idx]
                
                await self.check_status() # Check status voor elke iteratie
                
                # Update status
                if loop_step.action == "loop_books":
                    try:
                        title = await element.inner_text()
                        self.status.current_book = title.strip()
                    except:
                        self.status.current_book = f"Boek {idx + 1}"
                    self.book_started.emit(self.status.current_book)
                elif loop_step.action == "loop_chapters":
                    self.status.current_chapter = idx + 1
                    self.chapter_started.emit(f"Hoofdstuk {idx + 1}", idx + 1)
                else:
                    self.status.current_paragraph = idx + 1
                    self.paragraph_started.emit(f"Paragraaf {idx + 1}", idx + 1)
                
                await self.check_status()
                
                # Klik op het element om naar het item te gaan
                retry_count = 0
                while self.is_running:
                    await self.check_status()
                    try:
                        # Zoek elementen opnieuw omdat de DOM veranderd kan zijn na navigatie
                        elements = await self.page.query_selector_all(collection_selector)
                        if idx >= len(elements):
                            self.log(f"Waarschuwing: Index {idx} buiten bereik (totaal {len(elements)} elementen)", "WARNING")
                            break # Ga naar volgende item in de lijst als deze niet meer bestaat
                        
                        element = elements[idx]
                        
                        # Scroll naar element voor de zekerheid
                        await element.scroll_into_view_if_needed()
                        await element.click()
                        await self.page.wait_for_load_state("networkidle")
                        await asyncio.sleep(1) # Korte pauze na klik
                        break # Succes! Verlaat de retry loop
                    except Exception as e:
                        retry_count += 1
                        self.log(f"Fout bij klikken op lus-item {idx + 1} (poging {retry_count}): {str(e)}", "WARNING")
                        self.log("Stap mislukt. Bezig met oneindig herhalen...", "INFO")
                        await asyncio.sleep(2) # Wacht even voor volgende poging
                
                if not self.is_running:
                    break
                
                # Voer de stappen binnen de lus uit
                await self._execute_sequence(inner_steps, 0)
                
                self.item_completed.emit("paragraph" if loop_step.action == "loop_paragraphs" else "chapter", "✅", "Voltooid")
            
            return loop_end_index
            
        except Exception as e:
            self.log(f"Fout in lus uitvoering: {str(e)}", "ERROR")
            # Zoek end_loop om verder te gaan
            for j in range(loop_start_index + 1, len(steps)):
                if steps[j].action == "end_loop":
                    return j
            return loop_start_index

    async def _execute_step(self, step, step_num, total_steps):
        """Voer een enkele login/automatisering stap uit"""
        # Sla loop-gerelateerde stappen over, deze worden door _execute_sequence afgehandeld
        if step.action in ["loop_books", "loop_chapters", "loop_paragraphs", "end_loop"]:
            return

        action_desc = f"{step.action} op {step.selector}" if step.selector else (f"{step.action} op ({step.x}, {step.y})" if step.x is not None else f"{step.action}")
        self.status_update.emit(f"Stap {step_num}/{total_steps}: {action_desc}...")
        self.log(f"Uitvoeren van automatisering stap {step_num}/{total_steps}: {action_desc}", "INFO")
        
        # Update overlay status
        asyncio.create_task(self.update_overlay_status(f"Stap {step_num}/{total_steps}", action_desc))
        
        # Meld dat we starten met deze stap (step_num is 1-based, we willen 0-based index)
        self.step_started.emit(step_num - 1)

        # Visuele feedback: highlight element voor actie (alleen als we een selector hebben)
        if step.selector and step.action in ["click", "fill", "scrape"]:
            try:
                await self.page.evaluate(f"window.__logOverlay.highlight({json.dumps(step.selector)})")
                await asyncio.sleep(0.5) # Korte pauze voor visuele feedback
            except: pass
        
        retry_count = 0
        while self.is_running:
            await self.check_status() # Check status voor elke retry
            success = False
            try:
                # Wacht op selector of gebruik coördinaten
                element = None
                
                # Als we coördinaten hebben voor een klik
                if step.action == "click" and step.x is not None and step.y is not None:
                    self.log(f"Klikken op coördinaten: ({step.x}, {step.y})", "INFO")
                    await self.page.mouse.click(step.x, step.y)
                    self.log(f"Succesvol geklikt op ({step.x}, {step.y})", "SUCCESS")
                
                # Anders via selector
                elif step.selector and step.action not in ["wait", "scrape"]:
                    self.log(f"Wachten op element met selector: {step.selector}...", "DEBUG")
                    element = await self.page.wait_for_selector(
                        step.selector,
                        timeout=self.config.timeouts.selector
                    )
                
                if step.action == "click" and element:
                    self.log(f"Klikken op element: {step.selector}", "INFO")
                    # Haal tekst van button op voor bestandsnaam generatie
                    try:
                        btn_text = await element.inner_text()
                        if btn_text.strip():
                            self.clicked_buttons_text.append(btn_text.strip())
                    except:
                        pass
                    await element.click()
                    self.log(f"Succesvol geklikt op {step.selector}", "SUCCESS")
                elif step.action == "fill" and element:
                    safe_value = "***" if "password" in step.selector.lower() or "wachtwoord" in step.selector.lower() else step.value
                    self.log(f"Invullen van '{safe_value}' in element: {step.selector}", "INFO")
                    await element.fill(step.value)
                    self.log(f"Succesvol ingevuld in {step.selector}", "SUCCESS")
                elif step.action == "wait":
                    if step.expected_element:
                        self.log(f"Wachten op verwacht element: {step.expected_element}...", "INFO")
                        await self.page.wait_for_selector(step.expected_element, timeout=self.config.timeouts.selector)
                        self.log(f"Verwacht element gevonden: {step.expected_element}", "SUCCESS")
                    else:
                        self.log(f"Wachten voor {step.wait_after_ms}ms...", "INFO")
                        await asyncio.sleep(step.wait_after_ms / 1000)
                
                elif step.action == "scroll":
                    direction = step.value.lower() if step.value else "down"
                    amount = int(step.selector) if step.selector and step.selector.isdigit() else 500
                    self.log(f"Scrollen: {direction} ({amount}px)", "INFO")
                    if direction == "up":
                        await self.page.evaluate(f"window.scrollBy(0, -{amount})")
                    else:
                        await self.page.evaluate(f"window.scrollBy(0, {amount})")
                    self.log(f"Succesvol gescrold", "SUCCESS")

                elif step.action == "screenshot":
                    name = step.value or f"step_{step_num}"
                    self.log(f"Screenshot maken: {name}...", "INFO")
                    error_dir = Path(self.config.output.output_dir) / "screenshots"
                    error_dir.mkdir(parents=True, exist_ok=True)
                    filepath = error_dir / f"{name}_{int(time.time())}.png"
                    await self.page.screenshot(path=str(filepath), full_page=False)
                    self.log(f"Screenshot opgeslagen: {filepath.name}", "SUCCESS")
                
                elif step.action == "scrape":
                    await self._scrape_current_page(step.selector)

                # Algemene wacht na stap
                if step.wait_after_ms > 0:
                    await asyncio.sleep(step.wait_after_ms / 1000)
                
                success = True
                self.step_finished.emit(step_num - 1, success)
                return # Succesvol voltooid, verlaat de functie
                
            except Exception as e:
                retry_count += 1
                self.log(f"Automatisering stap {step_num} mislukt (poging {retry_count}): {str(e)}", "WARNING")
                
                # Screenshot capture bij mislukte stap (alleen bij de eerste fout of elke 5 pogingen)
                if retry_count == 1 or retry_count % 5 == 0:
                    try:
                        screenshot_path = await self._take_error_screenshot(step_num, step.action)
                        if screenshot_path:
                            self.log(f"Screenshot van fout opgeslagen: {screenshot_path}", "INFO")
                    except Exception as ss_err:
                        self.log(f"Screenshot maken mislukt: {str(ss_err)}", "DEBUG")

                self.log("Stap mislukt. Bezig met herhalen...", "INFO")
                # Update status voor UI feedback
                self.step_finished.emit(step_num - 1, False)
                await asyncio.sleep(2) # Wacht even voor volgende poging
                
                if not self.is_running:
                    break

    async def _take_error_screenshot(self, step_num: int, action: str) -> Optional[str]:
        """Maakt een screenshot bij een fout en slaat deze op"""
        if not self.page:
            return None
            
        try:
            # Maak een errors directory in de output map
            error_dir = Path(self.config.output.output_dir) / "errors"
            error_dir.mkdir(parents=True, exist_ok=True)
            
            # Genereer bestandsnaam
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"error_step{step_num}_{action}_{timestamp}.png"
            filepath = error_dir / filename
            
            # Neem screenshot
            await self.page.screenshot(path=str(filepath), full_page=False)
            return str(filename)
        except:
            return None

    async def _scrape_current_page(self, selector):
        """Scrape tekst van de huidige pagina via selector"""
        self.log(f"Scrapen van tekst via selector: {selector}...", "INFO")
        try:
            element = await self.page.wait_for_selector(selector, timeout=self.config.timeouts.selector)
            if element:
                text = await element.inner_text()
                text = text.strip()
                
                # Genereer bestandsnaam op basis van geklikte buttons en huidige status
                parts = []
                if self.status.current_book: parts.append(self.status.current_book)
                if self.status.current_chapter: parts.append(f"H{self.status.current_chapter}")
                if self.status.current_paragraph: parts.append(f"P{self.status.current_paragraph}")
                
                # Voeg laatst geklikte button toe als extra context
                if self.clicked_buttons_text:
                    parts.append(self.clicked_buttons_text[-1])
                
                filename_base = "_".join(parts) if parts else "scraped_text"
                
                # Verwijder ongeldige tekens voor Windows bestandsnamen
                import re
                filename_base = re.sub(r'[\\/*?:"<>|]', "", filename_base).replace(" ", "_")[:100]
                
                filename = f"{filename_base}_{int(time.time())}.txt"
                
                # Zorg dat de directory bestaat (saver heeft deze al ingesteld voor het boek)
                output_path = Path(self.config.output.output_dir) / filename
                
                # Gebruik saver om data op te slaan indien mogelijk, anders direct
                if self.saver:
                    # We kunnen de saver uitbreiden of hier direct schrijven
                    with open(output_path, "w", encoding="utf-8") as f:
                        f.write(text)
                else:
                    with open(output_path, "w", encoding="utf-8") as f:
                        f.write(text)
                    
                self.log(f"Tekst opgeslagen in: {filename}", "SUCCESS")
                self.data_collected.emit({
                    "Hoofdstuk": self.status.current_chapter,
                    "Paragraaf": self.status.current_paragraph,
                    "Type": "Scrape",
                    "Bestand": filename,
                    "Tijd": datetime.now().strftime("%H:%M:%S")
                })
            else:
                self.log(f"Element niet gevonden voor scrape: {selector}", "WARNING")
        except Exception as e:
            self.log(f"Scrape mislukt: {str(e)}", "ERROR")
            
    async def setup_browser(self):
        """Stel Playwright browser in"""
        self.status_update.emit("Browser starten...")
        
        playwright = await async_playwright().start()
        
        success = False
        if self.config.browser.attach_to_existing:
            self.status_update.emit(f"Verbinden met Chrome op {self.config.browser.cdp_url}...")
            try:
                # Kortere timeout voor CDP verbinding om sneller fallback te triggeren
                self.browser = await playwright.chromium.connect_over_cdp(
                    self.config.browser.cdp_url,
                    timeout=5000
                )
                # Voor CDP verbindingen hebben we meestal maar één context
                if self.browser.contexts:
                    self.context = self.browser.contexts[0]
                    # Als er al pagina's zijn, gebruik de laatste
                    if self.context.pages:
                        self.page = self.context.pages[-1]
                    else:
                        self.page = await self.context.new_page()
                else:
                    self.context = await self.browser.new_context()
                    self.page = await self.context.new_page()
                    
                self.log(f"Verbonden met bestaande Chrome instance via CDP", "INFO")
                success = True
            except Exception as e:
                self.log(f"Kon niet verbinden via CDP: {str(e)}. Fallback naar nieuwe browser...", "WARNING")
                # We gaan door naar de reguliere launch sectie
        
        if not success:
            if self.config.browser.use_persistent_context:
                self.log(f"Nieuwe persistent context starten: {self.config.browser.user_data_dir}", "INFO")
                self.context = await playwright.chromium.launch_persistent_context(
                    user_data_dir=self.config.browser.user_data_dir,
                    headless=False, # Forceer zichtbaar venster
                    viewport={"width": 1280, "height": 720},
                    args=["--start-maximized"] # Sneller bruikbaar
                )
                if self.context.pages:
                    self.page = self.context.pages[0]
                else:
                    self.page = await self.context.new_page()
            else:
                self.log("Nieuwe browser instance starten...", "INFO")
                self.browser = await playwright.chromium.launch(
                    headless=False, # Forceer zichtbaar venster
                    args=["--start-maximized"]
                )
                self.context = await self.browser.new_context(
                    viewport={"width": 1280, "height": 720}
                )
                self.page = await self.context.new_page()

        # Direct feedback geven dat browser er is
        await self.update_overlay_status("Browser gereed", "Wachten op navigatie...")
            
        # Pas Stealth Mode toe indien ingeschakeld
        if self.config.browser.use_stealth and HAS_STEALTH:
            self.log("Stealth Mode inschakelen...", "INFO")
            await stealth_async(self.page)
        elif self.config.browser.use_stealth and not HAS_STEALTH:
            self.log("Stealth Mode geconfigureerd maar playwright-stealth is niet geïnstalleerd", "WARNING")
            
        # Stel timeouts in
        self.page.set_default_timeout(self.config.timeouts.selector)
        self.page.set_default_navigation_timeout(self.config.timeouts.navigation)
        
        # Voeg extra netwerk-fout tolerantie toe
        # We gebruiken een wrapper voor page.goto om retries te ondersteunen
        original_goto = self.page.goto
        
        async def robust_goto(url, **kwargs):
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    return await original_goto(url, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    self.log(f"Navigatie poging {attempt + 1} mislukt voor {url}: {str(e)}. Retry...", "WARNING")
                    await asyncio.sleep(2 * (attempt + 1))
        
        self.page.goto = robust_goto
        
        # Intercept requests om CAPTCHA te detecteren
        await self.context.route("**/*", self.handle_route)

        # Setup bindings EERST (zodat ze beschikbaar zijn voor de init script)
        try:
            await self.context.expose_binding(
                "pythonGetState",
                lambda source: {
                    "is_recording": self.is_recording,
                    "is_selection_mode": self.is_selection_mode,
                    "use_coordinates": getattr(self, "use_coordinate_recording", False),
                    "current_step": getattr(self, "_current_overlay_step", ""),
                    "current_detail": getattr(self, "_current_overlay_detail", "")
                }
            )
        except: pass

        try:
            await self.context.expose_binding(
                "pythonRecordAction", 
                lambda source, action: self.user_action_recorded.emit(action)
            )
        except: pass

        try:
            await self.context.expose_binding(
                "pythonCaptureSelector", 
                lambda source, selector: self.selector_captured.emit(selector)
            )
        except: pass

        # Setup persistent scripts op context niveau
        await self.context.add_init_script(OVERLAY_JS)
        
        # Luister naar nieuwe pagina's
        self.context.on("page", self._on_new_page)

        # Setup recording if enabled
        if self.is_recording:
            await self._setup_recording_listeners()
            
        if self.is_selection_mode:
            await self._setup_selection_listeners()

    def _on_new_page(self, page):
        """Wordt aangeroepen wanneer een nieuwe pagina (tab) wordt geopend"""
        self.page = page
        self.log(f"Nieuw tabblad geopend: {page.url}", "INFO")
        
        # Stel timeouts in voor de nieuwe pagina
        page.set_default_timeout(self.config.timeouts.selector)
        page.set_default_navigation_timeout(self.config.timeouts.navigation)
        
        # We hoeven de overlay niet handmatig te injecteren omdat we context.add_init_script gebruiken
        # De overlay zal zichzelf via pythonGetState configureren
            
    async def handle_route(self, route, request):
        """Route handler voor request intercepting"""
        # Controleer op CAPTCHA pagina's
        url = request.url.lower()
        captcha_indicators = ["captcha", "recaptcha", "hcaptcha", "cloudflare"]
        
        if any(indicator in url for indicator in captcha_indicators):
            self.log("CAPTCHA pagina gedetecteerd", "WARNING")
            await self.handle_captcha()
            
        # Video detectie indien ingeschakeld
        if self.config.output.download_videos:
            video_extensions = [".mp4", ".webm", ".m4v", ".mov"]
            if any(ext in url for ext in video_extensions) or request.resource_type == "media":
                self.log(f"Video gedetecteerd: {url}", "INFO")
                # Download video in de achtergrond
                asyncio.create_task(self.saver.save_media(
                    url, 
                    self.status.current_chapter, 
                    self.status.current_paragraph
                ))
                
        await route.continue_()
        
    async def handle_captcha(self):
        """Handle CAPTCHA detectie"""
        if self.captcha_paused:
            return
            
        self.captcha_paused = True
        self.log("CAPTCHA gedetecteerd - run gepauzeerd", "WARNING")
        self.status_update.emit("CAPTCHA gedetecteerd - wacht op handmatige oplossing")
        
        # Neem screenshot
        screenshot_path = self.saver.get_screenshot_path("captcha")
        await self.page.screenshot(path=screenshot_path, full_page=True)
        
        # Sla HTML op
        html_dump = await self.page.content()
        html_path = screenshot_path.with_suffix(".html")
        html_path.write_text(html_dump, encoding="utf-8")
        
        # Stuur signaal naar GUI
        self.captcha_detected.emit(str(screenshot_path), str(html_path))
        
        # Wacht op resume
        while self.captcha_paused and self.is_running:
            await asyncio.sleep(1)
            
    async def do_login(self):
        """Voer meerstaps login uit"""
        self.status_update.emit("Inloggen...")
        
        try:
            # Gebruik login_steps indien beschikbaar, anders oude methode
            if self.config.login.login_steps:
                await self._execute_login_steps()
            else:
                await self._legacy_login()
            
            self.log("Login succesvol", "SUCCESS")
            self.status_update.emit("Login succesvol")
            
        except Exception as e:
            self.log(f"Login mislukt: {str(e)}", "ERROR")
            raise

    async def _execute_login_steps(self):
        """Voer geconfigureerde login stappen uit"""
        steps = self.config.login.login_steps
        
        for i, step in enumerate(steps):
            if not self.is_running:
                break
                
            step_num = i + 1
            action_desc = f"{step.action} op {step.selector}" if step.selector else (f"{step.action} op ({step.x}, {step.y})" if step.x is not None else f"{step.action}")
            self.status_update.emit(f"Login stap {step_num}/{len(steps)}: {action_desc}...")
            
            try:
                # Wacht op selector of gebruik coördinaten
                element = None
                
                if step.action == "click" and step.x is not None and step.y is not None:
                    self.log(f"Login stap {step_num}: Klikken op coördinaten ({step.x}, {step.y})", "INFO")
                    await self.page.mouse.click(step.x, step.y)
                elif step.selector:
                    element = await self.page.wait_for_selector(
                        step.selector,
                        timeout=self.config.timeouts.selector
                    )
                    
                    if not element:
                        raise ValueError(f"Element niet gevonden: {step.selector}")
                
                # Voer actie uit via element (als we die hebben)
                if step.action == "click" and element:
                    await element.click()
                    self.log(f"Login stap {step_num}: Geklikt op {step.selector}", "INFO")
                    
                elif step.action == "fill":
                    if not step.value:
                        raise ValueError(f"Geen waarde opgegeven voor fill actie: {step.selector}")
                    
                    # Maak veilige kopie van waarde (voor loggen)
                    safe_value = step.value
                    if "password" in step.selector.lower() or "wachtwoord" in step.selector.lower():
                        safe_value = "***"  # Verberg wachtwoord in logs
                    
                    await element.fill(step.value)
                    self.log(f"Login stap {step_num}: Ingevuld in {step.selector}: {safe_value}", "INFO")
                    
                elif step.action == "wait":
                    # Wacht op specifiek element
                    if step.expected_element:
                        await self.page.wait_for_selector(
                            step.expected_element,
                            timeout=self.config.timeouts.selector
                        )
                    # Anders wacht de opgegeven tijd
                    else:
                        await asyncio.sleep(step.wait_after_ms / 1000)
                
                # Wacht na actie
                wait_time = step.wait_after_ms or 1000
                await asyncio.sleep(wait_time / 1000)
                
                # Wacht op eventuele navigatie
                try:
                    await self.page.wait_for_load_state("networkidle", timeout=3000)
                except:
                    pass  # Negeer timeout, niet elke stap veroorzaakt navigatie
                
                # Als er een expected_element is, wacht erop
                if step.expected_element and step.action != "wait":
                    try:
                        await self.page.wait_for_selector(
                            step.expected_element,
                            timeout=self.config.timeouts.selector
                        )
                    except:
                        self.log(f"Waarschuwing: Verwacht element niet gevonden na stap {step_num}: {step.expected_element}", "WARNING")
                
            except Exception as e:
                # Neem screenshot bij fout
                screenshot_path = self.saver.get_screenshot_path(f"login_error_step_{step_num}")
                await self.page.screenshot(path=screenshot_path, full_page=True)
                
                error_msg = f"Login stap {step_num} mislukt: {str(e)}"
                self.log(error_msg, "ERROR")
                raise ValueError(error_msg)

    async def _legacy_login(self):
        """Oude login methode voor backward compatibility"""
        username = self.config.login.username_value
        password = self.config.login.password_value
        
        if not username or not password:
            self.log("Geen login credentials gevonden", "ERROR")
            raise ValueError("Login credentials ontbreken")
        
        # School login knop (indien geconfigureerd)
        if self.config.login.school_login_button_selector:
            self.status_update.emit("School login selecteren...")
            await self.page.click(self.config.login.school_login_button_selector)
            await self.page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
        
        # Schoolnaam (indien geconfigureerd)
        if self.config.login.school_name_selector and self.config.login.school_name_value:
            self.status_update.emit("Schoolnaam invullen...")
            await self.page.fill(
                self.config.login.school_name_selector,
                self.config.login.school_name_value
            )
            await asyncio.sleep(1)
        
        # Username
        self.status_update.emit("Email invullen...")
        await self.page.fill(
            self.config.login.username_selector,
            username
        )
        await asyncio.sleep(1)
        
        # Password
        self.status_update.emit("Wachtwoord invullen...")
        await self.page.fill(
            self.config.login.password_selector,
            password
        )
        await asyncio.sleep(1)
        
        # Submit
        self.status_update.emit("Inloggen...")
        await self.page.click(self.config.login.submit_selector)
        
        # Wacht op navigatie
        await self.page.wait_for_load_state("networkidle")
            
    async def find_books(self) -> List[Tuple[str, int]]:
        """Zoek beschikbare boeken"""
        self.status_update.emit("Boeken zoeken...")
        
        try:
            # Wacht op book list selector
            await self.page.wait_for_selector(
                self.config.book_selection.book_list_selector,
                timeout=self.config.timeouts.selector
            )
            
            # Zoek boeken
            book_elements = await self.page.query_selector_all(
                self.config.book_selection.book_list_selector
            )
            
            books = []
            for i, book_el in enumerate(book_elements):
                try:
                    title_el = await book_el.query_selector(
                        self.config.book_selection.book_item_title_selector
                    )
                    if title_el:
                        title = await title_el.inner_text()
                        books.append((title.strip(), i))
                except:
                    continue
            
            return books
            
        except Exception as e:
            self.log(f"Kon boeken niet vinden: {str(e)}", "ERROR")
            return []

    async def wait_for_book_selection(self):
        """Wacht tot gebruiker een boek heeft geselecteerd"""
        while self.book_selection_paused and self.is_running:
            await self.check_status() # Ook hier pauze/skip checken
            await asyncio.sleep(0.5)

    def set_selected_book(self, index: int):
        """Stel geselecteerd boek in"""
        with self.mutex:
            self.selected_book_index = index
            self.book_selection_paused = False

    def resume_after_book_selection(self):
        """Hervat run na boek selectie"""
        self.book_selection_paused = False
        self.log("Run hervat na boek selectie", "INFO")
        self.status_update.emit("Run hervat...")

    async def select_book(self, book_index: int):
        """Selecteer een boek uit de lijst"""
        try:
            # Haal boek titel op voor weergave
            books = await self.find_books()
            if 0 <= book_index < len(books):
                title = books[book_index][0]
                self.status.current_book = title
                self.book_started.emit(title)
                self.log(f"Boek geselecteerd: {title}", "INFO")
            
            # Voer de selectie uit op de pagina
            book_elements = await self.page.query_selector_all(
                self.config.book_selection.book_list_selector
            )
            
            if book_index >= len(book_elements):
                self.log(f"Ongeldige boek index: {book_index} (totaal boeken: {len(book_elements)})", "ERROR")
                raise ValueError("Ongeldige boek index")
            
            # Haal titel op voor georganiseerde export
            title = "Unknown Book"
            try:
                title_el = await book_elements[book_index].query_selector(
                    self.config.book_selection.book_item_title_selector
                )
                if title_el:
                    title = await title_el.inner_text()
                    title = title.strip()
            except:
                pass
            
            # Initialiseer saver met boek titel en laad bestaande voortgang
            self.status.current_book = title
            self.status_update.emit(f"Boek '{title}' geselecteerd. Controleren op bestaande voortgang...")
            self.saver.setup_directories(title)
            self.saver.load_existing_progress(book_title=title)
            
            self.log(f"Bezig met openen van boek: '{title}' (index {book_index})", "INFO")
            
            # Navigeer naar het boek
            book_el = book_elements[book_index]
            await book_el.click()
            
            # Wacht op navigatie
            self.log(f"Wachten op laden van boek content voor '{title}'...", "INFO")
            await self.page.wait_for_load_state("networkidle")
            
            # Wacht op greeting selector
            await self.page.wait_for_selector(
                self.config.ui_structure.greeting_selector,
                timeout=self.config.timeouts.selector
            )
            
            self.log(f"Boek '{title}' succesvol geopend en geladen", "SUCCESS")
            
        except Exception as e:
            self.log(f"Fout bij selecteren van boek index {book_index}: {str(e)}", "ERROR")
            raise

    def run_sync(self):
        """Synchron wrapper voor async run"""
        try:
            # Maak nieuwe event loop voor deze thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Voer async run uit
            loop.run_until_complete(self.run())
            
        except Exception as e:
            self.log(f"Kritieke fout in runner thread: {str(e)}", "ERROR")
            self.error_occurred.emit(str(e))
            
        finally:
            # Zorg ervoor dat finished ALTIJD wordt verzonden, ook bij crash
            try:
                self.finished.emit()
            except:
                pass
            # Cleanup event loop
            asyncio.set_event_loop(None)
            
    async def scrape_content(self):
        """Scrape alle content (hoofdstukken, paragrafen, leerdoelen, leerstof)"""
        self.status_update.emit("Content scrapen...")
        
        try:
            # Zoek hoofdstukken
            chapter_elements = await self.page.query_selector_all(
                self.config.ui_structure.sidebar_chapter_selector
            )
            
            if not chapter_elements:
                self.log("Geen hoofdstukken gevonden", "WARNING")
                return
                
            self.status.total_chapters = len(chapter_elements)
            self.metrics.update_hierarchy(chapters=len(chapter_elements))
            self.log(f"{self.status.total_chapters} hoofdstuk(ken) gevonden", "INFO")
            
            # Loop door hoofdstukken
            for chapter_idx, chapter_el in enumerate(chapter_elements, start=1):
                if not self.is_running:
                    break
                    
                self.status.current_chapter = chapter_idx
                self.status_update.emit(f"Hoofdstuk {chapter_idx} verwerken...")
                
                # Signaal voor UI
                chapter_title = f"Hoofdstuk {chapter_idx}"
                try:
                    title_el = await chapter_el.query_selector(self.config.book_selection.book_item_title_selector)
                    if title_el:
                        chapter_title = await title_el.inner_text()
                except: pass
                self.chapter_started.emit(chapter_title, chapter_idx)
                
                await self.process_chapter(chapter_el, chapter_idx)
                self.item_completed.emit("chapter", "✅", "Voltooid")
                
            self.item_completed.emit("book", "✅", "Voltooid")
            self.log("Alle content succesvol gescraped", "SUCCESS")
            
        except Exception as e:
            self.log(f"Content scraping mislukt: {str(e)}", "ERROR")
            raise
            
    async def process_chapter(self, chapter_element, chapter_index: int):
        """Verwerk een hoofdstuk"""
        try:
            # Klik hoofdstuk
            self.log(f"Bezig met openen van hoofdstuk {chapter_index}...", "INFO")
            await chapter_element.click()
            await self.page.wait_for_load_state("networkidle")
            
            # Wacht op paragrafen container
            await self.page.wait_for_selector(
                self.config.ui_structure.chapter_paragraphs_container_selector,
                timeout=self.config.timeouts.selector
            )
            
            # Zoek paragrafen
            paragraph_elements = await self.page.query_selector_all(
                self.config.ui_structure.paragraph_button_selector
            )
            
            self.status.total_paragraphs = len(paragraph_elements)
            # Update metrics met totaal aantal paragrafen (items) voor ETA berekening
            current_total = self.metrics.data.total_items
            self.metrics.set_total_items(current_total + len(paragraph_elements))
            
            self.log(f"Hoofdstuk {chapter_index} geopend: {self.status.total_paragraphs} paragra(a)f(en) gevonden", "INFO")
            
            # Loop door paragrafen
            if self.config.browser.parallel_mode:
                self.log(f"Parallel scrapen ingeschakeld (max 3 tegelijk)", "INFO")
                semaphore = asyncio.Semaphore(3)
                tasks = []
                
                async def parallel_wrapper(p_idx, p_el_index):
                    async with semaphore:
                        if not self.is_running: return
                        
                        # Maak een nieuwe pagina voor dit item om navigatie-conflicten te voorkomen
                        new_page = await self.context.new_page()
                        try:
                            # Navigeer naar de huidige URL (het boek)
                            await new_page.goto(self.page.url)
                            await new_page.wait_for_load_state("networkidle")
                            
                            # Zoek het paragraaf element opnieuw op de nieuwe pagina
                            p_elements = await new_page.query_selector_all(
                                self.config.ui_structure.paragraph_button_selector
                            )
                            if p_idx - 1 < len(p_elements):
                                p_el = p_elements[p_idx - 1]
                                
                                # Signaal voor UI
                                para_title = f"Paragraaf {p_idx}"
                                try:
                                    para_title = await p_el.inner_text()
                                    para_title = para_title.split('\n')[0].strip()
                                except: pass
                                self.paragraph_started.emit(para_title, p_idx)
                                
                                await self.process_paragraph(p_el, chapter_index, p_idx, page=new_page)
                                self.item_completed.emit("paragraph", "✅", "Voltooid")
                        finally:
                            await new_page.close()

                for para_idx, _ in enumerate(paragraph_elements, start=1):
                    tasks.append(parallel_wrapper(para_idx, para_idx - 1))
                
                await asyncio.gather(*tasks)
            else:
                for para_idx, para_el in enumerate(paragraph_elements, start=1):
                    if not self.is_running:
                        break
                        
                    self.status.current_paragraph = para_idx
                    
                    # Signaal voor UI
                    para_title = f"Paragraaf {para_idx}"
                    try:
                        para_title = await para_el.inner_text()
                        para_title = para_title.split('\n')[0].strip() # Eerste regel
                    except: pass
                    self.paragraph_started.emit(para_title, para_idx)
                    
                    await self.process_paragraph(para_el, chapter_index, para_idx)
                    self.item_completed.emit("paragraph", "✅", "Voltooid")
                
        except Exception as e:
            self.log(f"Fout bij verwerken van hoofdstuk {chapter_index}: {str(e)}", "ERROR")
            # Ga door met volgend hoofdstuk
            
    async def process_paragraph(self, paragraph_element, chapter_index: int, paragraph_index: int, page: Optional[Page] = None):
        """Verwerk een paragraaf"""
        if page is None:
            page = self.page
            
        try:
            # Check of dit item al is geëxporteerd (Resume functionaliteit)
            if self.saver.is_completed(chapter_index, paragraph_index):
                self.log(f"Overslaan: Paragraaf {chapter_index}.{paragraph_index} is al geëxporteerd.", "INFO")
                self.status.items_processed += 1
                self.metrics.item_completed(success=True) # Ook meetellen voor progress
                self.metrics_updated.emit(self.metrics.get_summary())
                return

            self.status_update.emit(
                f"Paragraaf {chapter_index}.{paragraph_index} verwerken..."
            )
            self.log(f"Navigeren naar paragraaf {chapter_index}.{paragraph_index}...", "INFO")
            
            # Klik paragraaf
            try:
                # Probeer een selector te vinden voor het paragraaf element voor highlighting
                # Als het element een JS handle is, is het lastiger, maar we proberen het.
                await page.evaluate("(el) => { if (el) { window.__logOverlay.highlight(el); } }", paragraph_element)
            except:
                pass
                
            await paragraph_element.scroll_into_view_if_needed()
            await paragraph_element.click()
            
            # Wacht op content laden
            self.log(f"Wachten op laden van content voor paragraaf {chapter_index}.{paragraph_index}...", "INFO")
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(1)  # Korte pauze voor dynamic content
            
            # Haal leerdoelen op
            objectives_text = ""
            if self.config.ui_structure.learning_objectives_selector:
                self.log(f"Extraheren van leerdoelen uit {page.url}...", "DEBUG")
                try:
                    objectives_el = await page.wait_for_selector(
                        self.config.ui_structure.learning_objectives_selector,
                        timeout=self.config.timeouts.selector
                    )
                    if objectives_el:
                        objectives_text = await objectives_el.inner_text()
                except:
                    self.log(f"Geen leerdoelen gevonden voor paragraaf {chapter_index}.{paragraph_index}", "WARNING")
                    
            # Haal leerstof op
            lesson_text = ""
            if self.config.ui_structure.lesson_content_selector:
                self.log(f"Extraheren van leerstof uit {page.url}...", "DEBUG")
                try:
                    lesson_el = await page.wait_for_selector(
                        self.config.ui_structure.lesson_content_selector,
                        timeout=self.config.timeouts.selector
                    )
                    if lesson_el:
                        lesson_text = await lesson_el.inner_text()
                except:
                    self.log(f"Geen leerstof gevonden voor paragraaf {chapter_index}.{paragraph_index}", "WARNING")
                    
            # Haal custom velden op (Point-and-Click Engine)
            custom_data = {}
            for field in self.config.custom_fields:
                try:
                    # Highlight het veld in de browser
                    await page.evaluate(f"window.__logOverlay.highlight({json.dumps(field.selector)})")
                    
                    el = await page.query_selector(field.selector)
                    if el:
                        if field.action == "Tekst":
                            custom_data[field.name] = await el.inner_text()
                        elif field.action == "HTML":
                            custom_data[field.name] = await el.inner_html()
                        elif field.action == "Link (href)":
                            custom_data[field.name] = await el.get_attribute("href")
                        elif field.action == "Afbeelding (src)":
                            custom_data[field.name] = await el.get_attribute("src")
                        else:
                            custom_data[field.name] = await el.inner_text()
                    else:
                        custom_data[field.name] = ""
                except Exception as fe:
                    self.log(f"Fout bij extraheren van custom veld '{field.name}': {str(fe)}", "DEBUG")
                    custom_data[field.name] = ""

            # Haal afbeeldingen op indien ingeschakeld
            images = []
            if self.config.output.save_images and self.config.ui_structure.image_selector:
                self.log(f"Zoeken naar afbeeldingen in paragraaf {chapter_index}.{paragraph_index}...", "DEBUG")
                images = await self.extract_images(page)
                
            # Sla data op
            data = {
                "book": self.status.current_book,
                "chapter_index": chapter_index,
                "paragraph_index": paragraph_index,
                "objectives": objectives_text,
                "lesson": lesson_text,
                "custom_data": custom_data,
                "images": images,
                "url": page.url,
                "timestamp": datetime.now().isoformat()
            }
            
            # Signaleer live data naar de GUI
            self.data_collected.emit(data)
            
            self.log(f"Exporteren van data voor paragraaf {chapter_index}.{paragraph_index} naar bestand...", "INFO")
            filepath = await self.saver.save_data(data)
            
            if filepath:
                self.status.items_processed += 1
                self.metrics.paragraph_completed()
                self.metrics_updated.emit(self.metrics.get_summary())
                
                # Update progress signal voor hoofd voortgangsbalk
                progress = self.metrics.get_progress_percentage()
                self.progress_update.emit(int(progress), 100)
                
                self.log(f"Paragraaf {chapter_index}.{paragraph_index} succesvol geëxporteerd naar {Path(filepath).name}", "SUCCESS")
            else:
                self.log(f"Fout bij opslaan van data voor paragraaf {chapter_index}.{paragraph_index}", "ERROR")
                self.metrics.item_completed(success=False)
            
        except Exception as e:
            self.log(f"Fout bij verwerken van paragraaf {chapter_index}.{paragraph_index}: {str(e)}", "ERROR")
            
    async def extract_images(self, page: Optional[Page] = None) -> List[Dict[str, Any]]:
        """Extraheer afbeeldingen uit huidige pagina"""
        if page is None:
            page = self.page
            
        images = []
        
        try:
            image_elements = await page.query_selector_all(
                self.config.ui_structure.image_selector
            )
            
            for idx, img_el in enumerate(image_elements, start=1):
                if not self.is_running:
                    break
                    
                # Haal src attribuut op
                src = await img_el.get_attribute("src")
                if not src:
                    continue
                    
                # Download afbeelding
                image_path = await self.saver.save_image(
                    src, 
                    self.status.current_chapter,
                    self.status.current_paragraph,
                    idx
                )
                
                if image_path:
                    images.append({
                        "src": src,
                        "local_path": str(image_path),
                        "index": idx
                    })
                    
        except Exception as e:
            self.log(f"Afbeeldingen extraheren mislukt: {str(e)}", "ERROR")
            
        return images
        
    def resume_after_captcha(self):
        """Hervat run na CAPTCHA oplossing"""
        self.captcha_paused = False
        self.log("Run hervat na CAPTCHA", "INFO")
        self.status_update.emit("Run hervat...")
        
    def stop(self):
        """Stop de run en sluit browser"""
        self.is_running = False
        self.intentional_stop = True
        self.log("Run gestopt door gebruiker (browser wordt gesloten)", "INFO")
        # Trigger config update om uit de wacht-loop te breken
        if hasattr(self, 'loop') and self.loop:
            self.loop.call_soon_threadsafe(self.config_updated_event.set)
        
    async def cleanup(self):
        """Cleanup browser en resources"""
        self.status_update.emit("Afronden...")
        
        try:
            # Als we verbonden zijn via CDP of de gebruiker wil de browser open houden bij fouten/einde
            # Dan overslaan we het sluiten van de browser
            keep_open = (self.config.browser.keep_open_on_error or self.config.browser.attach_to_existing) and not getattr(self, 'intentional_stop', False)
            
            if not keep_open:
                self.log("Browser wordt gesloten...", "INFO")
                if self.page:
                    await self.page.close()
                if self.context:
                    await self.context.close()
                if self.browser:
                    await self.browser.close()
            else:
                self.log("Browser blijft open zoals geconfigureerd", "INFO")
                
            # Sla manifest op
            if self.saver:
                await self.saver.save_manifest()
                
        except Exception as e:
            self.log(f"Cleanup fout: {str(e)}", "WARNING")