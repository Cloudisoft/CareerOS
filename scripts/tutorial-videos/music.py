"""Original background music for the tutorial videos, synthesised from scratch
(pads, arpeggio, bass, soft percussion). No samples or third-party audio, so
the tracks are free of copyright claims. Usage: music.py <seed> <seconds> <out.wav>
"""
import math, random, struct, sys, wave

SR = 22050

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

# Chord progressions as scale degrees (semitones from the key root): pleasant, upbeat pop/lo-fi shapes.
PROGS = [
    [(0, 4, 7, 11), (9, 12, 16, 19), (5, 9, 12, 16), (7, 11, 14, 17)],   # Imaj7 vi7 IVmaj7 V
    [(0, 4, 7, 14), (7, 11, 14, 18), (9, 12, 16, 19), (5, 9, 12, 16)],   # I V vi IV (add9)
    [(5, 9, 12, 16), (7, 11, 14, 17), (4, 7, 11, 14), (9, 12, 16, 19)],  # IV V iii vi
    [(0, 4, 7, 11), (5, 9, 12, 16), (2, 5, 9, 12), (7, 11, 14, 17)],     # I IV ii V
    [(9, 12, 16, 19), (5, 9, 12, 16), (0, 4, 7, 11), (7, 11, 14, 18)],   # vi IV I V
]

def render(seed, seconds):
    rnd = random.Random(seed)
    key = 48 + [0, 2, 3, 5, 7, 8, 10, 1, 4, 6][seed % 10]
    bpm = [96, 102, 108, 92, 100, 104, 98, 110, 94, 106][seed % 10]
    prog = PROGS[seed % len(PROGS)]
    beat = 60.0 / bpm
    bar = beat * 4
    n = int(seconds * SR)
    buf = [0.0] * n

    def add(start, dur, freq, amp, kind):
        s0 = int(start * SR)
        length = int(dur * SR)
        for i in range(length):
            j = s0 + i
            if j >= n:
                break
            t = i / SR
            if kind == "pad":
                a = min(1.0, t / 0.6) * min(1.0, (dur - t) / 0.8)
                v = math.sin(2 * math.pi * freq * t) + 0.35 * math.sin(2 * math.pi * freq * 2.003 * t) + 0.12 * math.sin(2 * math.pi * freq * 3.01 * t)
                v *= 0.85 + 0.15 * math.sin(2 * math.pi * 0.3 * t)
            elif kind == "pluck":
                a = math.exp(-t * 6.5) * min(1.0, t / 0.004)
                v = math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 9)
            elif kind == "bass":
                a = min(1.0, t / 0.01) * math.exp(-t * 1.6)
                v = math.sin(2 * math.pi * freq * t) + 0.2 * math.sin(2 * math.pi * freq * 2 * t)
            elif kind == "kick":
                a = math.exp(-t * 14)
                f = 50 + 70 * math.exp(-t * 30)
                v = math.sin(2 * math.pi * f * t)
            else:  # hat
                a = math.exp(-t * 60)
                v = rnd.uniform(-1, 1)
            buf[j] += v * a * amp

    t = 0.0
    bar_i = 0
    arp_pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    while t < seconds:
        chord = prog[bar_i % len(prog)]
        for d in chord[:3]:
            add(t, bar + 0.4, midi(key + 12 + d), 0.06, "pad")
        add(t, bar, midi(key - 12 + chord[0]), 0.16, "bass")
        add(t + beat * 2.5, beat * 1.5, midi(key - 12 + chord[0]), 0.08, "bass")
        if bar_i >= 1:  # let the intro breathe
            for k in range(8):
                note = key + 24 + chord[arp_pattern[(k + bar_i) % 8]]
                add(t + k * beat / 2, beat * 1.2, midi(note), 0.05 if k % 2 else 0.065, "pluck")
        if bar_i >= 2:
            for b in range(4):
                if b in (0, 2):
                    add(t + b * beat, 0.35, 0, 0.22, "kick")
                add(t + b * beat + beat / 2, 0.08, 0, 0.018, "hat")
        t += bar
        bar_i += 1

    # fade in/out and normalise
    fi, fo = int(1.2 * SR), int(2.2 * SR)
    for i in range(min(fi, n)):
        buf[i] *= i / fi
    for i in range(min(fo, n)):
        buf[n - 1 - i] *= i / fo
    peak = max(1e-9, max(abs(x) for x in buf))
    return [x / peak * 0.85 for x in buf]

if __name__ == "__main__":
    seed, secs, out = int(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
    data = render(seed, secs)
    with wave.open(out, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x)) * 32767)) for x in data))
    print("wrote", out)
