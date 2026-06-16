const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();

const upload = multer({
  dest: "uploads/"
});

app.get("/", (req, res) => {
  res.send("TikTok Compressor Ready");
});

app.post("/compress", upload.single("video"), (req, res) => {

  const input = req.file.path;
  const output = `uploads/compressed-${Date.now()}.mp4`;

  const ffmpeg = `
ffmpeg -i "${input}" \
-c:v libx264 \
-preset slow \
-crf 22 \
-r 60 \
-pix_fmt yuv420p \
-movflags +faststart \
-c:a aac \
-b:a 128k \
"${output}"
`;

  exec(ffmpeg, (err) => {

    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    res.download(output, () => {

      fs.unlinkSync(input);

      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }
    });

  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on ${PORT}`);
});