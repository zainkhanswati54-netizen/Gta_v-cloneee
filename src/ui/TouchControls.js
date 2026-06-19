export class TouchControls {
  constructor(root) {
    this.state = {
      moveX: 0,
      moveY: 0,
      lookDX: 0,
      lookDY: 0,
      firing: false,
      enterExitPressed: false,
      weaponCyclePressed: false
    };

    this.onFootContainer = document.createElement('div');
    this.onFootContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    root.appendChild(this.onFootContainer);

    // Joystick and fire button are only relevant on foot, so they live in the hideable container.
    this._buildJoystick(this.onFootContainer);
    this._buildFireButton(this.onFootContainer);

    // Enter/exit and weapon-cycle buttons must remain usable in both on-foot and driving
    // states (you need "E" to exit a car!), so they are NOT inside onFootContainer.
    this._buildAlwaysOnButtons(root);

    this._buildLookZone(root);
  }

  showOnFootControls() {
    this.onFootContainer.style.display = 'block';
  }

  hideOnFootControls() {
    this.onFootContainer.style.display = 'none';
    this.state.moveX = 0;
    this.state.moveY = 0;
    this.state.firing = false;
  }

  _buildJoystick(root) {
    const base = document.createElement('div');
    base.style.cssText = `
      position:absolute;bottom:24px;left:24px;width:96px;height:96px;border-radius:50%;
      background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.3);pointer-events:auto;touch-action:none;
    `;
    const knob = document.createElement('div');
    knob.style.cssText = `
      position:absolute;top:28px;left:28px;width:40px;height:40px;border-radius:50%;
      background:rgba(255,255,255,0.45);pointer-events:none;
    `;
    base.appendChild(knob);
    root.appendChild(base);

    let active = false;
    let originX = 0, originY = 0;
    const maxDist = 40;

    const start = (clientX, clientY) => {
      active = true;
      const rect = base.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    };
    const move = (clientX, clientY) => {
      if (!active) return;
      let dx = clientX - originX;
      let dy = clientY - originY;
      const dist = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy));
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * dist;
      dy = Math.sin(angle) * dist;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.state.moveX = dx / maxDist;
      this.state.moveY = dy / maxDist;
    };
    const end = () => {
      active = false;
      knob.style.transform = 'translate(0,0)';
      this.state.moveX = 0;
      this.state.moveY = 0;
    };

    base.addEventListener('touchstart', e => { start(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    base.addEventListener('touchmove', e => { move(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    base.addEventListener('touchend', end);
    base.addEventListener('mousedown', e => start(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    window.addEventListener('mouseup', end);
  }

  _buildLookZone(root) {
    const zone = document.createElement('div');
    zone.style.cssText = 'position:absolute;inset:0;pointer-events:auto;touch-action:none;';
    root.appendChild(zone);

    let lastX = null, lastY = null;
    const onMove = (clientX, clientY) => {
      if (lastX !== null) {
        this.state.lookDX = clientX - lastX;
        this.state.lookDY = clientY - lastY;
      }
      lastX = clientX;
      lastY = clientY;
    };
    zone.addEventListener('touchstart', e => {
      const t = e.touches[0];
      lastX = t.clientX; lastY = t.clientY;
    }, { passive: true });
    zone.addEventListener('touchmove', e => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    zone.addEventListener('touchend', () => { lastX = null; lastY = null; this.state.lookDX = 0; this.state.lookDY = 0; });
    zone.style.zIndex = '-1';
  }

  _buildFireButton(root) {
    const fireBtn = this._makeButton('FIRE', '#d33');
    fireBtn.style.position = 'absolute';
    fireBtn.style.bottom = '24px';
    fireBtn.style.right = '24px';
    fireBtn.addEventListener('touchstart', e => { this.state.firing = true; e.preventDefault(); }, { passive: false });
    fireBtn.addEventListener('touchend', () => { this.state.firing = false; });
    fireBtn.addEventListener('mousedown', () => { this.state.firing = true; });
    fireBtn.addEventListener('mouseup', () => { this.state.firing = false; });
    root.appendChild(fireBtn);
  }

  _buildAlwaysOnButtons(root) {
    // Positioned top-right, clear of both the on-foot fire button (bottom-right) and the
    // D-pad's accelerate/brake buttons (also bottom-right while driving), so these never overlap.
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;top:50px;right:14px;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:auto;';
    root.appendChild(wrap);

    const enterBtn = this._makeButton('E', '#0aa');
    enterBtn.style.width = '46px';
    enterBtn.style.height = '46px';
    enterBtn.style.fontSize = '12px';
    enterBtn.addEventListener('click', () => { this.state.enterExitPressed = true; });

    const weaponBtn = this._makeButton('W+', '#a80');
    weaponBtn.style.width = '46px';
    weaponBtn.style.height = '46px';
    weaponBtn.style.fontSize = '12px';
    weaponBtn.addEventListener('click', () => { this.state.weaponCyclePressed = true; });

    wrap.appendChild(enterBtn);
    wrap.appendChild(weaponBtn);
  }

  _makeButton(label, color) {
    const btn = document.createElement('div');
    btn.textContent = label;
    btn.style.cssText = `
      width:58px;height:58px;border-radius:50%;background:${color}cc;color:#fff;
      display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:13px;
      font-weight:bold;touch-action:none;user-select:none;border:2px solid rgba(255,255,255,0.4);
    `;
    return btn;
  }

  consumePressFlags() {
    const flags = {
      enterExitPressed: this.state.enterExitPressed,
      weaponCyclePressed: this.state.weaponCyclePressed
    };
    this.state.enterExitPressed = false;
    this.state.weaponCyclePressed = false;
    return flags;
  }

  consumeLook() {
    const look = { dx: this.state.lookDX, dy: this.state.lookDY };
    this.state.lookDX = 0;
    this.state.lookDY = 0;
    return look;
  }
}
