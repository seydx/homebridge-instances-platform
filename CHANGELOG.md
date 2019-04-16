# Changelog

## 1.1.0 - 2019-04-16
- [CHANGED] Accessory type from "OTHER" to "SWITCH"
- [NEW] CPU Usage of all "homebridge" instances for Main Switch
- [NEW] Main Switch with "restart all services" functionality
- Bugfixes

**NOTE:** Due to the reason of accessory type changement, you need to clear the cache. Just type "clearCache: true" in config.json and restart Homebridge. After than, change the line to "clearCache: false" and the plugin will add the new Accessory to HomeKit again with the improvements listed above!

## 1.0.1 - 2019-04-16
- [NEW] CPU Usage
- Bugfix

## 1.0.0 - 2019-04-15
- Init. release
