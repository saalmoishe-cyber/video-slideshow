const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('status');
const downloadLink = document.getElementById('downloadLink');

submitBtn.addEventListener('click', async () => {
  const file = document.getElementById('videoFile').files[0];
  const interval = document.getElementById('interval').value;
  if(!file) { alert('Select a video first'); return; }

  status.textContent = "Uploading and processing...";
  submitBtn.disabled = true;
  downloadLink.style.display = "none";

  const formData = new FormData();
  formData.append('video', file);
  formData.append('interval', interval);

  try {
    const response = await fetch('/.netlify/functions/process', {
      method: 'POST',
      body: formData
    });

    if(!response.ok) throw new Error('Processing failed');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.style.display = "inline";
    status.textContent = "Done! Download your slideshow:";
  } catch(err){
    status.textContent = "Error: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
