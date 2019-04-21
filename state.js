class State {
  constructor() {
    // {video_id: {ffmpeg: ffmpeg task, ytdl: ytdl stream}}
    this.processes = {};
    this.addProcess.bind(this);
    this.deleteProcess.bind(this);
    this.deleteAllProcesses.bind(this);
    this.getProcess.bind(this);
    this.getAllProcesses.bind(this);
  }

  addProcess(video_id, propName, propValue) {
    if (this.processes[video_id] === undefined) {
      this.processes[video_id] = {};
    }
    this.processes[video_id][propName] = propValue;
  }

  deleteProcess(video_id) {
    if (this.processes[key].readable !== undefined) {
      this.processes[key].readable.unpipe();
      this.processes[key].readable.destroy();
    }
    if (this.processes[key].writeable !== undefined) {
      this.processes[key].writeable.destroy();
    }
    if (this.processes[key].ffmpeg !== undefined) {
      this.processes[key].ffmpeg.kill();
    }
    delete this.processes[video_id];
  }

  deleteAllProcesses() {
    for (let key in this.processes) {
      if (this.processes[key].readable !== undefined) {
        this.processes[key].readable.unpipe();
        this.processes[key].readable.destroy();
      }
      if (this.processes[key].writeable !== undefined) {
        this.processes[key].writeable.destroy();
      }
      if (this.processes[key].ffmpeg !== undefined) {
        this.processes[key].ffmpeg.kill();
      }
      delete this.processes[key];
    }
  }

  getProcess(video_id) {
    return this.processes[video_id];
  }

  getAllProcesses() {
    return this.processes;
  }
}

const state = new State();

module.exports = state;
