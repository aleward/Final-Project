import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import {gl} from './globals';

class Audio {
    ctx: AudioContext;
    analyzer: any;
    buffLength: any;
    dataArr: any;


    constructor(file: string) {
        var loadAud = require('audio-loader');

        this.ctx =  require('audio-context')();

        loadAud('https://ia800502.us.archive.org/16/items/StairwayToHeaven_886/40StairwayToHeaven.mp3', {context: this.ctx}); //.then(function (buffer: any) {
        //     // buffer is an AudioBuffer 
        //     this.ctx = buffer.context;
        // });

        this.analyzer = this.ctx.createAnalyser();
        
        this.analyzer.fftSize = 2048;
        this.buffLength = this.analyzer.frequencyBinCount;
        this.dataArr = new Uint8Array(this.buffLength);
        console.log(this.dataArr);
        this.analyzer.getByteTimeDomainData(this.dataArr);
        console.log(this.dataArr);

    }

}
export default Audio;