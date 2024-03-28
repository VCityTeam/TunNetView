
An [UD-Viz based](https://github.com/VCityTeam/UD-Viz) web-application that displays 
underground cave/tunnel-systems.

A dockerized version is available at 
[TunNetView-docker](https://github.com/VCityTeam/TunNetView-docker)

A deployed demo is available at
https://tunnetview.vcityliris.cma.alpha.grandlyon.com/ (the illustrated
[cave data is available here](https://dataset-dl.liris.cnrs.fr/elaphes-cave/))

![screenshot](Doc/landing_page_screenshot.png)

## For the impatient

```bash
https://github.com/VCityTeam/TunNetView.git   # This repository
cd TunNetView
npm install
npm run build
npm run start
npx webpack --config webpack.config.js
open http://localhost:8000
```
