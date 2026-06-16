const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");

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
<style>
body{
  font-family: Arial, sans-serif;
  max-width: 500px;
  margin: 50px auto;
  text-align: center;
}
button{
  padding:10px 20px;
}
</style>
</head>
<body>

<h2>TikTok Compressor</h2>

<form action="/patch" method="POST" enctype="multipart/form-data">
  <input type="file" name="video" accept="video/*" required>
  <br><br>
  <button type="submit">Process Video</button>
</form>

</body>
</html>
`);
});

app.post("/patch", upload.single("video"), async (req, res) => {

  let inputFile = null;
  let outputFile = null;

  try {

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded"
      });
    }

    inputFile = req.file.path;
    outputFile = `/tmp/output-${Date.now()}.mp4`;

    console.log("INPUT:", inputFile);
    console.log("OUTPUT:", outputFile);

    await new Promise((resolve, reject) => {

      exec(
  `ffmpeg -y \
-itsscale 2 \
-i "${inputFile}" \
-vf "scale='if(gte(iw,ih),-2,720)':'if(gte(iw,ih),720,-2)'" \
-r 60 \
-c:v libx264 \
-preset ultrafast \
-crf 28 \
-maxrate 6M \
-bufsize 6M \
-pix_fmt yuv420p \
-threads 1 \
-c:a copy \
-movflags +faststart \
"${outputFile}"`,
        (error, stdout, stderr) => {

          if (error) {
            console.error(stderr);
            reject(error);
            return;
          }

          console.log(stdout);
          resolve();
        }
      );

    });

    res.download(outputFile, "video_clean.mp4", (err) => {

      try {

        if (inputFile && fs.existsSync(inputFile)) {
          fs.unlinkSync(inputFile);
        }

        if (outputFile && fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }

      } catch (e) {
        console.error(e);
      }

      if (err) {
        console.error(err);
      }

    });

  } catch (err) {

    console.error(err);

    try {

      if (inputFile && fs.existsSync(inputFile)) {
        fs.unlinkSync(inputFile);
      }

      if (outputFile && fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }

    } catch (e) {}

    res.status(500).json({
      error: err.message
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
