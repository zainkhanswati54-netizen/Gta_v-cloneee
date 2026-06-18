export class TrafficAI {
  constructor(route, startPos, speed) {
    this.route = route;
    this.pos = startPos;
    this.speed = speed;
    this.direction = 1;
  }

  step(dt) {
    if (this.route.axis === 'z') {
      this.pos += this.direction * this.speed * dt;
      if (this.pos > this.route.max) { this.pos = this.route.max; this.direction = -1; }
      if (this.pos < this.route.min) { this.pos = this.route.min; this.direction = 1; }
      return { x: this.route.fixed + this.route.lane, z: this.pos, angle: this.direction > 0 ? 0 : Math.PI };
    } else {
      this.pos += this.direction * this.speed * dt;
      if (this.pos > this.route.max) { this.pos = this.route.max; this.direction = -1; }
      if (this.pos < this.route.min) { this.pos = this.route.min; this.direction = 1; }
      return { x: this.pos, z: this.route.fixed + this.route.lane, angle: this.direction > 0 ? Math.PI / 2 : -Math.PI / 2 };
    }
  }
}
