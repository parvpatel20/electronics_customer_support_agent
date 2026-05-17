# TechCart Wi-Fi 6E Router — India ISP & JioFiber Notes

SKU: **ROUTER-WIFI6E-TC**

## JioFiber / Airtel Xstream Fiber (bridge mode)

1. Ask ISP to put ONT in **bridge**; PPPoE credentials go on TechCart router **Internet → PPPoE**.
2. VLAN: most JioFiber installs **no VLAN** on router WAN; if ISP gave a VLAN ID, set under **WAN → VLAN tagging**.

## IPv6

Enable **IPv6 DHCP-PD** on router if ISP provides dual-stack; if Android TV apps fail only on Wi-Fi, try **IPv6 off** temporarily to test—some old STBs misbehave.

## DFS channels in India

6 GHz uses allowed UNII bands; first boot **may scan 2–3 minutes**—do not power-cycle.

## Guest network for smart home

Put **Tuya / cheap IoT** on **2.4 GHz guest SSID** with **AP isolation** off only if app discovery fails; otherwise isolate.

## Advanced: bufferbloat

If video calls stutter on 1 Gbps line, enable **Smart QoS** and set **work device** to highest priority.

## category: isp_guide

Keep this for **routing**, **IPv6**, and **Indian fiber** behaviour questions.
