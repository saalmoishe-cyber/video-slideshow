async function uploadAndConvert(file, interval = 1.5) {
  const form = new FormData();
  form.append("video", file);
  form.append("interval", String(interval));

  const resp = await fetch("/process", { method: "POST", body: form });
  if (!resp.ok) throw new Error("Processing failed: " + resp.statusText);

  const blob = await resp.blob();
  // create download link or play in browser
  const url = URL.createObjectURL(blob);
  return url;
}
