# Problem Set 09: Network Debugging (Wireshark)

### **Goal**
Learn to use professional tools to analyze network traffic at the packet level.

### **Tasks**
1. **Packet Capture**: Capture traffic while visiting a website.
2. **Filtering**: Use filters like `ip.addr == 8.8.8.8` or `tcp.port == 443`.
3. **TCP Stream**: Right-click a packet and select "Follow TCP Stream" to see the full conversation.
4. **Analysis**: Find the "Three-way Handshake" (SYN, SYN-ACK, ACK) in your capture.

### **Practice Drill**
Capture a login attempt to an unencrypted (HTTP) site and see if you can find the username and password in the packets. (Note: Only do this on sites you own/have permission for!).
