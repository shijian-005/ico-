const express = require('express');
const app = express();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/pyc-ico', upload.single('image'), async (req, res) => {
    try {
        const size = parseInt(req.body.size);
        if (isNaN(size) || ![16, 32, 48].includes(size)) {
            return res.status(400).send('请选择有效的尺寸（16/32/48）');
        }

        const inputPath = req.file.path;
        const outputPath = path.join('uploads', `${Date.now()}.ico`);


        await sharp(inputPath)
            .resize(size, size)
            .toFile(outputPath);

        res.setHeader('Content-Type', 'image/x-icon');
        res.setHeader('Content-Disposition', 'attachment; filename="favicon.ico"');
        fs.createReadStream(outputPath).pipe(res);

        res.on('finish', () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('处理错误:', error);
        res.status(500).send('生成过程中出现错误，请重试');
    }
});


const port = 3000;
app.listen(port, () => {
    console.log(`服务器已启动，访问 http://localhost:${port}`);
});