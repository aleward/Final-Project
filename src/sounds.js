//SOUND FEAUTURES - necessary functions for p5
// uys7, amp, and fft declared in main.ts

function preload() {
    uys7 = loadSound(["songs/uys7.mp3", "songs/uys7.wav"]);
}

function setup() {
    uys7.loop();
    amp = new p5.Amplitude();
    fft = new p5.FFT(0.8, 64);
    // peaks = uys7.processPeaks(function(){});
}