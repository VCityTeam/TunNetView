
An [UD-Viz based](https://github.com/VCityTeam/UD-Viz) web-application that displays 
underground cave/tunnel-systems.

A dockerized version is available at 
[TunNetView-docker](https://github.com/VCityTeam/TunNetView-docker)

A deployed demo is available at
https://tunnetview.vcityliris.cma.alpha.grandlyon.com/

![screenshot](Doc/landing_page_screenshot.png)

## For the impatient

```bash
https://github.com/VCityTeam/TunNetView.git   # This repository
cd TunNetView
npm install
npx webpack --config webpack.config.js
python3 -m  http.server &
open http://localhost:8000
```
