import express from 'express';
import si from 'systeminformation';
import clipboardy from 'clipboardy';

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

        // ایجاد متن اطلاعات برای کپی کردن در کلیپ‌بورد
        const usbInfo = usbDevices.map(device => `Vendor: ${device.vendor}, Name: ${device.name}, Type: ${device.type}`).join('\n');
        
        const message = `
        CPU: ${cpu.manufacturer} ${cpu.brand}
        Memory: ${(mem.total / (1024 * 1024 * 1024)).toFixed(2)} GB
        Disk: ${disk[0].vendor} ${disk[0].name} ${(disk[0].size / (1024 * 1024 * 1024)).toFixed(2)} GB
        Graphics: ${graphics.controllers[0].model}
        USB Devices:
        ${usbInfo}
        `;

        console.log('اطلاعات سیستم جمع‌آوری شد:');
        console.log(message);  // نمایش اطلاعات جمع‌آوری شده در ترمینال

        // ذخیره اطلاعات در کلیپ‌بورد
        clipboardy.writeSync(message);
        console.log('اطلاعات در کلیپ‌بورد ذخیره شد.');

        res.send('اطلاعات سیستم شما در کلیپ‌بورد ذخیره شد. لطفاً آن را در چت تلگرام یا هرجای دیگری جایگذاری کنید!');

    } catch (err) {
        console.error('خطا در جمع‌آوری اطلاعات:', err);  // لاگ خطا
        res.status(500).send('خطا در جمع‌آوری اطلاعات');
    }
});

// راه‌اندازی سرور
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
