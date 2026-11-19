const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('برنامج AgriBook Cloud Converter قيد التشغيل');
});

app.post('/convert', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).send('No video data received');
  }

  const id = Date.now() + '_' + Math.floor(Math.random() * 10000);
  const inputPath = path.join(os.tmpdir(), `in_${id}.mp4`);
  const outputPath = path.join(os.tmpdir(), `out_${id}.ogv`);

  fs.writeFileSync(inputPath, req.body);

  ffmpeg(inputPath)
    .outputOptions([
      '-vf', "scale='min(640,iw)':-2",
      '-r', '24',
      '-c:v', 'libtheora',
      '-q:v', '5',
      '-c:a', 'libvorbis',
      '-q:a', '3'
    ])
    .toFormat('ogg')
    .on('end', () => {
      res.sendFile(outputPath, () => {
        try { fs.unlinkSync(inputPath); } catch (e) {}
        try { fs.unlinkSync(outputPath); } catch (e) {}
      });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
      res.status(500).send('Conversion failed');
    })
    .save(outputPath);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});