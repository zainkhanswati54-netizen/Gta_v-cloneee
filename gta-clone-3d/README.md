# Open World 3D — City Heist

A GTA-inspired open world 3D browser game built with Three.js, organized into ~90 small modular files (core engine, world, vehicles, player, weapons, NPCs, lighting, UI, audio, config, and utils).

## Features
- Procedurally assembled city: roads, sidewalks, crosswalks, curbs, varied buildings with windows, ledges, rooftop details, parks, trees, street props, traffic lights and signs
- Drivable cars with real acceleration/steering/friction physics, animated wheels, headlights/taillights, exhaust particles, skid marks
- On-foot player with walking/running animation, third-person mouse-look camera, footstep dust
- Shooting system: pistol, bullet projectiles, muzzle flash, impact particles, ammo pickups
- Police NPCs with chase AI, health bars, and pedestrian NPCs that wander
- Full day/night cycle affecting sky, fog, sun, streetlamps, and car headlights
- HUD: health bar, ammo counter, score, wanted stars, minimap, controls hint, damage vignette
- Procedural Web Audio sounds: engine rumble, gunshots, ambient city hum

## Running locally

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

## Building for production

```bash
npm run build
npm run preview
```

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Run `npm run build` to generate the `dist/` folder.
3. Either:
   - Use the `gh-pages` branch approach: `npx gh-pages -d dist`, or
   - In your repo settings, enable GitHub Pages pointing at the `dist` folder via a GitHub Action (recommended: use the official `actions/deploy-pages` workflow with `npm run build` as the build step).
4. Because `vite.config.js` sets `base: './'`, the built assets use relative paths and work correctly when served from a GitHub Pages subpath.

## Controls
- `WASD` / arrow keys — move or drive
- Mouse — look around (click the canvas once to lock the pointer)
- `Shift` — run (on foot)
- `E` — enter / exit nearest vehicle
- `Space` — fire weapon / handbrake in vehicle
- `Esc` — pause

## Project structure

```
src/
  config/    settings, keybinds, color palette, city layout, spawn tables
  core/      engine bootstrap, clock, input, scene registry, collision grid, game state, main.js
  utils/     math, random, geometry, materials, color, object pooling, easing
  lighting/  sun, ambient, day/night cycle, street lamps, car lights, shadow config
  world/     ground, sky, roads, markings, sidewalks, intersections, buildings, facades,
             windows, trees, street props, traffic lights/signs, curbs, parking, city builder
  vehicles/  car body, wheels, physics, controller, factory, exhaust, skid marks, lights
  player/    character, limbs, animator, controller, camera, enter/exit vehicle, stats, dust
  weapons/   base weapon, pistol, bullet, muzzle flash, impact particles, pickups
  npc/       base NPC, animator, AI, police, pedestrians, spawner, health bars
  ui/        HUD and all sub-widgets (health, ammo, minimap, wanted, score, hints, pause, vignette)
  audio/     audio manager, engine sound, gunshot sound, ambient city sound
```

## Notes
This is an original, from-scratch project inspired by open-world driving/shooting games. It does not use any assets, code, or content from Grand Theft Auto or Rockstar Games — all models are procedurally generated primitives, and all systems are custom-built.
