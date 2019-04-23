const { remote, BrowserWindow } = require("electron"),
  ytdl = require("ytdl-core"),
  fs = require("fs"),
  sanitizer = require("sanitize-filename"),
  convert = require("./convert"),
  state = require("./state");

const downloadOne = async ({ url, downloadQuality }) => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  // if url is invalid return
  if (!ytdl.validateURL(url) && !ytdl.validateID(url)) return;
  // get basic video info
  const videoInfo = await ytdl.getBasicInfo(url);
  let { title, video_id, thumbnail_url } = videoInfo;
  title = sanitizer(title);
  // add "vid" at the start of the video id
  video_id = `vid-${video_id}`;

  // send the info back to the main window
  mainWindow.webContents.send("info", {
    title,
    thumbnail_url,
    video_id
  });

  // start the download
  const readable = ytdl(url, {
    filter: "audio",
    highWaterMark: 1024 * 1024 * 10
  })
    .on("error", error => {
      errorHandler(error, video_id);
    })
    .on("progress", (chunk, downloaded, total) => {
      const progress = (downloaded / total) * 100;
      mainWindow.webContents.send("progress", { progress, video_id });
    })
    // after download ends convert the file to mp3
    .on("end", () => {
      convert({ video_id, title, downloadQuality, thumbnail_url }, error => {
        mainWindow.webContents.send("progress", {
          completed: true,
          video_id,
          progress: 100
        });
        if (error !== null) {
          return errorHandler(error, video_id);
        }
        state.deleteProcess(video_id);
      });
    });
  // add the readable stream in the processes object so we can control it
  state.addProcess(video_id, "readable", readable);
  let writeable = readable.pipe(
    fs.createWriteStream(`${process.env.DOWNLOAD_FOLDER}/${video_id}.mp3`)
  );
  state.addProcess(video_id, "writeable", writeable);
};

module.exports = downloadOne;
