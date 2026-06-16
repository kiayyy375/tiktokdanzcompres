const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();

const upload = multer({
  dest: "/tmp"
});

app.use(express.urlencoded({ extended: true }));

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
  max-width:600px;
  margin:50px auto;
  padding:20px;
}
h1{
  text-align:center;
}
form{
  display:flex;
  flex-direction:column;
  gap:15px;
}
button{
  padding:12px;
  cursor:pointer;
}
select,input{
  padding:10px;
}
</style>
</head>
<body>

<h1>TikTok Compressor</h1>

<form action="/compress" method="POST" enctype="multipart/form-data">

<input
  type="file"
  name="video"
  accept="video/*"
  required
/>

<select name="mode">
  <option value="safe">Safe (Kecil)</option>
  <option value="hd" selected>HD (Rekomendasi)</option>
  <option value="max">Max Quality</option>
</select>

<button type="submit">
Compress Video
</button>

</form>

</body>
</html>
  `);
});

app.post("/compress", upload.single("video"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      error: "Video tidak ditemukan"
    });
  }

  const mode = req.body.mode || "hd";

  const input = req.file.path;
  const output = `/tmp/compressed-${Date.now()}.mp4`;

  let crf = 22;

  if (mode === "safe") {
    crf = 24;
  }

  if (mode === "hd") {
    crf = 22;
  }

  if (mode === "max") {
    crf = 20;
  }

  const command = `
ffmpeg -y -i "${input}" \
-c:v libx264 \
-preset slow \
-crf ${crf} \
-r 60 \
-pix_fmt yuv420p \
-movflags +faststart \
-c:a aac \
-b:a 128k \
"${output}"
`;

  exec(command, (error, stdout, stderr) => {

    if (error) {

      if (fs.existsSync(input)) {
        fs.unlinkSync(input);
      }

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
  console.log("Server running on port " + PORT);
});
