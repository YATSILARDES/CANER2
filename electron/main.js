import electron from 'electron';
const { app, BrowserWindow, dialog } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Otomatik güncelleme loglarını aktif et
autoUpdater.logger = console;
autoUpdater.autoDownload = false; // Kullanıcıya sorarak indirmek için false yapabiliriz, ama genelde otomatik istenir. Şimdilik false yapıp soralım.

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:3000');
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    return win;
}

app.whenReady().then(() => {
    const win = createWindow();

    // Uygulama açıldığında güncelleme kontrolü yap
    if (process.env.NODE_ENV !== 'development') {
        autoUpdater.checkForUpdates();
    }

    // Güncelleme bulundu
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox(win, {
            type: 'info',
            title: 'Güncelleme Mevcut',
            message: 'Yeni bir sürüm bulundu. İndirmek ister misiniz?',
            buttons: ['Evet', 'Hayır']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    });

    // Güncelleme indirildi
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(win, {
            type: 'info',
            title: 'Güncelleme Hazır',
            message: 'Güncelleme indirildi. Uygulama kapatılıp güncellensin mi?',
            buttons: ['Evet, Şimdi Yeniden Başlat', 'Daha Sonra']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
