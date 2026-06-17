export class WantedStars {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#ff0;font-size:18px;letter-spacing:4px;font-family:monospace;';
    root.appendChild(this.el);
  }

  set(level) {
    this.el.textContent = '*'.repeat(Math.floor(level));
  }
}
