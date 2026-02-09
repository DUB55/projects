# utils/security.py
import keyring
import hashlib
import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional, Tuple, List, Dict, Any
import json

class SecurityManager:
    """Beheer veilige opslag van credentials en gevoelige data"""
    
    SERVICE_NAME = "NoordhoffScraper"
    
    def __init__(self, master_password: Optional[str] = None):
        """
        Initialiseer SecurityManager.
        
        Args:
            master_password: Optioneel master password voor encryptie
        """
        self.master_password = master_password
        self._setup_encryption()
        
    def _setup_encryption(self):
        """Stel encryptie in indien master password beschikbaar is"""
        if self.master_password:
            # Genereer key van master password
            salt = b'noordhoff_scraper_salt'  # In productie: unieke salt per gebruiker
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.master_password.encode()))
            self.cipher = Fernet(key)
        else:
            self.cipher = None
    
    def save_credentials(self, username: str, password: str, 
                        service: Optional[str] = None) -> bool:
        """
        Sla credentials op in Windows Credential Manager.
        
        Args:
            username: Gebruikersnaam
            password: Wachtwoord
            service: Optionele service naam (default: SERVICE_NAME)
            
        Returns:
            True als succesvol
        """
        try:
            service_name = service or self.SERVICE_NAME
            
            # Versleutel wachtwoord indien encryptie beschikbaar is
            if self.cipher:
                encrypted_password = self.cipher.encrypt(password.encode())
                password_to_store = base64.b64encode(encrypted_password).decode('utf-8')
            else:
                password_to_store = password
            
            # Sla op in keyring
            keyring.set_password(service_name, username, password_to_store)
            
            # Log ook welke service gebruikt wordt (zonder wachtwoord)
            print(f"Credentials opgeslagen voor {username} bij service: {service_name}")
            
            return True
            
        except Exception as e:
            print(f"Fout bij opslaan credentials: {str(e)}")
            return False
    
    def get_credentials(self, username: str, 
                       service: Optional[str] = None) -> Optional[Tuple[str, str]]:
        """
        Haal credentials op uit Windows Credential Manager.
        
        Args:
            username: Gebruikersnaam
            service: Optionele service naam (default: SERVICE_NAME)
            
        Returns:
            Tuple van (username, password) of None bij fout
        """
        try:
            service_name = service or self.SERVICE_NAME
            stored_password = keyring.get_password(service_name, username)
            
            if not stored_password:
                return None
            
            # Decrypteer indien nodig
            if self.cipher:
                try:
                    encrypted_password = base64.b64decode(stored_password)
                    decrypted_password = self.cipher.decrypt(encrypted_password).decode('utf-8')
                    return (username, decrypted_password)
                except:
                    # Misschien niet versleuteld, retourneer origineel
                    return (username, stored_password)
            else:
                return (username, stored_password)
                
        except Exception as e:
            print(f"Fout bij ophalen credentials: {str(e)}")
            return None
    
    def delete_credentials(self, username: str, service: Optional[str] = None) -> bool:
        """
        Verwijder credentials uit Windows Credential Manager.
        
        Args:
            username: Gebruikersnaam
            service: Optionele service naam (default: SERVICE_NAME)
            
        Returns:
            True als succesvol
        """
        try:
            service_name = service or self.SERVICE_NAME
            keyring.delete_password(service_name, username)
            return True
        except Exception as e:
            print(f"Fout bij verwijderen credentials: {str(e)}")
            return False
    
    def list_stored_usernames(self, service: Optional[str] = None) -> List[str]:
        """
        Lijst alle opgeslagen usernames voor een service.
        
        Args:
            service: Optionele service naam (default: SERVICE_NAME)
            
        Returns:
            Lijst van usernames
        """
        # Note: keyring heeft geen native 'list' functionaliteit
        # We kunnen alleen proberen te lezen wat we kennen
        # Deze functie retourneert een lege lijst, maar logica kan later uitgebreid worden
        return []
    
    def encrypt_config(self, config: Dict[str, Any], 
                      output_path: str) -> bool:
        """
        Versleutel configuratiebestand.
        
        Args:
            config: Configuratie dictionary
            output_path: Pad voor versleuteld bestand
            
        Returns:
            True als succesvol
        """
        if not self.cipher:
            print("Geen encryptie beschikbaar - master password vereist")
            return False
            
        try:
            # Converteer config naar JSON
            config_json = json.dumps(config, indent=2)
            
            # Versleutel
            encrypted_data = self.cipher.encrypt(config_json.encode('utf-8'))
            
            # Schrijf naar bestand
            with open(output_path, 'wb') as f:
                f.write(encrypted_data)
                
            return True
            
        except Exception as e:
            print(f"Fout bij versleutelen config: {str(e)}")
            return False
    
    def decrypt_config(self, input_path: str) -> Optional[Dict[str, Any]]:
        """
        Ontsleutel configuratiebestand.
        
        Args:
            input_path: Pad naar versleuteld bestand
            
        Returns:
            Configuratie dictionary of None bij fout
        """
        if not self.cipher:
            print("Geen decryptie beschikbaar - master password vereist")
            return None
            
        try:
            # Lees versleuteld bestand
            with open(input_path, 'rb') as f:
                encrypted_data = f.read()
            
            # Ontsleutel
            decrypted_data = self.cipher.decrypt(encrypted_data)
            
            # Parse JSON
            config = json.loads(decrypted_data.decode('utf-8'))
            
            return config
            
        except Exception as e:
            print(f"Fout bij ontsleutelen config: {str(e)}")
            return None
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        """
        Hash een wachtwoord met salt.
        
        Args:
            password: Wachtwoord om te hashen
            salt: Optionele salt (anders wordt er een gegenereerd)
            
        Returns:
            Tuple van (hashed_password, salt)
        """
        if salt is None:
            # Genereer random salt
            salt = base64.b64encode(os.urandom(16)).decode('utf-8')
        
        # Combineer password en salt
        combined = password + salt
        
        # Hash met SHA-256
        hashed = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        
        return hashed, salt
    
    @staticmethod
    def verify_password(password: str, hashed_password: str, salt: str) -> bool:
        """
        Verifieer een wachtwoord tegen een hash.
        
        Args:
            password: Wachtwoord om te verifiëren
            hashed_password: Opgeslagen hash
            salt: Salt gebruikt bij het hashen
            
        Returns:
            True als wachtwoord overeenkomt
        """
        test_hash, _ = SecurityManager.hash_password(password, salt)
        return test_hash == hashed_password
    
    @staticmethod
    def generate_secure_filename(original_name: str) -> str:
        """
        Genereer een veilige bestandsnaam zonder gevoelige informatie.
        
        Args:
            original_name: Originele bestandsnaam
            
        Returns:
            Veilige bestandsnaam
        """
        # Haal extensie
        from pathlib import Path
        path = Path(original_name)
        ext = path.suffix
        
        # Genereer random naam
        import uuid
        safe_name = f"file_{uuid.uuid4().hex[:8]}{ext}"
        
        return safe_name