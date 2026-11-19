const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');

const app = express();
app.use(express.raw({ type: '*/*', limit: '150mb' }));

app.get('/', (req, res) => {
  res.status(200).send('AgriBook Cloud Converter is Running');
});

app.post('/convert', (req, res) => {
  if (!req.body || !req.body.length) {
    return res.status(400).send('Empty video buffer');
  }

  const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const inFile = `/tmp/in_${id}.mp4`;
  const outFile = `/tmp/out_${id}.ogv`;

  const cleanup = () => {
    try { if (fs.existsSync(inFile)) fs.unlinkSync(inFile); } catch (_) {}
    try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (_) {}
  };

  try {
    fs.writeFileSync(inFile, req.body);
  } catch (e) {
    cleanup();
    return res.status(500).send('Write error');
  }

  execFile(
    'ffmpeg',
    [
      '-y',
      '-i', inFile,
      '-c:v', 'libtheora',
      '-q:v', '5',
      '-c:a', 'libvorbis',
      '-q:a', '3',
      outFile
    ],
    (err) => {
      if (err || !fs.existsSync(outFile)) {
        cleanup();
        return res.status(500).send('Conversion failed');
      }

      res.sendFile(outFile, () => {
        cleanup();
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});