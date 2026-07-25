"use client";

export function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // First tone
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    // Second chime after short pause
    setTimeout(() => {
      const ctx2 = new AudioContext();
      const osc2 = ctx2.createOscillator();
      const gain2 = ctx2.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx2.destination);
      osc2.frequency.setValueAtTime(1100, ctx2.currentTime);
      osc2.frequency.setValueAtTime(1320, ctx2.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.3, ctx2.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.4);
      osc2.start(ctx2.currentTime);
      osc2.stop(ctx2.currentTime + 0.4);
    }, 300);
  } catch {}
}
