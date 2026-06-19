# Open World 3D — City Heist

A GTA-inspired open world 3D browser game built with Three.js, organized into ~122 small modular files (core engine, world, vehicles, player, weapons, NPCs, lighting, UI, audio, config, and utils).

## What's new in this update (4 districts + NPC activity + controls)
- **Four districts**: the map is now divided into quadrants — a large **city** (most buildings, neon signage at night), a **beach** (sand, animated ocean, palm trees, umbrellas/loungers, beach NPCs), **mountains** (procedural peaks with snow caps, pine forest), and a smaller **suburbs** transition district. Roads connect all four; dense traffic is concentrated in the city/suburb/beach side, since roads cutting through solid mountain terrain would look broken.
- **NPCs that actually do things**: pedestrians now cycle through walk/idle states with visible movement speed (previously they moved so slowly it looked like they were doing nothing). Added talking NPC pairs (two NPCs facing each other with conversation gestures), NPCs sitting on benches, and beach-specific NPCs that lounge or stroll.
- **Two camera views**: press `C` (or use the in-game toggle) to switch between a close chase camera and a far chase camera.
- **Better car controls**: a real handbrake (with a slight arcade drift when used at speed while turning), corrected steering direction when reversing (previously turning left while reversing span the car the wrong way), and proper braking feel when you let off the accelerator instead of relying only on ambient friction.
- **Touch D-pad for driving**: on mobile, entering a vehicle now swaps the on-foot joystick for dedicated steer-left/steer-right/accelerate/brake/handbrake buttons. Exiting the vehicle swaps back.
- **Visual fixes**: health is now shown as a segmented status bar with a character icon instead of a thin progress strip; removed a redundant always-hidden skybox sphere that was silently costing render performance every frame for no visible benefit.

## Honest note on "maximum graphics"
This project builds all visuals procedurally in Three.js using basic primitives (boxes, cylinders, cones) and standard/shader materials — there's a real ceiling to how realistic this can look, well below photoreal, licensed, professionally-modeled reference art. What was improved here: lighting (ACES filmic tone mapping, day/night-aware neon signage, animated water shader), material variety per district, and removing wasted render work. What wasn't and can't reasonably be added without a different toolchain: photorealistic textures, sculpted/high-poly character or vehicle models, or licensed assets.


