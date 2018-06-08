var { app, BrowserWindow, Menu } = require('electron');

app.on('ready', () => {
    let window = new BrowserWindow();
    window.loadURL(`file://${__dirname}/dist/index.html`);
    window.webContents.openDevTools();
})