let startX = 0;
let startY = 0;
let videos;
let currentVideoIndex = 0;

window.onload = function() {
    loadVideos();
};

async function loadVideos() {
    const response = await fetch('http://192.168.3.211:3001/videos');
    videos = await response.json();
    const videoContainer = document.getElementById('video-container');

    videos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');

        const thumbnail = document.createElement('img');
        thumbnail.classList.add('video-thumbnail');
        thumbnail.src = video.thumbnail; // Use o link absoluto fornecido pelo Blob Storage para a miniatura
        thumbnail.alt = video.name;

        const videoPath = video.path; // Use o link absoluto fornecido pelo Blob Storage para o vídeo

        thumbnail.addEventListener('click', () => {
            openVideoPopup(videoPath);
        });

        thumbnail.addEventListener('mouseover', () => {
            thumbnail.src = video.gif; // Use o link absoluto fornecido pelo Blob Storage para o GIF
        });

        thumbnail.addEventListener('mouseout', () => {
            thumbnail.src = video.thumbnail; // Volte para a miniatura quando o mouse sair
        });

        const videoInfo = document.createElement('div');
        videoInfo.classList.add('video-info');

        const title = document.createElement('h2');
        title.classList.add('video-title');
        title.textContent = video.name;

        const description = document.createElement('p');
        description.classList.add('video-description');
        description.textContent = video.description;

        videoInfo.appendChild(title);
        videoInfo.appendChild(description);

        videoItem.appendChild(thumbnail);
        videoItem.appendChild(videoInfo);

        videoContainer.appendChild(videoItem);
    });
}

function openVideoPopup(videoUrl) {
    const videoOverlay = document.createElement('div');
    videoOverlay.classList.add('video-overlay');

    const videoPopup = document.createElement('div');
    videoPopup.classList.add('video-popup');

    const videoElement = document.createElement('video');
    videoElement.classList.add('popup-video');
    videoElement.controls = true;
    videoElement.autoplay = true; 
    videoElement.src = videoUrl;

    const videoName = document.createElement('h2'); // Novo elemento para mostrar o nome do vídeo
    videoName.classList.add('video-name');
    videoName.textContent = getVideoName(videoUrl); // Define o texto com o nome do vídeo

    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');
    closeBtn.textContent = 'X';

    closeBtn.addEventListener('click', function() {
        videoOverlay.remove();
    });

    function openNextVideo() {
        if (currentVideoIndex < videos.length - 1) {
            currentVideoIndex++;
            const nextVideoUrl = videos[currentVideoIndex].path;
            videoElement.src = nextVideoUrl;
            videoName.textContent = getVideoName(nextVideoUrl); // Atualiza o nome do vídeo exibido
        }
    }

    function openPreviousVideo() {
        if (currentVideoIndex > 0) {
            currentVideoIndex--;
            const previousVideoUrl = videos[currentVideoIndex].path;
            videoElement.src = previousVideoUrl;
            videoName.textContent = getVideoName(previousVideoUrl); // Atualiza o nome do vídeo exibido
        }
    }

    videoPopup.appendChild(videoElement);
    videoPopup.appendChild(videoName); // Adiciona o elemento com o nome do vídeo
    videoPopup.appendChild(closeBtn);

    videoOverlay.appendChild(videoPopup);

    document.body.appendChild(videoOverlay);

    // Adiciona eventos de clique na região do overlay
    videoOverlay.addEventListener('click', function(event) {
        const rect = videoOverlay.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;

        // Verifica em qual área do overlay o clique ocorreu e decide o que fazer
        if (x < width * 0.25) {
            openPreviousVideo();
            // Adiciona classe de feedback ao video-popup indicando movimento para a esquerda
            videoPopup.classList.add('click-feedback-left');
        } else if (x > width * 0.75) {
            openNextVideo();
            // Adiciona classe de feedback ao video-popup indicando movimento para a direita
            videoPopup.classList.add('click-feedback-right');
        }

        // Remove a classe após um curto intervalo de tempo
        setTimeout(() => {
            videoPopup.classList.remove('click-feedback-left', 'click-feedback-right');
        }, 300); // Tempo de duração da animação em milissegundos
    });
}

// Função para obter o nome do vídeo a partir da URL
function getVideoName(videoUrl) {
    const videoId = videoUrl.split('/').pop(); // Obtém o ID do vídeo da URL
    const video = videos.find(video => video.path.includes(videoId)); // Procura o vídeo pelo ID
    return video ? video.name : 'Unknown'; // Retorna o nome do vídeo se encontrado, senão retorna 'Unknown'
}


function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    const toggleBtn = document.getElementById('dark-mode-toggle');
    toggleBtn.classList.toggle('dark-mode');
}
