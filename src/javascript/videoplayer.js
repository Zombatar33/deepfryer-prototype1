console.log("working 1");

const processor = {
    timerCallback() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        setTimeout(() => {
            this.timerCallback();
        }, 16); // roughly 60 frames per second
    },

    doLoad() {
        this.video = document.getElementById("my-video");
        this.c1 = document.getElementById("my-canvas");
        this.ctx1 = this.c1.getContext("2d");

        this.video.addEventListener("play", () => {
            this.width = this.video.width;
            this.height = this.video.height;
            this.timerCallback();
        }, false);
    },

    computeFrame() {
        this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
        const frame = this.ctx1.getImageData(0, 0, this.width, this.height);
        const l = frame.data.length / 4;

        for (let i = 0; i < l; i++) {
            const grey = (frame.data[i * 4 + 0] + frame.data[i * 4 + 1] + frame.data[i * 4 + 2]) / 3;

            frame.data[i * 4 + 0] = grey;
            frame.data[i * 4 + 1] = grey;
            frame.data[i * 4 + 2] = grey;
        }
        this.ctx1.putImageData(frame, 0, 0);

        return;
    }
};