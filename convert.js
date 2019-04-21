const fs = require("fs"),
  ffmpeg = require("fluent-ffmpeg"),
  request = require("request"),
  state = require("./state");

const convert = (video_id, title, downloadFolder, thumbnail_url, callback) => {
  // download the image
  const imageFileName = `${downloadFolder}/${video_id}.jpg`;
  // encode the stream to mp3

  return request(thumbnail_url)
    .pipe(fs.createWriteStream(imageFileName))
    .on("close", () =>
      createFfmpegTask(video_id, title, downloadFolder, imageFileName, callback)
    );
};

function createFfmpegTask(
  video_id,
  title,
  downloadFolder,
  imageFileName,
  callback
) {
  const task = ffmpeg(`${downloadFolder}/${video_id}.mp3`)
    .addOutputOptions(
      "-i",
      imageFileName,
      "-acodec",
      "libmp3lame",
      "-b:a",
      "256k",
      "-map",
      "0:a:0",
      "-map",
      "1:v:0",
      "-c:v",
      "copy",
      "-id3v2_version",
      "3"
    )
    // .audioBitrate(Number(downloadQuality))
    // .audioCodec("libmp3lame")
    .save(`${downloadFolder}/${title}.mp3`)
    .on("error", function(err, stdout, stderr) {
      console.log("ffmpeg stdout:\n" + stdout);
      console.log("ffmpeg stderr:\n" + stderr);
      callback(error);
    })
    .on("end", () => {
      fs.unlinkSync(`${downloadFolder}/${video_id}.mp3`);
      fs.unlinkSync(imageFileName);
      console.log("finished downloading");
      callback(null);
    });
  state.addProcess(video_id, "ffmpeg", task);
}

module.exports = convert;
