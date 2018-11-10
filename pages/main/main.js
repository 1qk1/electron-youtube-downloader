const { ipcRenderer } = require("electron");
const { dialog } = require("electron").remote;
let outputFolder;

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('select');
  var instances = M.FormSelect.init(elems);
});


document.querySelector("form").addEventListener("submit", e => {
  e.preventDefault();
  if (outputFolder === undefined) return;
  const downloadInfo = {};
  const inputs = document.querySelectorAll('[name]');
  inputs.forEach(inp => downloadInfo[inp.name] = inp.value);
  ipcRenderer.send("page:download", {
    ...downloadInfo,
    outputFolder
  });
});

document.querySelector(".select-folder").addEventListener("click", e => {
  outputFolder = dialog.showOpenDialog({
    properties: ["openDirectory"]
  })[0];
  document.querySelector(".output-folder-preview").textContent = outputFolder;
});
