let context: AudioContext | undefined;
export function tone(kind: 'hop' | 'point' | 'end' | 'on') {
  try {
    context ??= new AudioContext();
    void context.resume();
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'square';
    const start = context.currentTime;
    const frequency = { hop: 360, point: 790, end: 150, on: 560 }[kind];
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'end' ? 45 : frequency * 1.45, start + .09);
    gain.gain.setValueAtTime(.035, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + .13);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(); oscillator.stop(start + .15);
    return true;
  } catch { return false; }
}
