const { app, BrowserWindow, ipcMain } = require("electron"),
  fs = require("fs"),
  ytdl = require("ytdl-core"),
  ytlist = require("youtube-playlist"),
  sanitizer = require("sanitize-filename"),
  upath = require("upath"),
  convert = require("./convert"),
  state = require("./state");

let mainWindow;
let downloadFolder;

const initWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760
  });

  mainWindow.on("close", () => {
    state.deleteAllProcesses();
  });

  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

errorHandler = (error, video_id) => {
  console.log("error:", error);
  console.log("deleting processes for video_id:", video_id);
  state.deleteProcess(video_id);
};

const loadMain = () => {
  state.deleteAllProcesses();
  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

const loadDownload = (e, downloadInfo) => {
  mainWindow.loadFile(`${__dirname}/pages/download/download.html`);
  download(downloadInfo);
};

const download = downloadInfo => {
  const { url, outputFolder, downloadQuality } = downloadInfo;
  downloadFolder = upath.normalize(outputFolder);
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
      // console.log(progress);
    })
    // after download ends convert the file to mp3
    .on("end", () => {
      convert(
        video_id,
        title,
        downloadFolder,
        downloadQuality,
        thumbnail_url,
        error => {
          mainWindow.webContents.send("progress", {
            completed: true,
            video_id,
            progress: 100
          });
          if (error !== null) {
            return errorHandler(error, video_id);
          }
          state.deleteProcess(video_id);
        }
      );
    });
  // add the readable stream in the processes object so we can control it
  state.addProcess(video_id, "readable", readable);
  let writeable = readable.pipe(
    fs.createWriteStream(`${downloadFolder}/${video_id}.mp3`)
  );
  state.addProcess(video_id, "writeable", writeable);
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
