//SOUND FEAUTURES - necessary functions for p5
// uys7, amp, and fft declared in main.ts

function preload() {
    uys7 = loadSound(["songs/uys7.mp3", "songs/uys7.wav"]);
    brss = loadSound("songs/brss.mp3");
    hyena = loadSound("songs/hyena.mp3");
    tuning = loadSound("songs/tuner.mp3");
    chord = loadSound("songs/mid-c.mp3");
    tone = loadSound("songs/c-tune.mp3");
}

function setup() {
    brss.loop();
    amp = new p5.Amplitude();
    fft = new p5.FFT(0.8, 64);
    
    starFFT = new p5.FFT(0.9, 32);
    noteFFT = new p5.FFT(0.9, 1024);
    // console.log(fft.getOctaveBands());
    // peaks = uys7.processPeaks(function(){});
}