- **Bigger map**: city grid expanded from 6×6 to 10×10 blocks
- **Traffic**: AI-driven cars that follow lane routes and turn around at the edges of the map
- **Crowds**: many more pedestrians distributed across city blocks (in addition to the original fixed pedestrian spawns)
- **Weapon selector**: Pistol, Shotgun, and Rifle, each with distinct fire rate, spread, and ammo pools; tap the on-screen icons or use the in-game cycle button to switch
- **Car door animation**: pressing E to enter/exit a vehicle now plays a door-open/close animation instead of an instant teleport
- **Touch controls**: a virtual joystick, look-drag zone, and fire/enter/weapon-cycle buttons appear automatically on phones/tablets
- **Performance manager**: automatically scales pixel ratio, shadow quality, and draw distance based on detected device type and measured frame time, so it stays playable on lower-powered Android devices
- **Richer audio**: layered multi-oscillator engine sound, per-weapon gunshot variants (pistol/shotgun/rifle each sound different), and an ambient wind/city-texture loop. (Note: this is all procedurally synthesized with the Web Audio API — there are no real recorded sound effects, voice lines, or music tracks, since those require licensed audio assets or voice actors that aren't part of this kind of code-generated project.)
- **Fixed pause menu**: the previous "Click anywhere to resume" overlay couldn't actually receive clicks due to a pointer-events bug — this is now fixed and wired to a working Escape-key pause/resume system

## Important: file corruption found in the previous upload

While integrating your uploaded repo, several root-level files were found to contain the wrong content — likely from a mismatched copy/paste at some point:
- `package.json` contained `Headlights.js` code
- `capacitor.config.json` contained `RandomUtils.js` code
- `vite.config.js` contained `CarPhysics.js` code
- `README.md` contained `CarFactory.js` code
- `.github/workflows/build-apk.yml` contained `SkidMarks.js` code
- `.gitignore` was missing entirely

All of these have been regenerated correctly in this update. Your actual `src/` folder (the real game code) was **not** affected — only these root configuration/doc files were swapped. If you've made manual edits to any of these root files since your last upload, you'll want to redo them, since this update replaces them with corrected versions.

## Features
- Procedurally assembled city: roads, sidewalks, crosswalks, curbs, varied buildings with windows, ledges, rooftop details, parks, trees, street props, traffic lights and signs
- Drivable cars with real acceleration/steering/friction physics, animated wheels, headlights/taillights, exhaust particles, skid marks, and an animated driver-side door
- AI traffic cars driving along the road network independently of the player
- On-foot player with walking/running animation, third-person mouse-look camera (or touch-drag look on mobile), footstep dust
- Three selectable weapons (pistol, shotgun, rifle) with muzzle flash, impact particles, and ammo pickups
- Police NPCs with chase AI, health bars, and a much larger pool of wandering pedestrian NPCs across the city
- Full day/night cycle affecting sky, fog, sun, streetlamps, and car headlights
- HUD: health bar, ammo counter, score, wanted stars, minimap, weapon selector, controls hint, damage vignette, working pause menu
- On-screen touch controls for mobile (joystick, look-drag, fire/enter/weapon buttons)
- Automatic performance/quality scaling for lower-powered devices

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

## Building an APK automatically with GitHub Actions

This repo includes `.github/workflows/build-apk.yml`, which builds an Android debug APK on every push to `main` (or manually via the Actions tab → "Run workflow"). It requires the Capacitor Android project to exist first:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm run build
npx cap add android
git add .
git commit -m "Add Capacitor Android project"
git push
```

Once the `android/` folder is committed and pushed, the workflow will run automatically. Find the finished APK under the Actions tab → the latest "Build Android APK" run → the `app-debug-apk` artifact at the bottom of the run page.

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Run `npm run build` to generate the `dist/` folder.
3. Either use `npx gh-pages -d dist`, or wire up the official `actions/deploy-pages` GitHub Actions workflow with `npm run build` as the build step.
4. Because `vite.config.js` sets `base: './'`, the built assets use relative paths and work correctly when served from a GitHub Pages subpath.

## Controls

**Desktop**
- `WASD` / arrow keys — move or drive
- Mouse — look around (click the canvas once to lock the pointer)
- `Shift` — run (on foot)
- `E` — enter / exit nearest vehicle (plays door animation)
- `Space` — fire weapon (on foot) / handbrake (in vehicle)
- `C` — toggle close/far camera view
- `Q` — cycle equipped weapon
- `Esc` — pause / resume

**Mobile / touch (on foot)**
- Virtual joystick (bottom-left) — move
- Drag anywhere on screen — look around
- Red button — fire
- Teal "E" button — enter/exit vehicle
- Orange "W+" button — cycle weapon

**Mobile / touch (driving)**
- ◀ / ▶ buttons (bottom-left) — steer
- ▲ button (bottom-right, green) — accelerate
- ▼ button (bottom-right, red) — brake/reverse
- HB button — handbrake
- Tap teal "E" equivalent (enter/exit button) to exit the vehicle — the on-foot joystick automatically swaps for the D-pad while driving, and back again on exit

## Project structure

```
src/
  config/    settings, keybinds, color palette, city layout, spawn tables, weapon config, traffic config
  core/      engine bootstrap, clock, input, scene registry, collision grid, game state,
             performance manager, platform detection, main.js
  utils/     math, random, geometry, materials, color, object pooling, easing, tweening, LOD
  lighting/  sun, ambient, day/night cycle, street lamps, car lights, shadow config
  world/     ground, sky, roads, markings, sidewalks, intersections, buildings, facades,
             windows, trees, street props, traffic lights/signs, curbs, parking, city builder
  vehicles/  car body, wheels, physics, controller, factory, exhaust, skid marks, lights,
             door animation, traffic AI cars
  player/    character, limbs, animator, controller, camera, enter/exit vehicle, stats, dust
  weapons/   base weapon, pistol, shotgun, rifle, bullet, muzzle flash, impact particles,
             pickups, weapon registry, weapon selector
  npc/       base NPC, animator, AI, police, pedestrians, spawner, crowd spawner, health bars
  ui/        HUD and all sub-widgets (health, ammo, minimap, wanted, score, hints, pause,
             vignette, weapon selector, touch controls, mobile layout, button fixes)
  audio/     audio manager, layered engine sound, weapon sound kit, ambient nature/city sound
```

## Honest notes on scope

This is a fan-made, original project inspired by open-world driving/shooting games — it does not use any assets, code, or content from Grand Theft Auto or Rockstar Games. All models are procedurally generated primitives and all systems are custom-built.

A few things that are realistically out of reach for a project like this, worth knowing as you keep iterating:
- **No recorded voice lines or dialogue** — NPCs don't talk. Real character dialogue needs voice actors or paid text-to-speech services, not just code.
- **No licensed music or professional sound effects** — all audio is synthesized in-browser with the Web Audio API (oscillators and filtered noise). It will never sound like a AAA game's sound design without real recorded/licensed audio assets.
- **Animations are procedural, not hand-keyframed or motion-captured** — walk cycles, door swings, etc. are simple math-driven movements rather than artist-made animations.

These aren't bugs — they're inherent limits of a code-only, no-budget asset pipeline. If you want to push past them, the next step would be sourcing (or commissioning) actual audio/animation assets and loading them into the existing systems.
