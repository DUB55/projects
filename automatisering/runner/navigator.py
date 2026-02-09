# runner/navigator.py
import asyncio
import random
from typing import Optional, List, Dict, Any
from playwright.async_api import Page, ElementHandle

class Navigator:
    """Helper class voor browser navigatie en interacties"""
    
    def __init__(self, page: Page, config: Dict[str, Any]):
        self.page = page
        self.config = config
        
    async def click_with_retry(self, selector: str, max_attempts: int = None, 
                              delay_ms: int = None) -> bool:
        """
        Klik op een element met retry mechanisme.
        
        Args:
            selector: CSS of XPath selector
            max_attempts: Maximum aantal pogingen (default van config)
            delay_ms: Wacht tijd tussen pogingen (default van config)
            
        Returns:
            True als succesvol, False anders
        """
        if max_attempts is None:
            max_attempts = self.config.get("retry_policy", {}).get("click_attempts", 2)
        if delay_ms is None:
            delay_ms = self.config.get("retry_policy", {}).get("click_delay_ms", 500)
            
        for attempt in range(max_attempts):
            try:
                # Bepaal of het CSS of XPath is
                if selector.startswith('//') or selector.startswith('.//'):
                    element = await self.page.wait_for_selector(f"xpath={selector}", 
                        timeout=self.config.get("timeouts", {}).get("selector", 8000))
                else:
                    element = await self.page.wait_for_selector(selector,
                        timeout=self.config.get("timeouts", {}).get("selector", 8000))
                
                if element:
                    # Scroll naar element
                    await element.scroll_into_view_if_needed()
                    
                    # Wacht random delay voor menselijk gedrag
                    await asyncio.sleep(random.uniform(0.1, 0.3))
                    
                    # Klik
                    await element.click()
                    
                    # Wacht op stabilisatie
                    await self.wait_for_stabilization()
                    
                    return True
                    
            except Exception as e:
                if attempt == max_attempts - 1:
                    print(f"Klik mislukt na {max_attempts} pogingen: {selector} - {str(e)}")
                    return False
                    
                # Wacht en probeer opnieuw
                await asyncio.sleep(delay_ms / 1000)
                
        return False
    
    async def wait_for_stabilization(self, timeout_ms: int = 5000):
        """
        Wacht tot pagina gestabiliseerd is (geen netwerk requests).
        
        Args:
            timeout_ms: Timeout in milliseconden
        """
        try:
            # Wacht op network idle
            await self.page.wait_for_load_state("networkidle", timeout=timeout_ms)
        except:
            # Fallback: wacht 1 seconde
            await asyncio.sleep(1)
    
    async def safe_query_selector(self, selector: str, timeout_ms: int = None) -> Optional[ElementHandle]:
        """
        Veilig zoeken naar een element met timeout.
        
        Args:
            selector: CSS of XPath selector
            timeout_ms: Timeout in milliseconden (default van config)
            
        Returns:
            ElementHandle of None
        """
        if timeout_ms is None:
            timeout_ms = self.config.get("timeouts", {}).get("selector", 8000)
            
        try:
            if selector.startswith('//') or selector.startswith('.//'):
                return await self.page.wait_for_selector(f"xpath={selector}", 
                    timeout=timeout_ms)
            else:
                return await self.page.wait_for_selector(selector, timeout=timeout_ms)
        except:
            return None
    
    async def safe_query_selector_all(self, selector: str, timeout_ms: int = None) -> List[ElementHandle]:
        """
        Veilig zoeken naar alle elementen die voldoen aan selector.
        
        Args:
            selector: CSS of XPath selector
            timeout_ms: Timeout in milliseconden (default van config)
            
        Returns:
            List van ElementHandle objects
        """
        if timeout_ms is None:
            timeout_ms = self.config.get("timeouts", {}).get("selector", 8000)
            
        try:
            # Wacht eerst tot minstens één element gevonden is
            await self.safe_query_selector(selector, timeout_ms)
            
            # Zoek alle elementen
            if selector.startswith('//') or selector.startswith('.//'):
                return await self.page.query_selector_all(f"xpath={selector}")
            else:
                return await self.page.query_selector_all(selector)
                
        except:
            return []
    
    async def get_element_text(self, selector: str, default: str = "") -> str:
        """
        Haal tekst op van een element.
        
        Args:
            selector: CSS of XPath selector
            default: Standaard waarde als element niet gevonden wordt
            
        Returns:
            Element tekst of default
        """
        element = await self.safe_query_selector(selector)
        if element:
            try:
                return await element.inner_text()
            except:
                pass
        return default
    
    async def get_element_attribute(self, selector: str, attribute: str, 
                                   default: str = "") -> str:
        """
        Haal attribuut op van een element.
        
        Args:
            selector: CSS of XPath selector
            attribute: Attribuut naam
            default: Standaard waarde als niet gevonden
            
        Returns:
            Attribuut waarde of default
        """
        element = await self.safe_query_selector(selector)
        if element:
            try:
                value = await element.get_attribute(attribute)
                return value if value is not None else default
            except:
                pass
        return default
    
    async def is_element_visible(self, selector: str, timeout_ms: int = 3000) -> bool:
        """
        Controleer of element zichtbaar is.
        
        Args:
            selector: CSS of XPath selector
            timeout_ms: Timeout in milliseconden
            
        Returns:
            True als element zichtbaar is
        """
        try:
            element = await self.safe_query_selector(selector, timeout_ms)
            if element:
                return await element.is_visible()
        except:
            pass
        return False
    
    async def take_screenshot(self, name: str = "screenshot") -> Optional[str]:
        """
        Neem screenshot van huidige pagina.
        
        Args:
            name: Naam voor screenshot
            
        Returns:
            Pad naar screenshot of None bij fout
        """
        try:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{name}_{timestamp}.png"
            
            # Maak screenshots directory aan
            from pathlib import Path
            screenshots_dir = Path("screenshots")
            screenshots_dir.mkdir(exist_ok=True)
            
            screenshot_path = screenshots_dir / filename
            await self.page.screenshot(path=str(screenshot_path), full_page=True)
            
            return str(screenshot_path)
            
        except Exception as e:
            print(f"Screenshot fout: {str(e)}")
            return None
    
    async def handle_modal_or_overlay(self, close_selectors: List[str] = None):
        """
        Probeer modals of overlays te sluiten.
        
        Args:
            close_selectors: Lijst van selectors voor close/sluiten knoppen
        """
        if close_selectors is None:
            close_selectors = [".modal-close", ".overlay-close", "[aria-label='Close']", 
                              "button:has-text('Sluiten')", "button:has-text('Close')"]
        
        for selector in close_selectors:
            try:
                close_btn = await self.page.query_selector(selector)
                if close_btn and await close_btn.is_visible():
                    await close_btn.click()
                    await asyncio.sleep(0.5)
                    return True
            except:
                continue
                
        return False
    
    async def navigate_back_or_recover(self, expected_url_contains: str = None):
        """
        Navigeer terug of herstel van onverwachte navigatie.
        
        Args:
            expected_url_contains: String die in verwachte URL zou moeten voorkomen
            
        Returns:
            True als herstel succesvol
        """
        current_url = self.page.url
        
        # Als we op de juiste pagina zijn, doe niets
        if expected_url_contains and expected_url_contains in current_url:
            return True
            
        try:
            # Probeer terug te gaan
            await self.page.go_back()
            await self.wait_for_stabilization()
            
            # Controleer of we op de juiste pagina zijn
            if expected_url_contains and expected_url_contains in self.page.url:
                return True
                
            # Probeer opnieuw te laden
            await self.page.reload()
            await self.wait_for_stabilization()
            
            return expected_url_contains is None or expected_url_contains in self.page.url
            
        except Exception as e:
            print(f"Navigatie herstel mislukt: {str(e)}")
            return False