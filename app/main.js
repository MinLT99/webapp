const { app, BrowserWindow } = require('electron');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      worldSafeExecuteJavaScript: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // ...các thiết lập khác cho cửa sổ chính...

  // Đóng cửa sổ chính khi ứng dụng được đóng
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// Gọi hàm createWindow khi ứng dụng đã sẵn sàng
app.whenReady().then(() => {
  createWindow();

  // Tạo cửa sổ mới khi ứng dụng được mở lại trên macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Đóng ứng dụng khi tất cả các cửa sổ đã đóng (trên Windows và Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});