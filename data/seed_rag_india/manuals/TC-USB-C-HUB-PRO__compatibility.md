# TechCart USB-C Hub Pro — Compatibility Sheet

SKU: **TC-USB-C-HUB-PRO**

## Ports

- 1× USB-C **upstream** (to laptop/tablet) with **100 W passthrough** (85 W to laptop after hub draw—see below)
- 2× USB-A 3.2 Gen1 (5 Gbps)
- HDMI 2.0 **4K60**
- Gigabit Ethernet (RTL8153 class)
- SD + microSD (UHS-I shared bus)

## Power notes

Passthrough requires **USB-C PD** charger on hub's **PD-in** port. Without PD, hub runs from **5 V bus power** only—HDMI may flicker on some laptops.

## Compatibility (India market laptops)

Tested profiles:

- **MacBook Air M1/M2/M3** — extend + mirror OK.
- **Dell Inspiron / Latitude** USB-C with DP-alt-mode — OK.
- **ThinkPad T14** — use **left** USB-C port marked with SS+DP icon.
- **Budget Windows laptops** without DP-alt-mode: **HDMI will not work** from this hub; USB-A/Ethernet still work.

## Android phones (Samsung / Pixel)

**DeX / desktop mode**: HDMI works on supported devices; charging depends on phone PD profile.

## Troubleshooting Ethernet flapping

Install latest driver from laptop OEM; disable **Energy Efficient Ethernet** in adapter properties on Windows.

Use this document when customers ask if the hub works with their **laptop model** or **Android phone**.
