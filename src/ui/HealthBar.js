export class HealthBar {
  constructor(root) {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:absolute;bottom:60px;left:16px;font-family:monospace;';
    this.container.innerHTML = `
      <div style="color:#f44;font-size:12px;margin-bottom:3px;">HEALTH</div>
      <div style="width:140px;height:10px;background:#333;border-radius:5px;">
        <div id="hp-fill" style="height:10px;background:#f44;border-radius:5px;width:100%;transition:width .25s;"></div>
      </div>`;
    root.appendChild(this.container);
    this.fill = this.container.querySelector('#hp-fill');
  }

  set(hp, maxHp) {
    const pct = Math.max(0, (hp / maxHp) * 100);
    this.fill.style.width = pct + '%';
    this.fill.style.background = pct > 50 ? '#f44' : pct > 25 ? '#fa0' : '#f00';
  }
}
