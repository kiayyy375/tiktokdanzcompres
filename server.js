const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));

const upload = multer({
  dest: "/tmp",
  limits: {
    fileSize: 200 * 1024 * 1024
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
  font-family:Arial;
  max-width:600px;
  margin:40px auto;
  padding:20px;
}
form{
  display:flex;
  flex-direction:column;
  gap:15px;
}
input,select,button{
  padding:12px;
}
button{
  cursor:pointer;
}
</style>
</head>
<body>

<h2>TikTok Compressor</h2>

<form action="/compress" method="POST" enctype="multipart/form-data">

<input
type="file"
name="video"
accept="video/*"
required
/>

<select name="mode">
<option value="safe">Safe</option>
<option value="hd" selected>HD</option>
<option value="max">Max</option>
</select>

<button type="submit">
Compress
</button>

</form>

</body>
</html>
`);
});

app.post("/compress", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: "No video uploaded"
    });
  }

  const input = req.file.path;
  const output = `/tmp/output-${Date.now()}.mp4`;

  const mode = req.body.mode || "hd";

  let bitrate = "3000k";

  if (mode === "safe") {
    bitrate = "2500k";
  }

  if (mode === "hd") {
    bitrate = "5000k";
  }

  if (mode === "max") {
    bitrate = "8000k";
  }

  const command = `
ffmpeg -y \
-i "${input}" \
-c:v libx264 \
-preset veryfast \
-threads 2 \
-b:v ${bitrate} \
-maxrate ${bitrate} \
-bufsize 12000k \
-r 60 \
-pix_fmt yuv420p \
-movflags +faststart \
-c:a aac \
-b:a 128k \
"${output}"
`;

  exec(command, (error, stdout, stderr) => {

    if (error) {

      try {
        if (fs.existsSync(input)) {
          fs.unlinkSync(input);
        }
      } catch {}

      return res.status(500).json({
        error: error.message,
        ffmpeg: stderr
      });
    }

    res.download(output, "compressed.mp4", () => {

      try {

        if (fs.existsSync(input)) {
          fs.unlinkSync(input);
        }

        if (fs.existsSync(output)) {
          fs.unlinkSync(output);
        }

      } catch (e) {
        console.error(e);
      }

    });

  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
