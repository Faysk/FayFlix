const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

const app = express();
const PORT = process.env.PORT || 443; // Alterado para porta 443

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

// Fixando o endereço do servidor
const serverAddress = 'https://apiserverfile.azurewebsites.net/';

// Iniciando o servidor na porta 443
app.listen(PORT, () => {
    console.log(`Server is running on ${serverAddress}:${PORT}`);
    // Log de teste
    writeToLog(`Server started successfully at ${serverAddress}:${PORT}`);
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