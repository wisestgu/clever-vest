"""Original soundtrack for the Dollo brag video.

120 BPM, E-flat major, afrobeats-leaning groove with an amapiano-style log drum, kalimba-like
plucks and a soft pad. Sound effects are tuned to the key, quantised to the same beat grid and
mixed under the music. Everything is synthesised here; no samples.
"""
import sys
import wave
import numpy as np

SR = 48000
DUR = 24.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM
STEP = BEAT / 4  # 16th note
rng = np.random.default_rng(7)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
send = np.zeros((N, 2))  # reverb send


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, t, sig, gain=1.0, pan=0.0, rev=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    s = sig[: max(0, N - i)]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + len(s), 0] += s * gain * l * 1.414
    buf[i : i + len(s), 1] += s * gain * r * 1.414
    if rev:
        send[i : i + len(s), 0] += s * gain * rev
        send[i : i + len(s), 1] += s * gain * rev


def env(n, a=0.005, d=0.3, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d) ** curve
    return e


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def highpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (cutoff / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)) * (1 / np.sqrt(1 + (f / hi) ** 4))
    return np.fft.irfft(X, len(x))


# ---------------- instruments ----------------

def kick(dur=0.35):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 12)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.25
    return np.tanh((s + click) * 1.6) * 0.9


def clap():
    n = int(SR * 0.25)
    t = np.arange(n) / SR
    noise = bandpass(rng.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for off in (0, 0.011, 0.022):
        k = int(off * SR)
        e[k:] += np.exp(-(t[: n - k]) * 60)
    e += np.exp(-t * 18) * 0.5
    return noise * e * 0.35


def rim(m=75):
    n = int(SR * 0.08)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 70) + bandpass(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 120) * 0.4
    return s * 0.35


def shaker(accent=False):
    n = int(SR * 0.07)
    t = np.arange(n) / SR
    s = bandpass(rng.standard_normal(n), 6000, 14000) * np.minimum(1, t / 0.006) * np.exp(-t * 55)
    return s * (0.16 if accent else 0.08)


def openhat():
    n = int(SR * 0.22)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 7000, 16000) * np.exp(-t * 14) * 0.07


def logdrum(m, dur=0.42):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m) * (1 + 0.35 * np.exp(-t * 40))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    s *= np.minimum(1, t / 0.003) * np.exp(-t * 9.5)
    return np.tanh(s * 1.8) * 0.55


def kalimba(m, dur=0.9):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.28 * np.sin(2 * np.pi * f * 5.42 * t) * np.exp(-t * 26) + 0.12 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9)
    s *= np.minimum(1, t / 0.002)
    return s * 0.32


def pad(notes, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in notes:
        for det in (-0.07, 0.07):
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t + 0.3)
    s /= len(notes) * 2
    a = np.minimum(1, t / 0.35)
    r = np.minimum(1, (dur - t) / 0.3)
    return highpass(lowpass(s * a * np.clip(r, 0, 1), 1800), 160) * 0.2


def bell(m, dur=1.4, bright=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7) * bright + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14) * bright
    return s * np.minimum(1, t / 0.002) * 0.3


def thump(m=39):
    n = int(SR * 0.45)
    t = np.arange(n) / SR
    f = hz(m) * (1 + 1.2 * np.exp(-t * 30))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    s += lowpass(rng.standard_normal(n), 1200) * np.exp(-t * 35) * 0.5
    return np.tanh(s * 1.4) * 0.7


def tick(m=96):
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * hz(m) * t) * 0.6 + bandpass(rng.standard_normal(n), 3000, 9000) * 0.4) * np.exp(-t * 160) * 0.25


def whoosh(dur=0.3):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = bandpass(rng.standard_normal(n), 400, 6000)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return s * e * 0.1


def riser(dur=1.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # sweep by blending a dull and bright version
    dull = lowpass(noise, 600)
    bright = bandpass(noise, 1500, 9000)
    x = t / dur
    s = dull * (1 - x) + bright * x
    tone = np.sin(2 * np.pi * np.cumsum(hz(63) * (1 + x)) / SR) * 0.15
    return (s * 0.12 + tone) * x ** 1.6


def glide(m0, m1, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = t / dur
    f = hz(m0) * (hz(m1) / hz(m0)) ** x
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 8 * t))
    return s * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.03) * 0.12


# ---------------- arrangement ----------------
CHORDS = [
    ([51, 55, 58, 62], 39),  # Ebmaj7, root Eb2
    ([48, 51, 55, 58], 36),  # Cm7
    ([44, 48, 51, 55], 32),  # Abmaj7
    ([46, 50, 53, 60], 34),  # Bb add9
]
DROP = 3.0
END_GROOVE = 22.0

for bar in range(12):
    t0 = bar * 2.0
    notes, root = CHORDS[bar % 4]
    if t0 < END_GROOVE:
        place(music, t0, pad(notes, 2.05), 1.0, 0, rev=0.25)

# final ring-out chord at 22.0
place(music, 22.0, pad([51, 55, 58, 62, 65], 2.0), 1.3, 0, rev=0.5)

MOTIF = [(0, 70), (3, 75), (6, 79), (8, 77), (10, 75), (14, 72), (16, 70), (19, 72), (22, 75), (24, 79), (27, 77), (30, 82)]
KICK = [0, 3, 8, 11]
LOG = [(0, 0), (3, 0), (6, 12), (10, 0), (13, 12)]

