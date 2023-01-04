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

        var brightness = 0; // -100 | 100
        var contrast = 0; // -100 | 100
        var noise = 0; // 0 | 100
        var sv = 1; // 0 | 10
        var sharpen_factor = 5; // 0 | 10
        var hue = 270; // 0 | 360
        var jpeg_quality = 30; // 0 | 100

        // constant to determine luminance of red. Similarly, for green and blue
        var luR = 0.3086;
        var luG = 0.6094;
        var luB = 0.0820;

        var az = (1 - sv) * luR + sv;
        var bz = (1 - sv) * luG;
        var cz = (1 - sv) * luB;
        var dz = (1 - sv) * luR;
        var ez = (1 - sv) * luG + sv;
        var fz = (1 - sv) * luB;
        var gz = (1 - sv) * luR;
        var hz = (1 - sv) * luG;
        var iz = (1 - sv) * luB + sv;

        // invert colors
        for (let i = 0; i < l; i++) {
            const data = frame.data;

            // invert
            frame.data[i * 4 + 0] = 255 - data[i * 4 + 0];
            frame.data[i * 4 + 1] = 255 - data[i * 4 + 1];
            frame.data[i * 4 + 2] = 255 - data[i * 4 + 2];

            // brightness, -100 bis 100
            frame.data[i * 4 + 0] += 255 * (brightness / 100);
            frame.data[i * 4 + 1] += 255 * (brightness / 100);
            frame.data[i * 4 + 2] += 255 * (brightness / 100);

            // contrast, -100 bis 100
            var factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
            frame.data[i * 4 + 0] = truncateColor(factor * (frame.data[i * 4 + 0] - 128.0) + 128.0);
            frame.data[i * 4 + 1] = truncateColor(factor * (frame.data[i * 4 + 1] - 128.0) + 128.0);
            frame.data[i * 4 + 2] = truncateColor(factor * (frame.data[i * 4 + 2] - 128.0) + 128.0);

            // noise, 0 bis 100
            var noise_factor = noise / 100;
            frame.data[i * 4 + 0] = frame.data[i * 4 + 0] + ((Math.random() * 255) * noise_factor)
            frame.data[i * 4 + 1] = frame.data[i * 4 + 1] + ((Math.random() * 255) * noise_factor)
            frame.data[i * 4 + 2] = frame.data[i * 4 + 2] + ((Math.random() * 255) * noise_factor)

            // saturation
            var red = frame.data[i * 4 + 0];
            var green = frame.data[i * 4 + 1];
            var blue = frame.data[i * 4 + 2];

            var saturatedRed = (az * red + bz * green + cz * blue);
            var saturatedGreen = (dz * red + ez * green + fz * blue);
            var saturateddBlue = (gz * red + hz * green + iz * blue);

            frame.data[i * 4 + 0] = saturatedRed;
            frame.data[i * 4 + 1] = saturatedGreen;
            frame.data[i * 4 + 2] = saturateddBlue;
        }

        this.ctx1.putImageData(frame, 0, 0);

        sharpen(this.ctx1, this.width, this.height, sharpen_factor);

        this.ctx1.filter = `hue-rotate(${hue}deg)`;

        return;
    }
};

function truncateColor(value) {
    if (value < 0) {
        value = 0;
    } else if (value > 255) {
        value = 255;
    }

    return value;
}

const sharpen = (ctx, w, h, mix) => {
    var x, sx, sy, r, g, b, a, dstOff, srcOff, wt, cx, cy, scy, scx,
        weights = [0, -1, 0, -1, 5, -1, 0, -1, 0],
        katet = Math.round(Math.sqrt(weights.length)),
        half = (katet * 0.5) | 0,
        dstData = ctx.createImageData(w, h),
        dstBuff = dstData.data,
        srcBuff = ctx.getImageData(0, 0, w, h).data,
        y = h;
    while (y--) {
        x = w;
        while (x--) {
            sy = y;
            sx = x;
            dstOff = (y * w + x) * 4;
            r = 0;
            g = 0;
            b = 0;
            a = 0;
            if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
                for (cy = 0; cy < katet; cy++) {
                    for (cx = 0; cx < katet; cx++) {
                        scy = sy + cy - half;
                        scx = sx + cx - half;

                        if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                            srcOff = (scy * w + scx) * 4;
                            wt = weights[cy * katet + cx];

                            r += srcBuff[srcOff] * wt;
                            g += srcBuff[srcOff + 1] * wt;
                            b += srcBuff[srcOff + 2] * wt;
                            a += srcBuff[srcOff + 3] * wt;
                        }
                    }
                }

                dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
                dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
                dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix);
                dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
            } else {
                dstBuff[dstOff] = srcBuff[dstOff];
                dstBuff[dstOff + 1] = srcBuff[dstOff + 1];
                dstBuff[dstOff + 2] = srcBuff[dstOff + 2];
                dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
            }
        }
    }

    ctx.putImageData(dstData, 0, 0);
}