import express from 'express';
import si from 'systeminformation';
import clipboardy from 'clipboardy';
import sqlite3 from 'sqlite3';

// ایجاد اتصال به دیتابیس SQLite
const db = new sqlite3.Database('./systeminfo.db', (err) => {
    if (err) {
        console.error('خطا در اتصال به دیتابیس:', err);
    } else {
        console.log('اتصال به دیتابیس با موفقیت برقرار شد.');

        // ایجاد جدول برای ذخیره اطلاعات سیستم
        db.run(`
            CREATE TABLE IF NOT EXISTS system_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cpu TEXT,
                memory TEXT,
                disk TEXT,
                graphics TEXT,
                motherboard TEXT,
                usb_devices TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('خطا در ایجاد جدول:', err);
            } else {
                console.log('جدول اطلاعات سیستم با موفقیت ایجاد شد.');
            }
        });
    }
});

const app = express();
const PORT = 3000;

// ارائه فایل‌های استاتیک مانند HTML
app.use(express.static('public'));

// هنگامی که کاربر روی دکمه کلیک می‌کند، اطلاعات سیستم را جمع‌آوری می‌کند
app.post('/collect', async (req, res) => {
    try {
        const cpu = await si.cpu();  // اطلاعات پردازنده
        const mem = await si.mem();  // اطلاعات حافظه
        const disk = await si.diskLayout();  // اطلاعات دیسک
        const graphics = await si.graphics();  // اطلاعات کارت گرافیک
        const usbDevices = await si.usb();  // اطلاعات دستگاه‌های USB
        const baseboard = await si.baseboard();  // اطلاعات مادربورد

        // ایجاد متن اطلاعات برای کپی کردن در کلیپ‌بورد
        const usbInfo = usbDevices.map(device => `Vendor: ${device.vendor}, Name: ${device.name}, Type: ${device.type}`).join('\n');
        
        const message = `
        CPU: ${cpu.manufacturer} ${cpu.brand}
        Memory: ${(mem.total / (1024 * 1024 * 1024)).toFixed(2)} GB
        Disk: ${disk[0].vendor} ${disk[0].name} ${(disk[0].size / (1024 * 1024 * 1024)).toFixed(2)} GB
        Graphics: ${graphics.controllers[0].model}
        Motherboard: ${baseboard.manufacturer} ${baseboard.model}
        USB Devices:
        ${usbInfo}
        `;

        // ذخیره اطلاعات در کلیپ‌بورد
        clipboardy.writeSync(message);
        console.log('اطلاعات در کلیپ‌بورد ذخیره شد.');

        // ذخیره اطلاعات در دیتابیس
        db.run(`
            INSERT INTO system_info (cpu, memory, disk, graphics, motherboard, usb_devices)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                `${cpu.manufacturer} ${cpu.brand}`,
                `${(mem.total / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                `${disk[0].vendor} ${disk[0].name} ${(disk[0].size / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                `${graphics.controllers[0].model}`,
                `${baseboard.manufacturer} ${baseboard.model}`,
                usbInfo
            ], 
            (err) => {
                if (err) {
                    console.error('خطا در ذخیره اطلاعات در دیتابیس:', err);
                } else {
                    console.log('اطلاعات سیستم با موفقیت در دیتابیس ذخیره شد.');
                }
            }
        );

        res.send('اطلاعات سیستم شما در کلیپ‌بورد ذخیره و در دیتابیس ذخیره شد.');

    } catch (err) {
        console.error('خطا در جمع‌آوری اطلاعات:', err);  // لاگ خطا
        res.status(500).send('خطا در جمع‌آوری اطلاعات');
    }
});

// راه‌اندازی سرور
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
