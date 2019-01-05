const { ipcRenderer } = require("electron");
const { dialog } = require("electron").remote;
const $ = require("jquery");
const Store = require("electron-store");
const store = new Store();

let outputFolder = store.get("downloadFolder") || "";

document.addEventListener("DOMContentLoaded", function() {
  const elems = document.querySelectorAll("select");
  M.FormSelect.init(elems);
});

const initValues = () => {
  document.querySelector(".output-folder-preview").textContent = outputFolder;
  const downloadQuality = store.get("downloadQuality") || "";
  $('[name="downloadQuality"').val(downloadQuality);
};

$("form").on("submit", function(e) {
  e.preventDefault();
  if (outputFolder === undefined) return;
  const downloadInfo = {};
  const inputs = document.querySelectorAll("[name]");
  inputs.forEach(inp => (downloadInfo[inp.name] = inp.value));
  ipcRenderer.send("page:download", {
    ...downloadInfo,
    outputFolder
  });
});

$('[name="downloadQuality"').on("change", e => {
  const selectElement = e.target;
  const selectedQuality =
    selectElement.options[selectElement.selectedIndex].value;
  store.set("downloadQuality", selectedQuality);
  downloadQuality = selectedQuality;
});

$(".select-folder").on("click", e => {
  const selectedFolder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  })[0];
  outputFolder = selectedFolder;
  store.set("downloadFolder", selectedFolder);
  document.querySelector(".output-folder-preview").textContent = outputFolder;
});

initValues();
