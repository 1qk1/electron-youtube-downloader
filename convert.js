const fs = require("fs"),
  ffmpeg = require("fluent-ffmpeg"),
  request = require("request"),
  state = require("./state");

const convert = (
  { video_id, title, downloadQuality, thumbnail_url },
  callback
) => {
  // download the image
  const imageFileName = `${process.env.DOWNLOAD_FOLDER}/${video_id}.jpg`;
  return (
    request(thumbnail_url)
      .pipe(fs.createWriteStream(imageFileName))
      // when download ends encode the stream to mp3
      .on("close", () =>
        createFfmpegTask(
          video_id,
          title,
          downloadQuality,
          imageFileName,
          callback
        )
      )
  );
};

function createFfmpegTask(
  video_id,
  title,
  downloadQuality,
  imageFileName,
  callback
) {
  const task = ffmpeg(`${process.env.DOWNLOAD_FOLDER}/${video_id}.mp3`)
    .addOutputOptions(
      "-i",
      imageFileName,
      "-b:a",
      `${downloadQuality}k`,
      "-map",
      "0:a:0",
      "-map",
      "1:v:0",
      "-c:v",
      "copy",
      "-acodec",
      "libmp3lame",
      "-id3v2_version",
      "3"
    )
    .save(`${process.env.DOWNLOAD_FOLDER}/${title}.mp3`)
    .on("error", function(error, stdout, stderr) {
      console.log("ffmpeg stdout:\n" + stdout);
      console.log("ffmpeg stderr:\n" + stderr);
      callback(error);
    })
    .on("end", () => {
      fs.unlinkSync(`${process.env.DOWNLOAD_FOLDER}/${video_id}.mp3`);
      fs.unlinkSync(imageFileName);
      console.log("finished downloading");
      callback(null);
    });
  state.addProcess(video_id, "ffmpeg", task);
}

module.exports = convert;
