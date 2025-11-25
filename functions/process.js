// functions/process.js
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

export async function onRequestPost({ request }) {
  try {
    // parse multipart form (Cloudflare Request.formData() works in Pages functions)
    const form = await request.formData();
    const file = form.get("video");
    const intervalStr = form.get("interval") || "1.5";
    const interval = parseFloat(intervalStr) || 1.5;

    if (!file) {
      return new Response("Missing 'video' file field", { status: 400 });
    }

    // load FFmpeg.wasm - corePath may be provided from a CDN for speed/stability
    const ffmpeg = createFFmpeg({
      log: true,
      // corePath optional: use a stable CDN version if desired
      // corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    });
    await ffmpeg.load();

    // write the uploaded file to ffmpeg FS
    const arrBuf = await file.arrayBuffer();
    ffmpeg.FS("writeFile", "input.mp4", new Uint8Array(arrBuf));

    // 1) extract frames every 'interval' seconds
    // fps filter expects frame rate, so fps = 1 / interval
    const fpsFilter = `fps=${1 / interval}`;
    await ffmpeg.run("-i", "input.mp4", "-vf", fpsFilter, "frame_%03d.png");

    // 2) create slideshow video from frames
    // use framerate = 1/interval for input, output 30fps
    await ffmpeg.run(
      "-framerate",
      String(1 / interval),
      "-i",
      "frame_%03d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "slideshow.mp4"
    );

    // 3) add original audio back (shortest ensures it stops at end of shorter)
    await ffmpeg.run(
      "-i",
      "slideshow.mp4",
      "-i",
      "input.mp4",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-shortest",
      "final.mp4"
    );

    // read result and return
    const data = ffmpeg.FS("readFile", "final.mp4");
    const buffer = data.buffer;

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", 'attachment; filename="slideshow.mp4"');

    return new Response(buffer, { status: 200, headers });

  } catch (err) {
    console.error("Processing error:", err);
    return new Response("Server error: " + String(err.message || err), { status: 500 });
  }
}
