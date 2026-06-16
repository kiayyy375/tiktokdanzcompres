const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");

const { patchMp4 } = require("./patcher");

const app = express();

const upload = multer({
  dest: "/tmp",
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>TikTok Compressor</title>
</head>
<body>
<h2>TikTok Compressor</h2>

<form action="/patch" method="POST" enctype="multipart/form-data">
<input type="file" name="video" required>
<button type="submit">Compress Video</button>
</form>

</body>
</html>
`);
});

app.post("/patch", upload.single("video"), async (req, res) => {

  try {

    const input = req.file.path;

    const ffmpegFile = `/tmp/ffmpeg-${Date.now()}.mp4`;

    await new Promise((resolve, reject) => {

      exec(
        `ffmpeg -y -itsscale 2 -i "${input}" -c copy -map 0 -movflags +faststart "${ffmpegFile}"`,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );

    });

    const buffer = fs.readFileSync(ffmpegFile);

    const patched = patchMp4(buffer);

    const finalFile = `/tmp/final-${Date.now()}.mp4`;

    fs.writeFileSync(finalFile, patched);

    res.download(finalFile, "video_clean.mp4");

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

app.listen(process.env.PORT || 3000);
