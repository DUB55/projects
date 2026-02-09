# Help: Networking Mastery

## Common Issues
- **"Address already in use"**: This means a previous program didn't close its socket correctly. Wait a minute or use a different port number.
- **Connection Refused**: The server isn't running or is listening on a different port/IP than you are connecting to.
- **Firewall Blocks**: Windows Firewall or your router might be blocking the port you are trying to use. Try using ports above 1024.
- **Wireshark shows nothing**: Ensure you have selected the correct network interface (e.g., Wi-Fi or Ethernet).

## Resources
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [Computer Networking: A Top-Down Approach](http://gaia.cs.umass.edu/kurose_ross/index.php)
- [Wireshark University](https://www.wireshark.org/docs/)
