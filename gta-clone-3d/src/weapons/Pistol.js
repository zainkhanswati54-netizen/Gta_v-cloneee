import { Weapon } from './Weapon.js';
import { SETTINGS } from '../config/settings.js';

export class Pistol extends Weapon {
  constructor() {
    super('Pistol', SETTINGS.weapons.pistolFireDelay, SETTINGS.weapons.pistolDamage);
  }
}
