const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const randomString = require("randomstring");
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
  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

const loadMain = () => {
  if (ffmpegProccess.length !== 0) {
    for (let proccess in ffmpegProccess) {
      ffmpegProccess[proccess].task.kill('SIGSTOP');
      fs.unlink(`${downloadFolder}/${proccess}.mp3`, () => {
        console.log('deleted file', proccess);
      })
    }
    ffmpegProccess = {};
  }
  mainWindow.loadFile(`${__dirname}/pages/main/main.html`);
};

const loadDownload = (e, downloadInfo) => {
  mainWindow.loadFile(`${__dirname}/pages/download/download.html`);
  download(downloadInfo);
};

const download = downloadInfo => {
  const { url, urlType, outputFolder, downloadQuality } = downloadInfo;
  downloadFolder = outputFolder
  if (urlType === "video") {
    downloadOne({url, downloadQuality});
  } else if (urlType === "playlist") {
    downloadPlaylist({url, downloadQuality});
  }
};

const downloadOne = async ({ url, downloadQuality }) => {
  if (!ytdl.validateURL(url) && !ytdl.validateID(url)) return;
  const videoInfo = await ytdl.getBasicInfo(url);
  const { title, video_id } = videoInfo;
  videoInfo.title = sanitizer(title);
  // Write video data in a .json to read them later and
  // replace the 320kbps option with "highest"
  // fs.writeFileSync(`${__dirname}/${videoInfo.video_id}.json`, JSON.stringify(videoInfo));

  (() => {
    const { thumbnail_url } = videoInfo
    mainWindow.webContents.send("info", {
      title,
      thumbnail_url,
      video_id
    });
  })()

  const stream = ytdl(url, {
    // quality: "highestaudio"
    filter: "audio",
    highWaterMark: 1024 * 1024 * 10
  })
    .on("error", e => {
      console.log(e);
    })
    .on("progress", (chunk, downloaded, total) => {
      const progress = (downloaded / total) * 100;
      mainWindow.webContents.send("progress", {progress, video_id});
    });
  const task = ffmpeg(stream)
    .audioBitrate(Number(downloadQuality))
    .save(`${downloadFolder}/${video_id}.mp3`)
    .on("end", () => {
      fs.rename(
        `${downloadFolder}/${video_id}.mp3`,
        `${downloadFolder}/${title}.mp3`,
        () => {
          console.log("finished downloading");
          // ffmpegProccess[video_id].task.kill("SIGSTOP");
          delete ffmpegProccess[video_id];
        }
      );
    });
  ffmpegProccess[video_id] = ({ video_id, task });
};

const downloadPlaylist = async info => {
  const {url, downloadQuality} = info
  const list = await ytlist(url, "id");
  list.data.playlist.forEach(id => downloadOne({ url: id, downloadQuality }));
};

app.on("ready", initWindow);

ipcMain.on("page:download", loadDownload);
ipcMain.on("page:main", loadMain);
