const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Define o diretório base
const DiretorioBase = 'E:/BT/Blob';
const scriptName = path.basename(__filename, '.js');
const logsDir = path.join(DiretorioBase, 'Logs');

async function generateThumbnails(videoDir, thumbDir) {
    try {
        // Garante que os diretórios existam
        await fs.ensureDir(videoDir);
        await fs.ensureDir(thumbDir);

        // Função recursiva para encontrar vídeos em subdiretórios
        async function findAndProcessVideos(directory) {
            const files = await fs.readdir(directory);
            for (const file of files) {
                const filePath = path.join(directory, file);
                const fileStat = await fs.stat(filePath);

                if (fileStat.isDirectory()) {
                    await findAndProcessVideos(filePath); // Chamada recursiva para subdiretórios
                } else if (isVideoFile(filePath)) {
                    try {
                        const thumbnailPath = path.join(thumbDir, `${path.parse(file).name}.png`);

                        if (!(await fs.pathExists(thumbnailPath))) {
                            await extractVideoThumbnail(filePath, thumbnailPath);
                        }
                    } catch (error) {
                        await writeToLog(`Error processing video ${file}: ${error}`);
                    }
                }
            }
        }

        await findAndProcessVideos(videoDir); // Inicia a busca recursiva no diretório de vídeos

        // Remover miniaturas de vídeos que não existem mais
        await removeObsoleteThumbnails(thumbDir, videoDir);
    } catch (error) {
        await writeToLog(`Error generating thumbnails: ${error}`);
    }
}

async function removeObsoleteThumbnails(thumbDir, videoDir) {
    try {
        const thumbnailFiles = await fs.readdir(thumbDir);
        for (const file of thumbnailFiles) {
            const filePath = path.join(thumbDir, file);
            const fileStat = await fs.stat(filePath);

            if (!fileStat.isDirectory() && isImageFile(filePath)) {
                const correspondingVideo = await findCorrespondingVideoInSubfolders(videoDir, file);

                if (!correspondingVideo) {
                    await fs.unlink(filePath);
                }
            }
        }
    } catch (error) {
        await writeToLog(`Error removing obsolete thumbnails: ${error}`);
    }
}

async function findCorrespondingVideoInSubfolders(directory, thumbnailFileName) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const thumbnailName = path.parse(thumbnailFileName).name;

    try {
        const files = await fs.readdir(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const fileStat = await fs.stat(filePath);

            if (fileStat.isDirectory()) {
                const correspondingVideo = await findCorrespondingVideoInSubfolders(filePath, thumbnailFileName);
                if (correspondingVideo) {
                    return correspondingVideo;
                }
            } else if (isVideoFile(filePath) && path.parse(file).name === thumbnailName) {
                return filePath;
            }
        }
        return null; // Se não encontrar nenhum vídeo correspondente
    } catch (error) {
        return null; // Em caso de erro, retorna nulo
    }
}

function isVideoFile(filePath) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
}

function isImageFile(filePath) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
    const ext = path.extname(filePath).toLowerCase();
    return imageExtensions.includes(ext);
}

async function extractVideoThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            })
            .screenshots({
                count: 1,
                folder: path.dirname(thumbnailPath),
                filename: `${path.parse(videoPath).name}.png`,
                size: '320x?', // Defina o tamanho da miniatura
                quality: 5, // Defina a qualidade da imagem (0 - 100)
            });
    });
}

async function writeToLog(message) {
    try {
        const now = new Date();
        const mesAno = `${now.getMonth() + 1}-${now.getFullYear()}`;
        const timestamp = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}_${now.getDate()}-${mesAno}`;
        const logMessage = `[${timestamp}] ${message}\n`;
        const logDir = path.join(logsDir, `thumbnail-generator_${now.getDate()}-${mesAno}`);
        await fs.ensureDir(logDir);
        const logFilePath = path.join(logDir, `${scriptName}_${timestamp}.log`);
        await fs.appendFile(logFilePath, logMessage);
    } catch (error) {
        console.error('Error writing to log:', error);
    }
}

// Usage
const videoDirectory = path.join(DiretorioBase, 'Videos');
const thumbnailDirectory = path.join(DiretorioBase, 'Thumbnails');
generateThumbnails(videoDirectory, thumbnailDirectory);
