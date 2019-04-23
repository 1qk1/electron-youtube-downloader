const { app, BrowserWindow, ipcMain } = require("electron"),
  ytdl = require("ytdl-core"),
  ytlist = require("youtube-playlist"),
  upath = require("upath"),
  state = require("./state"),
  downloadOne = require("./download");

let mainWindow;

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
  process.env.DOWNLOAD_FOLDER = upath.normalize(outputFolder);
  if (ytdl.validateID(url) || ytdl.validateURL(url)) {
    downloadOne({ url, downloadQuality, mainWindow });
  } else {
    downloadPlaylist({ url, downloadQuality });
  }
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
