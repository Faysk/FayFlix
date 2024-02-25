const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

// Define o diretório base
const DiretorioBase = 'E:/BT/Blob';
const scriptName = path.basename(__filename, '.js');
const logsDir = path.join(DiretorioBase, 'Logs');

// Função para executar um script e retornar uma Promise
function executeScript(scriptName) {
    return new Promise((resolve, reject) => {
        const command = `node ${scriptName}.js`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error executing ${scriptName}: ${error}`);
                return;
            }
            // Se houver saída padrão, inclua no resolve
            if (stdout) {
                resolve(stdout);
                return;
            }
            // Se houver erro padrão, inclua no reject
            if (stderr) {
                reject(`Error executing ${scriptName}: ${stderr}`);
                return;
            }
            resolve(`${scriptName} executed successfully.`);
        });
    });
}

// Função para escrever logs
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

// Função principal assíncrona para executar os scripts em sequência
async function runScripts() {
    try {
        await writeToLog('Starting execution of scripts.');

        console.log(await executeScript('thumbnail-generator'));
        await writeToLog('Thumbnail generator executed successfully.');

        console.log(await executeScript('gif-generator'));
        await writeToLog('GIF generator executed successfully.');

        console.log(await executeScript('file-server'));
        await writeToLog('File server executed successfully.');

        await writeToLog('All scripts executed successfully.');
    } catch (error) {
        console.error(error);
        await writeToLog(`Error during script execution: ${error}`);
    }
}

// Executa os scripts em sequência
runScripts();
