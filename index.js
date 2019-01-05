const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ytlist = require("youtube-playlist");
const sanitizer = require("sanitize-filename");

let mainWindow;
let ffmpegProccess = {};
let downloadFolder;

const initWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760
  });

  mainWindow.on("close", () => {
    clearDownloads();
  });

  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

const clearDownloads = () => {
  if (ffmpegProccess.length !== 0) {
    for (let proccess in ffmpegProccess) {
      ffmpegProccess[proccess].task.kill();
    }
    ffmpegProccess = {};
  }
};

const loadMain = () => {
  clearDownloads();
  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

const loadDownload = (e, downloadInfo) => {
  mainWindow.loadFile(`${__dirname}/pages/download/download.html`);
  download(downloadInfo);
};

const download = downloadInfo => {
  const { url, outputFolder, downloadQuality } = downloadInfo;
  downloadFolder = outputFolder;
  if (ytdl.validateID(url) || ytdl.validateURL(url)) {
    downloadOne({ url, downloadQuality });
  } else {
    downloadPlaylist({ url, downloadQuality });
  }
};

const downloadOne = async ({ url, downloadQuality }) => {
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
  const stream = ytdl(url, {
    // quality: "highestaudio",
    filter: "audio",
    highWaterMark: 1024 * 1024 * 10
  })
    .on("error", e => {
      console.log(e);
    })
    .on("progress", (chunk, downloaded, total) => {
      const progress = (downloaded / total) * 100;
      mainWindow.webContents.send("progress", { progress, video_id });
    });

  // encode the stream to mp3
  const task = ffmpeg(stream)
    .audioBitrate(Number(downloadQuality))
    .audioCodec("libmp3lame")
    .save(`${downloadFolder}/${video_id}.mp3`)
    .on("error", () => {
      stream.pause();
      stream.destroy();
      fs.unlink(`${downloadFolder}/${video_id}.mp3`, () => {
        console.log("deleted file");
      });
    })
    .on("end", () => {
      // const filenameRegex = /(["/\\:*?<>|])/gi;
      fs.rename(
        `${downloadFolder}/${video_id}.mp3`,
        // `${downloadFolder}/${title.replace(filenameRegex, "")}.mp3`,
        `${downloadFolder}/${sanitizer(title)}.mp3`,
        () => {
          mainWindow.webContents.send("progress", {
            completed: true,
            video_id,
            progress: 100
          });
          console.log("finished downloading");
          delete ffmpegProccess[video_id];
        }
      );
    });
  ffmpegProccess[video_id] = { video_id, task };
};

const downloadPlaylist = info => {
  const { url, downloadQuality } = info;
  ytlist(url, "id")
    .then(list => {
      console.log(list.data.playlist, "list");
      list.data.playlist.forEach(id =>
        downloadOne({ url: id, downloadQuality })
      );
    })
    .catch(error => {
      console.log("invalid url");
    });
};

app.on("ready", initWindow);

ipcMain.on("page:download", loadDownload);
ipcMain.on("page:main", loadMain);
