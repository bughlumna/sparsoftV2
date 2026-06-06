import React, { useEffect, useRef } from 'react';

export default function WaveCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const tRef      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let W, H;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const t      = tRef.current;
      const baseY  = H * 0.72;
      const spacing = 18;
      const cols   = Math.ceil(W / spacing) + 2;
      const rows   = 14;

      // ── Dot wave grid ──
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing - spacing / 2;
          const waveOffset =
            Math.sin(c * 0.18 + t * 0.7 + r * 0.35) * 24 +
            Math.sin(c * 0.09 - t * 0.4) * 16;
          const y      = baseY + r * spacing * 0.55 + waveOffset;
          const depth  = 1 - r / rows;
          const alpha  = 0.08 + depth * 0.22;
          const radius = 1.2 + depth * 1.2;
          const hue    = c / cols;
          const rr     = Math.round(hue * 60);
          const gg     = Math.round(180 + hue * 30);
          const bb     = Math.round(220 + (1 - hue) * 35);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
          ctx.fill();
        }
      }

      // ── Rising spikes ──
      const spikes = 28;
      for (let i = 0; i < spikes; i++) {
        const x         = (i / spikes) * W + spacing;
        const spikeWave = Math.sin(x * 0.008 + t * 0.5) * 0.5 + 0.5;
        const spikeH    = (0.4 + spikeWave * 0.6) * H * 0.42 +
                          Math.sin(t * 1.2 + i * 0.8) * 25;
        const alpha     = 0.25 + spikeWave * 0.45;
        const hue       = i / spikes;
        const sr        = hue > 0.4 && hue < 0.7 ? 200 : 0;
        const sg        = hue < 0.5 ? 160 : 80;

        const grad = ctx.createLinearGradient(x, baseY, x, baseY - spikeH);
        grad.addColorStop(0,   `rgba(${sr},${sg},220,0)`);
        grad.addColorStop(0.7, `rgba(${sr},${sg},220,${alpha})`);
        grad.addColorStop(1,   `rgba(${sr},${sg},220,${alpha * 0.5})`);

        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - spikeH);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        // tip dot
        ctx.beginPath();
        ctx.arc(x, baseY - spikeH, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sr + 80},${sg + 60},255,${alpha})`;
        ctx.fill();
      }

      tRef.current += 0.012;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
      }}
    />
  );
}
