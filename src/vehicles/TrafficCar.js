import { Car } from './Car.js';
import { TrafficAI } from './TrafficAI.js';

export class TrafficCar extends Car {
  constructor(x, z, color, route) {
    super(x, z, color);
    this.ai = new TrafficAI(route, route.axis === 'z' ? z : x, 0.25 + Math.random() * 0.15);
    this.group.position.set(x, 0.3, z);
  }

  updateTraffic(dt) {
    const result = this.ai.step(dt);
    this.group.position.x = result.x;
    this.group.position.z = result.z;
    this.group.rotation.y = result.angle;
    const wheelSpin = this.ai.speed * 2.2 * dt;
    this.wheels.forEach(w => w.spin(wheelSpin));
    this.exhaust.update(dt, true);
  }
}