total_steps = int(DUR / STEP)
for s in range(total_steps):
    t = s * STEP
    bar_step = s % 16
    bar = s // 16
    notes, root = CHORDS[bar % 4]
    # shaker from 0.5s
    if t >= 0.5 and t < END_GROOVE:
        place(music, t, shaker(bar_step % 4 == 2), 1.7 if t >= DROP else 1.0, pan=0.35)
    if t < DROP or t >= END_GROOVE:
        continue
    if bar_step in KICK or (bar_step == 14 and bar % 2 == 1):
        place(music, t, kick(), 0.62)
    if bar_step in (4, 12):
        place(music, t, clap(), 1.05, pan=-0.05, rev=0.15)
    if bar_step in (6, 10, 15):
        place(music, t, rim(75), 0.85, pan=-0.4)
    if bar_step in (2, 6, 10, 14):
        place(music, t, openhat(), 1.6, pan=0.25)
    for st, octv in LOG:
        if bar_step == st:
            place(music, t, logdrum(root + octv), 0.58)
    # kalimba motif over 2 bars
    ms = s % 32
    for st, m in MOTIF:
        if ms == st and t >= DROP + 0.0:
            place(music, t, kalimba(m), 1.15, pan=0.2 if m > 75 else -0.2, rev=0.35)
    # fill before the outro hit
    if 21.5 <= t < 22.0 and bar_step % 2 == 1:
        place(music, t, clap(), 0.5, rev=0.1)

# drop impact and final hit
place(music, DROP, thump(39), 0.8)
place(music, 22.0, kick(), 1.0)
place(music, 22.0, thump(39), 0.9)
crash_n = int(SR * 1.8)
tc = np.arange(crash_n) / SR
place(music, 22.0, bandpass(rng.standard_normal(crash_n), 3000, 15000) * np.exp(-tc * 2.2) * 0.12, 1.0, rev=0.3)
place(music, 22.0, kalimba(87, 1.6), 0.9, rev=0.6)
place(music, 22.25, kalimba(82, 1.4), 0.6, rev=0.6)
place(music, 22.5, kalimba(79, 1.4), 0.5, rev=0.6)

# ---------------- sound effects (in E-flat, on the grid) ----------------
for k in range(12):  # engraving: soft ticks while the guilloche draws (0.125 .. 1.5)
    place(sfx, 0.125 + k * STEP, tick(91 + (k % 3) * 2), 0.5, pan=(k % 5 - 2) * 0.2)
place(sfx, 1.5, thump(39), 0.9)  # "$1" stamps down
place(sfx, 1.5, bell(87, 1.0, 0.6), 0.35, rev=0.4)
place(sfx, 2.0, riser(1.0), 1.0, rev=0.2)
for t, m in ((4.0, 75), (4.5, 79), (5.0, 82)):  # route stations pop
    place(sfx, t, kalimba(m + 12, 0.6), 0.7, rev=0.4)
for t in (5.75, 9.75, 13.75, 16.75, 19.75, 21.75):  # transitions
    place(sfx, t, whoosh(0.25), 1.0)
place(sfx, 7.0, tick(84), 0.8)
for k in range(6):  # confirmations
    place(sfx, 7.25 + k * 0.25, tick(96), 0.35)
place(sfx, 8.5, bell(87), 0.55, rev=0.4)  # credited
place(sfx, 8.5, bell(94), 0.3, rev=0.4)
place(sfx, 10.5, thump(46), 0.75)  # BUY stamp
for t in (11.0, 12.15, 12.65, 14.7):  # taps
    place(sfx, t, tick(89), 0.9)
for t, m in ((12.875, 79), (13.0, 82), (13.125, 87)):  # bought
    place(sfx, t, bell(m, 1.0), 0.4, rev=0.35)
place(sfx, 14.75, bell(91, 0.6), 0.35, rev=0.3)  # correct
place(sfx, 15.625, bell(99, 0.5, 1.4), 0.45)  # coin clink
place(sfx, 15.75, bell(96, 0.4, 1.4), 0.25)
place(sfx, 16.0, bell(87, 1.2), 0.45, rev=0.4)  # earned
place(sfx, 17.5, glide(63, 70, 1.5), 1.0)  # holding
for t, m in ((19.0, 75), (19.125, 79), (19.25, 82), (19.375, 87)):  # sent
    place(sfx, t, bell(m, 1.0), 0.4, rev=0.35)

# ---------------- mix ----------------
ir_n = int(SR * 1.6)
ti = np.arange(ir_n) / SR
ir = rng.standard_normal((ir_n, 2)) * np.exp(-ti * 3.4)[:, None]
ir[:, 0] = lowpass(ir[:, 0], 5000)
ir[:, 1] = lowpass(ir[:, 1], 5000)
ir /= np.sqrt((ir ** 2).sum(axis=0))
wet = np.zeros_like(send)
for c in range(2):
    L = N + ir_n
    nfft = 1 << (L - 1).bit_length()
    wet[:, c] = np.fft.irfft(np.fft.rfft(send[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N]

mix = music * 1.0 + sfx * 0.6 + wet * 0.35
mix[:, 0] = highpass(mix[:, 0], 38)
mix[:, 1] = highpass(mix[:, 1], 38)
# gentle fade at the very end
fade = int(SR * 0.6)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) / 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', out, f'{DUR}s', 'peak', float(np.max(np.abs(mix))))
