import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/merge", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || urls.length === 0)
      return res.status(400).json({ error: "No video URLs provided" });

    const tempFiles = [];

    // Download each video
    for (let i = 0; i < urls.length; i++) {
      const response = await fetch(urls[i]);
      const buffer = await response.arrayBuffer();
      const filePath = `video_${i}.mp4`;
      fs.writeFileSync(filePath, Buffer.from(buffer));
      tempFiles.push(filePath);
    }

    // Output file path
    const output = "merged_output.mp4";

    let command = ffmpeg();

    tempFiles.forEach(file => command = command.input(file));

    command
      .on("end", () => {
        const fileBuffer = fs.readFileSync(output);
        res.setHeader("Content-Type", "video/mp4");
        res.send(fileBuffer);

        // Cleanup
        tempFiles.forEach(f => fs.unlinkSync(f));
        fs.unlinkSync(output);
      })
      .on("error", (err) => res.status(500).json({ error: err.message }))
      .mergeToFile(output);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("FFmpeg API running")
);
