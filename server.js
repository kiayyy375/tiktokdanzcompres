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

<!DOCTYPE html><html>
<head>
<meta charset="UTF-8">
<title>TikTok Compressor</title>
</head>
<body>
<h2>TikTok Compressor</h2><form action="/patch" method="POST" enctype="multipart/form-data">
<input type="file" name="video" required>
<button type="submit">Compress Video</button>
</form></body>
</html>
`);
});app.post("/patch", upload.single("video"), async (req, res) => {
let input = null;
let output = null;

try {
input = req.file.path;
output = "/tmp/output-${Date.now()}.mp4";

await new Promise((resolve, reject) => {
  exec(
    `ffmpeg -y -itsscale 2 -i "${input}" -c copy -map 0 -movflags +faststart "${output}"`,
    (err) => {
      if (err) reject(err);
      else resolve();
    }
  );
});

res.download(output, "video_clean.mp4", () => {
  try {
    if (input && fs.existsSync(input)) fs.unlinkSync(input);
    if (output && fs.existsSync(output)) fs.unlinkSync(output);
  } catch {}
});

} catch (err) {

try {
  if (input && fs.existsSync(input)) fs.unlinkSync(input);
  if (output && fs.existsSync(output)) fs.unlinkSync(output);
} catch {}

res.status(500).json({
  error: err.message
});

}
});

app.listen(process.env.PORT || 3000, () => {
console.log("Server running");
});
