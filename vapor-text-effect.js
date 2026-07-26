/**
 * VaporCycler — vanilla JS port of a canvas particle text-cycle effect.
 * Samples rendered text into pixel particles, "vaporizes" them left-to-right
 * (or right-to-left), then fades in the next string in the cycle.
 * Falls back to a plain crossfade when prefers-reduced-motion is set,
 * or when Canvas2D is unavailable.
 */
class VaporCycler {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });

    this.texts = options.texts || ["Systemize"];
    this.font = Object.assign(
      { fontFamily: "Space Grotesk, sans-serif", fontSize: "32px", fontWeight: 500 },
      options.font
    );
    this.color = options.color || "rgb(20, 21, 26)";
    this.spread = options.spread ?? 4;
    this.density = options.density ?? 5;
    this.direction = options.direction || "left-to-right";
    this.alignment = options.alignment || "left";
    this.durations = {
      vaporize: (options.animation?.vaporizeDuration ?? 2) * 1000,
      fadeIn: (options.animation?.fadeInDuration ?? 1) * 1000,
      wait: (options.animation?.waitDuration ?? 0.6) * 1000,
    };

    this.dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.5;
    this.particles = [];
    this.textBoundaries = null;
    this.currentTextIndex = 0;
    this.state = "static";
    this.vaporizeProgress = 0;
    this.fadeOpacity = 0;
    this.lastTime = performance.now();
    this.frameId = null;
    this.inView = false;

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this._onResize = this._onResize.bind(this);
    this._tick = this._tick.bind(this);

    this.resizeObserver = new ResizeObserver(() => this._onResize());
    this.resizeObserver.observe(this.canvas.parentElement);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.inView = entries[0].isIntersecting;
        if (this.inView && !this.frameId && !this.reducedMotion) {
          this.lastTime = performance.now();
          this.frameId = requestAnimationFrame(this._tick);
        }
      },
      { threshold: 0, rootMargin: "50px" }
    );
    this.intersectionObserver.observe(this.canvas);

    if (this.reducedMotion) {
      this._renderStatic();
      this._startReducedMotionCycle();
    } else {
      this._onResize();
    }
  }

  _startReducedMotionCycle() {
    this._reducedInterval = setInterval(() => {
      this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
      this._renderStatic();
    }, this.durations.vaporize + this.durations.fadeIn + this.durations.wait);
  }

  _renderStatic() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this._sizeCanvas(rect.width, rect.height);
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.fillStyle = this.color;
    ctx.font = `${this.font.fontWeight} ${parseInt(this.font.fontSize)}px ${this.font.fontFamily}`;
    ctx.textAlign = this.alignment;
    ctx.textBaseline = "middle";
    const x = this.alignment === "center" ? rect.width / 2 : this.alignment === "right" ? rect.width : 0;
    ctx.fillText(this.texts[this.currentTextIndex], x, rect.height / 2);
    ctx.restore();
  }

  _sizeCanvas(width, height) {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
  }

  _onResize() {
    if (this.reducedMotion) {
      this._renderStatic();
      return;
    }
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this._sizeCanvas(rect.width, rect.height);
    this._createParticles();
    this.state = "static";
    if (this.inView && !this.frameId) {
      this.frameId = requestAnimationFrame(this._tick);
    }
    if (!this._started) {
      this._started = true;
      setTimeout(() => {
        this.state = "vaporizing";
        this.vaporizeProgress = 0;
      }, 300);
    }
  }

  _createParticles() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const text = this.texts[this.currentTextIndex];
    const fontSize = parseInt(this.font.fontSize);
    const font = `${this.font.fontWeight} ${fontSize * this.dpr}px ${this.font.fontFamily}`;
    const color = this.color;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = this.alignment;
    ctx.textBaseline = "middle";

    const textY = canvas.height / 2;
    const textX =
      this.alignment === "center" ? canvas.width / 2 : this.alignment === "left" ? 0 : canvas.width;

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    let textLeft;
    if (this.alignment === "center") textLeft = textX - textWidth / 2;
    else if (this.alignment === "left") textLeft = textX;
    else textLeft = textX - textWidth;

    this.textBoundaries = { left: textLeft, right: textLeft + textWidth, width: textWidth };

    ctx.fillText(text, textX, textY);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const sampleRate = Math.max(1, Math.round(this.dpr / 3));
    const particles = [];

    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const i = (y * canvas.width + x) * 4;
        const alpha = data[i + 3];
        if (alpha > 0) {
          const originalAlpha = (alpha / 255) * (sampleRate / this.dpr);
          particles.push({
            x,
            y,
            originalX: x,
            originalY: y,
            color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${originalAlpha})`,
            opacity: originalAlpha,
            originalAlpha,
            velocityX: 0,
            velocityY: 0,
            angle: 0,
            speed: 0,
          });
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.particles = particles;

    const size = fontSize;
    const points = [
      { s: 20, v: 0.2 },
      { s: 50, v: 0.5 },
      { s: 100, v: 1.5 },
    ];
    let spreadBase;
    if (size <= points[0].s) spreadBase = points[0].v;
    else if (size >= points[2].s) spreadBase = points[2].v;
    else {
      const p = size < points[1].s ? [points[0], points[1]] : [points[1], points[2]];
      spreadBase = p[0].v + ((size - p[0].s) * (p[1].v - p[0].v)) / (p[1].s - p[0].s);
    }
    this.vaporizeSpread = spreadBase * this.spread;
  }

  _updateParticles(vaporizeX, deltaTime) {
    let allDone = true;
    const density = clampMap(this.density, 0, 10, 0.3, 1);
    this.particles.forEach((p) => {
      const should =
        this.direction === "left-to-right" ? p.originalX <= vaporizeX : p.originalX >= vaporizeX;
      if (should) {
        if (p.speed === 0) {
          p.angle = Math.random() * Math.PI * 2;
          p.speed = (Math.random() * 1 + 0.5) * this.vaporizeSpread;
          p.velocityX = Math.cos(p.angle) * p.speed;
          p.velocityY = Math.sin(p.angle) * p.speed;
          p.shouldFadeQuickly = Math.random() > density;
        }
        if (p.shouldFadeQuickly) {
          p.opacity = Math.max(0, p.opacity - deltaTime);
        } else {
          const dx = p.originalX - p.x;
          const dy = p.originalY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const damping = Math.max(0.95, 1 - dist / (100 * this.vaporizeSpread));
          const rs = this.vaporizeSpread * 3;
          p.velocityX = (p.velocityX + (Math.random() - 0.5) * rs + dx * 0.002) * damping;
          p.velocityY = (p.velocityY + (Math.random() - 0.5) * rs + dy * 0.002) * damping;
          const maxV = this.vaporizeSpread * 2;
          const curV = Math.sqrt(p.velocityX ** 2 + p.velocityY ** 2);
          if (curV > maxV) {
            const scale = maxV / curV;
            p.velocityX *= scale;
            p.velocityY *= scale;
          }
          p.x += p.velocityX * deltaTime * 20;
          p.y += p.velocityY * deltaTime * 10;
          const fadeRate = 0.25 * (2000 / this.durations.vaporize);
          p.opacity = Math.max(0, p.opacity - deltaTime * fadeRate);
        }
        if (p.opacity > 0.01) allDone = false;
      } else {
        allDone = false;
      }
    });
    return allDone;
  }

  _renderParticles() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    this.particles.forEach((p) => {
      if (p.opacity > 0) {
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity})`);
        ctx.fillRect(p.x / this.dpr, p.y / this.dpr, 1, 1);
      }
    });
    ctx.restore();
  }

  _resetParticles() {
    this.particles.forEach((p) => {
      p.x = p.originalX;
      p.y = p.originalY;
      p.opacity = p.originalAlpha;
      p.speed = 0;
      p.velocityX = 0;
      p.velocityY = 0;
    });
  }

  _tick(now) {
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const ctx = this.ctx;
    const canvas = this.canvas;

    if (!this.inView) {
      this.frameId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (this.state) {
      case "static":
      case "waiting":
        this._renderParticles();
        break;
      case "vaporizing": {
        this.vaporizeProgress += (dt * 100) / (this.durations.vaporize / 1000);
        if (!this.textBoundaries) break;
        const progress = Math.min(100, this.vaporizeProgress);
        const vx =
          this.direction === "left-to-right"
            ? this.textBoundaries.left + (this.textBoundaries.width * progress) / 100
            : this.textBoundaries.right - (this.textBoundaries.width * progress) / 100;
        const done = this._updateParticles(vx, dt);
        this._renderParticles();
        if (this.vaporizeProgress >= 100 && done) {
          this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length;
          this.state = "fadingIn";
          this.fadeOpacity = 0;
          this._createParticles();
        }
        break;
      }
      case "fadingIn": {
        this.fadeOpacity += (dt * 1000) / this.durations.fadeIn;
        ctx.save();
        ctx.scale(this.dpr, this.dpr);
        this.particles.forEach((p) => {
          p.x = p.originalX;
          p.y = p.originalY;
          const opacity = Math.min(this.fadeOpacity, 1) * p.originalAlpha;
          ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${opacity})`);
          ctx.fillRect(p.x / this.dpr, p.y / this.dpr, 1, 1);
        });
        ctx.restore();
        if (this.fadeOpacity >= 1) {
          this.state = "waiting";
          setTimeout(() => {
            this.state = "vaporizing";
            this.vaporizeProgress = 0;
            this._resetParticles();
          }, this.durations.wait);
        }
        break;
      }
    }

    this.frameId = requestAnimationFrame(this._tick);
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    if (this._reducedInterval) clearInterval(this._reducedInterval);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
  }
}

function clampMap(input, inMin, inMax, outMin, outMax) {
  const progress = (input - inMin) / (inMax - inMin);
  const result = outMin + progress * (outMax - outMin);
  return Math.min(Math.max(result, outMin), outMax);
}

window.VaporCycler = VaporCycler;
