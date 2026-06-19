export const ACTIVITY = {
  WALK: 'walk',
  IDLE: 'idle',
  TALK: 'talk',
  SIT: 'sit'
};

export class NPCActivity {
  constructor(initial = ACTIVITY.WALK) {
    this.current = initial;
    this.timer = 0;
    this.duration = 120 + Math.random() * 180;
  }

  update(dt, allowedActivities = [ACTIVITY.WALK, ACTIVITY.IDLE]) {
    this.timer += dt;
    if (this.timer > this.duration) {
      this.timer = 0;
      this.duration = 100 + Math.random() * 220;
      const options = allowedActivities.filter(a => a !== this.current);
      this.current = options[Math.floor(Math.random() * options.length)] || this.current;
      return true;
    }
    return false;
  }

  is(activity) {
    return this.current === activity;
  }
}
