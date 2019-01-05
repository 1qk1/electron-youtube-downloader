const { ipcRenderer } = require("electron");
const $ = require("jquery");
let downloading = {};
document.querySelector(".back-btn").addEventListener("click", () => {
  ipcRenderer.send("page:main");
});

ipcRenderer.on("progress", (e, progressData) => {
  // video_id
  // progress %
  const { progress, video_id, completed } = progressData;

  const progressInt = parseInt(progress);

  if (downloading[video_id].progress === progressInt && !completed) return;

  downloading[video_id] = {
    ...downloading[video_id],
    progress: progressInt,
    completed
  };

  $(`#${video_id} .determinate`).css("width", `${progressInt}%`);
  $(`#${video_id} .progress-percentage p`).text(`${progressInt}%`);

  const totalProgress = parseInt(
    Object.values(downloading).reduce((sum, acc) => {
      return sum + acc.progress;
    }, 0) / Object.keys(downloading).length
  );

  $(".totalProgress .determinate").css("width", `${totalProgress}%`);
  $(".totalProgress-percentage p").text(`${totalProgress}%`);

  if (progressInt === 100) {
    $(`#${video_id} .progress-percentage p`).text("Encoding to mp3");
  }

  if (completed === true) {
    $(`#${video_id} .progress-percentage p`).text("Downloaded");
  }

  if (
    totalProgress === 100 &&
    Object.values(downloading).every(vid => vid.completed === true)
  ) {
    $(".totalProgress-percentage p").text("Downloaded");
  }
});

ipcRenderer.on("info", (error, info) => {
  const { title, thumbnail_url, video_id } = info;
  // title
  // thumbnail_url
  // video_id
  // description (?)
  downloading[video_id] = {
    title,
    thumbnail_url,
    progress: 0,
    completed: undefined,
    video_id
  };
  const elText = `
    <div class="row downloading-video" id="${video_id}">
      <div class="col s2">
        <img src="${thumbnail_url}" alt=""/>
      </div>
      <div class="col s8">
        <p>${title}</p>
      </div>
      <div class="progress-box col s2">
        <div class="progress">
          <div class="determinate" style="width: 0%"></div>
        </div>
        <div class="progress-percentage">
          <p>0%</p>
        </div>
      </div>
    </div>`;
  $(".video-showcase").append($.parseHTML(elText));
});

// https://www.youtube.com/watch?v=KfuukDHC0d8
// https://www.youtube.com/playlist?list=PLhG3EYJapgnHHzd9Fjf3iDf27RPMTAxfc
