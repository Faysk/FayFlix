const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Define o diretório base
const DiretorioBase = 'E:/BT/Blob';
const scriptName = path.basename(__filename, '.js');
const logsDir = path.join(DiretorioBase, 'Logs');

async function generateGIFs(gifsDir, videosDir) {
    try {
        // Busca vídeos em todas as subpastas
        const allVideos = await getAllVideos(videosDir);

        // Verifica GIFs existentes para vídeos existentes
        for (const videoPath of allVideos) {
            const videoName = path.parse(videoPath).name;
            const gifPath = path.join(gifsDir, `${videoName}.gif`);

            // Verifica se o GIF já existe
            if (await fs.pathExists(gifPath)) {
                continue;
            }

            // Cria o GIF
            try {
                await createOptimizedGIF(videoPath, gifPath);
            } catch (error) {
                writeToLog(`Error creating GIF for ${videoName}: ${error}`);
            }
        }

        // Limpeza de GIFs
        await cleanupGIFs(gifsDir, videosDir);
    } catch (error) {
        writeToLog(`Error generating GIFs: ${error}`);
    }
}

async function getAllVideos(directory) {
    const files = await fs.readdir(directory);
    let allVideos = [];

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            const subfolderVideos = await getAllVideos(filePath);
            allVideos = allVideos.concat(subfolderVideos);
        } else if (isVideoFile(filePath)) {
            allVideos.push(filePath);
        }
    }

    return allVideos;
}

function isVideoFile(filePath) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
}

async function hasCorrespondingVideo(videosDir, videoName) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    for (const ext of videoExtensions) {
        const potentialVideoPath = path.join(videosDir, `${videoName}${ext}`);
        if (await fs.pathExists(potentialVideoPath)) {
            return true;
        }
    }
    return false;
}

async function createOptimizedGIF(videoPath, gifPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(gifPath)
            .withInputFPS(24)
            .noAudio()
            .outputOptions([
                '-vf', 'scale=320:-1', // Reduz a resolução para largura de 640 pixels, mantendo a proporção
                '-r', '7', // Define a taxa de quadros de saída para 15 FPS
                '-pix_fmt', 'rgb8', // Define o formato de pixel para reduzir o número de cores
                '-t', '7' // Limita a duração do GIF a 10 segundos (ou use -frames para limitar o número de quadros)
            ])
            .on('end', () => resolve())
            .on('error', (error) => reject(error))
            .run();
    });
}


async function writeToLog(message) {
    try {
        const now = new Date();
        const mesAno = `${now.getMonth() + 1}-${now.getFullYear()}`;
        const timestamp = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}_${now.getDate()}-${mesAno}`;
        const logMessage = `[${timestamp}] ${message}\n`;
        const logDir = path.join(logsDir, `${scriptName}_${now.getDate()}-${mesAno}`);
        await fs.ensureDir(logDir);
        const logFilePath = path.join(logDir, `${scriptName}_${timestamp}.log`);
        await fs.appendFile(logFilePath, logMessage);
    } catch (error) {
        console.error('Error writing to log:', error);
    }
}

// Usage
const gifsDir = path.join(DiretorioBase, 'GIFs');
const videosDir = path.join(DiretorioBase, 'Videos');
(async () => {
    try {
        await generateGIFs(gifsDir, videosDir);
    } catch (error) {
        writeToLog(`Unhandled error: ${error}`);
    }
})();
