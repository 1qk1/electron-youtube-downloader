const { ipcRenderer } = require("electron");
let downloading = {};
document.querySelector(".back-btn").addEventListener("click", () => {
  ipcRenderer.send("page:main");
});

ipcRenderer.on("progress", (e, progressData) => {
  // video_id
  // progress %
  const downloadingVideos = document.querySelectorAll('.downloading-video .progress-box');
  const {progress, video_id} = progressData;
  downloading[video_id].progress = progress || 0;

  const totalProgress = Object.values(downloading).reduce((sum, acc) => {
    return sum + (acc.progress || 0);
  }, 0) / Object.keys(downloading).length;
  if (totalProgress === 100) {
    document.querySelector(".progress-message").textContent =
      "Downloaded successfully!";
  }
  downloadingVideos.forEach(vid => {
    const id = vid.parentElement.id;
    const progress = downloading[id].progress;
    vid.children[0].children[0].setAttribute('style', `width: ${progress}%`)
    vid.children[1].children[0].textContent = `${Math.floor(progress)}%`
  })
  // console.log(downloadingVideos);
});

ipcRenderer.on("info", (error, info) => {
  const {title, thumbnail_url, video_id } = info;
  // title
  // thumbnail_url
  // video_id
  // description (?)
  downloading[video_id] = {title, thumbnail_url}
  console.log(downloading);
  const elements = Object.values(downloading).reduce((a, b) => {
    const elText = `
    <div class="row downloading-video" id="${video_id}">
      <div class="col s2">
        <img src="${b.thumbnail_url}" alt=""/>
      </div>
      <div class="col s8">
        <p>${b.title}</p>
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
    return [...a, elText];
  },[])
  document.querySelector('.video-showcase').innerHTML = elements.join('');
});
