import { HealthBar } from './HealthBar.js';
import { AmmoCounter } from './AmmoCounter.js';
import { Minimap } from './Minimap.js';
import { WantedStars } from './WantedStars.js';
import { ScoreDisplay } from './ScoreDisplay.js';
import { ControlsHint } from './ControlsHint.js';
import { DamageVignette } from './DamageVignette.js';

export class HUD {
  constructor(root, gameState) {
    this.root = root;
    this.gameState = gameState;

    this.healthBar = new HealthBar(root);
    this.ammoCounter = new AmmoCounter(root);
    this.minimap = new Minimap(root);
    this.wantedStars = new WantedStars(root);
    this.scoreDisplay = new ScoreDisplay(root);
    this.controlsHint = new ControlsHint(root);
    this.vignette = new DamageVignette(root);

    gameState.onChange((field, state) => {
      if (field === 'health') {
        this.healthBar.set(state.health, state.maxHealth);
        this.vignette.flashIfLow(state.health);
      }
      if (field === 'ammo') this.ammoCounter.set(state.ammo);
      if (field === 'score') this.scoreDisplay.set(state.score);
      if (field === 'wanted') this.wantedStars.set(state.wantedLevel);
    });
  }

  setMode(inVehicle) {
    this.controlsHint.setMode(inVehicle);
  }
}
