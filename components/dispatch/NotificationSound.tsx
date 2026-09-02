"use client";

let audioRef: HTMLAudioElement | null = null;
let loopInterval: ReturnType<typeof setInterval> | null = null;
let unlocked = false;

// Pre-load and unlock audio on first user interaction
if (typeof window !== "undefined") {
  const unlock = () => {
    if (unlocked) return;
    const a = new Audio("/booking-alert.wav");
    a.volume = 0;
    a.play().then(() => { a.pause(); unlocked = true; }).catch(() => {});
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock);
}

export function startNotificationLoop() {
  stopNotificationLoop();
  const play = () => {
    try {
      if (audioRef) {
        audioRef.currentTime = 0;
        audioRef.play().catch(() => {});
      } else {
        const audio = new Audio("/booking-alert.wav");
        audio.volume = 1.0;
        audioRef = audio;
        audio.play().catch(() => {});
      }
    } catch {}
  };
  play();
  loopInterval = setInterval(play, 2000);
}

export function stopNotificationLoop() {
  if (loopInterval) { clearInterval(loopInterval); loopInterval = null; }
  if (audioRef) {
    try { audioRef.pause(); audioRef.currentTime = 0; } catch {}
    audioRef = null;
  }
}

export function playNotificationSound() {
  try {
    const audio = new Audio("/booking-alert.wav");
    audio.volume = 1.0;
    audio.play().catch(() => {});
  } catch {}
}
