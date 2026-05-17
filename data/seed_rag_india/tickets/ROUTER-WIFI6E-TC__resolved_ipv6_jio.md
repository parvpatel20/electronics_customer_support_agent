# Resolved ticket — Android TV apps fail on Wi-Fi, work on mobile data (Hyderabad)

**Product SKU:** ROUTER-WIFI6E-TC  
**ISP:** JioFiber  
**Symptom:** YouTube / Netflix buffer on TV Wi-Fi only.  
**Root cause:** IPv6 DHCP issue on old Android TV + dual-stack.  
**Fix:** Router → IPv6 **disabled** on main SSID test; customer upgraded TV firmware later and re-enabled IPv6.  
**Tag:** ipv6, jiofiber, android_tv
