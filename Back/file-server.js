const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

const app = express();
const PORT = process.env.PORT || 3001;

const scriptName = path.basename(__filename, '.js');
const logsDir = 'logs'; // Alterado para usar diretamente

// Use o middleware cors
app.use(cors());

// Configuração de conexão do Azure Blob Storage
const STORAGE_ACCOUNT_NAME = 'storagefayflix';
const ACCOUNT_KEY = 'qcaWdF91e3ggHLN5vhJUVZuK+gsvN5/5Dd+jrlssPvEKQ9lkus3bTeQ6B5/h0gsbIzTgJxuE7wWM+ASthguHEg==';
const CONTAINER_NAME_VIDEOS = "videos";
const CONTAINER_NAME_GIFS = "gifs";
const CONTAINER_NAME_THUMBNAILS = "thumbnails";
const CONTAINER_NAME_LOGS = "logs";

const blobServiceClient = new BlobServiceClient(
    `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    new StorageSharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_KEY)
);

// Rota para obter os vídeos
app.get('/videos', async (req, res) => {
    try {
        const videos = await getVideosData();
        res.json(videos);
        // Log de teste
        writeToLog('Videos requested successfully.');
    } catch (error) {
        writeToLog(`Error fetching videos: ${error}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Função para obter os dados dos vídeos (nome, thumbnail, caminho do vídeo)
async function getVideosData() {
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME_VIDEOS);

    const videos = [];

    // Listar blobs no contêiner
    for await (const blob of containerClient.listBlobsFlat()) {
        // Ajustar a URL do Blob conforme necessário
        const videoName = path.parse(blob.name).name;
        const videoPath = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME_VIDEOS}/${blob.name}`;
        const thumbnailPath = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME_THUMBNAILS}/${videoName}.png`;
        const gifPath = `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${CONTAINER_NAME_GIFS}/${videoName}.gif`;

        videos.push({
            name: videoName,
            thumbnail: thumbnailPath,
            gif: gifPath,
            path: videoPath
        });
    }

    return videos;
}

// Função para encontrar o endereço IP da interface de rede desejada
function getLocalIPAddress() {
    const ifaces = os.networkInterfaces();
    for (const iface in ifaces) {
        for (const details of ifaces[iface]) {
            if (details.family === 'IPv4' && !details.internal) {
                return details.address;
            }
        }
    }
    return '127.0.0.1'; // Retorna localhost se nenhum IP externo for encontrado
}

// Use o endereço IP da rede local como IP para escutar
const localIPAddress = getLocalIPAddress();
app.listen(PORT, localIPAddress, () => {
    console.log(`Server is running on http://${localIPAddress}:${PORT}`);
    // Log de teste
    writeToLog(`Server started successfully at http://${localIPAddress}:${PORT}`);
});

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
