const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "SatyaLens - Forensic Lab",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load React (Dev mode: localhost:3000 / Prod: build file)
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  win.loadURL(startUrl);
}

// --- BACKGROUND PYTHON HANDLER ---
function startPython() {
  console.log("Starting SatyaLens Engine...");
  // In development, we run python directly
  pythonProcess = spawn('python', ['backend/main.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python Engine]: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error]: ${data}`);
  });
}

app.whenReady().then(() => {
  startPython();
  createWindow();
});

// Kill Python when app closes
app.on('will-quit', () => {
  if (pythonProcess) pythonProcess.kill();
});