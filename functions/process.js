import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export async function onRequestPost({ request }) {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  const formData = await request.formData();
  const file = formData.get('video');
  const interval = parseFloat(formData.get('interval')) || 1.5;

  const arrayBuffer = await file.arrayBuffer();
  ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(arrayBuffer));

  // Extract frames every interval seconds
  await ffmpeg.run('-i', 'input.mp4', '-vf', `fps=1/${interval}`, 'frame_%03d.png');

  // Recreate slideshow video
  await ffmpeg.run('-framerate', '1', '-i', 'frame_%03d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', 'slideshow.mp4');

  // Add original audio
  await ffmpeg.run('-i', 'slideshow.mp4', '-i', 'input.mp4', '-c:v', 'copy', '-c:a', 'aac', '-shortest', 'final.mp4');

  const data = ffmpeg.FS('readFile', 'final.mp4');

  return new Response(data.buffer, {
    headers: { 'Content-Type': 'video/mp4' }
  });
}
