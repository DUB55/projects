# iPhone Shortcut: Antigravity Remote

## Doel
- Prompt versturen naar daemon en laatste veranderingen + chat ophalen.

## Voorbereiding
- Laptop daemon bereikbaar:
  - Zelfde Wi‑Fi: gebruik http://<IP>:5000
  - Verschillende Wi‑Fi: gebruik Cloudflare Tunnel https-URL of Tailscale IP
- Noteer URL: bv. https://example.trycloudflare.com

## Shortcut aanmaken
- Open Shortcuts → plus → “Add Action”
- Actie 1: “Ask for Input”
  - Prompt: “Prompt voor Antigravity”
  - Variabele: Prompt
- Actie 2: “Get Contents of URL”
  - Methode: POST
  - URL: https://<tunnel-URL>/prompt
  - Headers: Content-Type = application/json
  - Request Body: JSON, key “prompt” = Variabele Prompt
- Actie 3: “Repeat”
  - Count: 120
  - Binnen Repeat:
    - “Get Contents of URL”
      - Methode: GET
      - URL: https://<tunnel-URL>/latest
    - “Get Dictionary Value”
      - Key: status
    - “If” status == DONE
      - “Get Dictionary Value”
        - Key: response
      - “Show Result”
        - Text: response
      - “Stop Shortcut”
    - “Otherwise”
      - “Wait” 1 seconde

## Chat ophalen
- Optioneel, voeg toe na DONE:
  - “Get Contents of URL”
    - Methode: GET
    - URL: https://<tunnel-URL>/chat
  - “Get Dictionary Value”
    - Key: delta
  - “Show Result”
    - Text: delta

## Tips
- Gebruik de Cloudflare https-URL voor eenvoud en veiligheid.
- Past markers en coördinaten eerst aan in de GUI en test via web UI.
