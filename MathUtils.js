export class GameState {
  constructor() {
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 30;
    this.score = 0;
    this.wantedLevel = 0;
    this.inVehicle = false;
    this.listeners = [];
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  _notify(field) {
    this.listeners.forEach(fn => fn(field, this));
  }

  damage(amount) {
    this.health = Math.max(0, this.health - amount);
    this._notify('health');
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this._notify('health');
  }

  addAmmo(amount) {
    this.ammo = Math.min(99, this.ammo + amount);
    this._notify('ammo');
  }

  useAmmo() {
    if (this.ammo <= 0) return false;
    this.ammo--;
    this._notify('ammo');
    return true;
  }

  addScore(points) {
    this.score += points;
    this._notify('score');
  }

  raiseWanted(amount) {
    this.wantedLevel = Math.min(5, this.wantedLevel + amount);
    this._notify('wanted');
  }

  decayWanted(amount) {
    this.wantedLevel = Math.max(0, this.wantedLevel - amount);
    this._notify('wanted');
  }
}
