const { Plugin } = require('obsidian');

class MediaGalleryPlugin extends Plugin {
    async onload() {
        this.processor = this.registerMarkdownCodeBlockProcessor('gallery-pro', async (source, el, ctx) => {
            const lines = source.trim().split('\n');

            // Parse options
            let paths = [];
            let sortOrder = 'date-desc';

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('paths:')) {
                    const pathsStr = line.substring(6).trim();
                    paths = pathsStr.split(',').map(p => p.trim());
                } else if (line.startsWith('sort:')) {
                    sortOrder = line.substring(5).trim();
                } else if (line && !line.includes(':')) {
                    // Backward compatibility: treat first line without colon as path
                    paths = [line];
                }
            }

            // Default to current folder if no paths specified
            if (paths.length === 0) {
                paths = ['./'];
            }

            await this.createGallery(el, paths, sortOrder, ctx);
        });
    }

    onunload() {
        const styles = document.getElementById('media-gallery-styles');
        if (styles) styles.remove();

        const lightboxStyles = document.getElementById('media-lightbox-styles');
        if (lightboxStyles) lightboxStyles.remove();

        // Remove any open lightbox
        const lightbox = document.getElementById('media-lightbox-overlay');
        if (lightbox) lightbox.remove();
    }

    async createGallery(el, paths, sortOrder, ctx) {
        el.empty();

        let allMediaFiles = [];

        // Handle "./" to get all folders from root
        if (paths.length === 1 && paths[0] === './') {
            const rootFolder = this.app.vault.getRoot();
            allMediaFiles = this.getAllMediaFromRoot(rootFolder);
        } else {
            // Get media from specified paths
            for (const folderPath of paths) {
                const folder = this.app.vault.getAbstractFileByPath(folderPath);
                if (!folder) {
                    el.createEl('div', {
                        text: `Folder not found: ${folderPath}`,
                        cls: 'gallery-error'
                    });
                    continue;
                }

                if (folder.children !== undefined) {
                    const mediaFiles = this.getMediaFiles(folder);
                    allMediaFiles.push(...mediaFiles);
                }
            }
        }

        // Sort files
        allMediaFiles = this.sortFiles(allMediaFiles, sortOrder);

        if (allMediaFiles.length === 0) {
            el.createEl('div', {
                text: 'No media files found',
                cls: 'gallery-empty'
            });
            return;
        }

        // Create gallery container
        const galleryContainer = el.createEl('div', { cls: 'media-gallery-container' });

        // Create gallery grid
        const grid = galleryContainer.createEl('div', { cls: 'media-gallery-grid' });

        allMediaFiles.forEach((file, index) => {
            const item = grid.createEl('div', { cls: 'gallery-item' });
            const resourcePath = this.app.vault.getResourcePath(file);

            if (this.isImage(file.name)) {
                const img = item.createEl('img', {
                    attr: {
                        src: resourcePath,
                        alt: file.name
                    }
                });
                img.addEventListener('click', () => {
                    openMediaLightbox(this.app, allMediaFiles, index);
                });
            } else if (this.isVideo(file.name)) {
                const video = item.createEl('video', {
                    attr: {
                        src: resourcePath,
                        muted: true,
                        loop: true
                    }
                });
                video.addEventListener('click', () => {
                    openMediaLightbox(this.app, allMediaFiles, index);
                });
            }
        });

        // Add CSS
        this.addStyles();
    }

    getAllMediaFromRoot(folder) {
        const mediaFiles = [];

        const traverse = (currentFolder) => {
            if (!currentFolder.children) return;

            for (const child of currentFolder.children) {
                if (child.children !== undefined) {
                    // It's a folder, recurse into it
                    traverse(child);
                } else {
                    // It's a file, check if it's media
                    const ext = child.extension.toLowerCase();
                    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.mp4', '.webm', '.ogv', '.mov'];
                    if (extensions.some(e => e === '.' + ext)) {
                        mediaFiles.push(child);
                    }
                }
            }
        };

        traverse(folder);
        return mediaFiles;
    }

    sortFiles(files, sortOrder) {
        switch (sortOrder) {
            case 'date-asc':
                return files.sort((a, b) => a.stat.mtime - b.stat.mtime);
            case 'date-desc':
                return files.sort((a, b) => b.stat.mtime - a.stat.mtime);
            case 'random':
                return this.shuffleArray([...files]);
            case 'name-asc':
            default:
                return files.sort((a, b) => a.name.localeCompare(b.name));
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getMediaFiles(folder) {
        const mediaFiles = [];
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.mp4', '.webm', '.ogv', '.mov'];

        for (const child of folder.children) {
            if (child.children === undefined) {
                const ext = child.extension.toLowerCase();
                if (extensions.some(e => e === '.' + ext)) {
                    mediaFiles.push(child);
                }
            }
        }

        return mediaFiles;
    }

    isImage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
    }

    isVideo(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['mp4', 'webm', 'ogv', 'mov'].includes(ext);
    }

    addStyles() {
        if (document.getElementById('media-gallery-styles')) return;

        const style = document.createElement('style');
        style.id = 'media-gallery-styles';
        style.textContent = `
            .media-gallery-container {
                width: 100%;
                padding: 10px;
            }
            
            .media-gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .gallery-item {
                aspect-ratio: 1;
                overflow: hidden;
                border-radius: 8px;
                cursor: pointer;
                background: var(--background-secondary);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .gallery-item:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .gallery-item img,
            .gallery-item video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .gallery-error,
            .gallery-empty {
                padding: 20px;
                text-align: center;
                color: var(--text-muted);
            }
        `;
        document.head.appendChild(style);
    }
}

// Custom lightbox implementation (not using Obsidian Modal)
function openMediaLightbox(app, mediaFiles, startIndex) {
    // Remove any existing lightbox
    const existing = document.getElementById('media-lightbox-overlay');
    if (existing) existing.remove();

    const state = {
        currentIndex: startIndex,
        randomMode: false,
        mediaFiles: mediaFiles,
        app: app,
        slideshowInterval: null,
        slideshowActive: false
    };

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'media-lightbox-overlay';

    // Top bar
    const topBar = document.createElement('div');
    topBar.className = 'lightbox-topbar';

    const leftControls = document.createElement('div');
    leftControls.className = 'lightbox-controls-left';

    const randomBtn = document.createElement('button');
    randomBtn.className = 'lightbox-random-btn';
    randomBtn.textContent = '🎲 Random';
    randomBtn.addEventListener('click', () => toggleRandom(state, randomBtn));

    const slideshowContainer = document.createElement('div');
    slideshowContainer.className = 'lightbox-slideshow-container';

    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.className = 'lightbox-interval-input';
    intervalInput.value = '3';
    intervalInput.min = '1';
    intervalInput.max = '60';
    intervalInput.placeholder = 'sec';

    const slideshowBtn = document.createElement('button');
    slideshowBtn.className = 'lightbox-slideshow-btn';
    slideshowBtn.textContent = '▶ Slideshow';
    slideshowBtn.addEventListener('click', () => toggleSlideshow(state, slideshowBtn, intervalInput));

    slideshowContainer.appendChild(intervalInput);
    slideshowContainer.appendChild(slideshowBtn);

    leftControls.appendChild(randomBtn);
    leftControls.appendChild(slideshowContainer);

    const rightControls = document.createElement('div');
    rightControls.className = 'lightbox-controls-right';

    const fileLink = document.createElement('a');
    fileLink.className = 'lightbox-file-link';
    fileLink.textContent = mediaFiles[startIndex].name;
    fileLink.href = '#';
    fileLink.addEventListener('click', (e) => {
        e.preventDefault();
        openFileInExplorer(app, state);
    });

    const infoDiv = document.createElement('div');
    infoDiv.className = 'lightbox-close-box';
    infoDiv.addEventListener('click', () => closeLightbox(state));
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => closeLightbox(state));

    rightControls.appendChild(fileLink);
    infoDiv.appendChild(closeBtn);
    rightControls.appendChild(infoDiv);

    topBar.appendChild(leftControls);
    topBar.appendChild(rightControls);

    // Main area
    const mainArea = document.createElement('div');
    mainArea.className = 'lightbox-main';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-nav lightbox-prev';
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', () => navigate(state, -1));

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'lightbox-media-container';
    mediaContainer.id = 'lightbox-media-container';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-nav lightbox-next';
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', () => navigate(state, 1));

    mainArea.appendChild(prevBtn);
    mainArea.appendChild(mediaContainer);
    mainArea.appendChild(nextBtn);

    // Thumbnails
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'lightbox-thumbnails';
    thumbContainer.id = 'lightbox-thumbnails';

    mediaFiles.forEach((file, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'lightbox-thumb';
        thumb.dataset.index = index;

        const resourcePath = app.vault.getResourcePath(file);

        if (isImage(file.name)) {
            const img = document.createElement('img');
            img.src = resourcePath;
            img.alt = file.name;
            thumb.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = resourcePath;
            video.muted = true;
            video.loop = true;
            thumb.appendChild(video);
        }

        thumb.addEventListener('click', () => {
            state.currentIndex = index;
            state.randomMode = false;
            updateRandomButton(state, randomBtn);
            updateMedia(state, fileLink);
        });

        thumbContainer.appendChild(thumb);
    });

    overlay.appendChild(topBar);
    overlay.appendChild(mainArea);
    overlay.appendChild(thumbContainer);
    document.body.appendChild(overlay);

    // Add styles
    addLightboxStyles();

    // Store references for cleanup
    state.randomBtn = randomBtn;
    state.slideshowBtn = slideshowBtn;
    state.fileLink = fileLink;
    state.intervalInput = intervalInput;

    // Update initial media
    updateMedia(state, fileLink);

    // Event listeners
    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft') navigate(state, -1);
        if (e.key === 'ArrowRight') navigate(state, 1);
        if (e.key === 'Escape') closeLightbox(state);
    };
    document.addEventListener('keydown', keyHandler);

    const wheelHandler = (e) => {
        if (document.querySelector('img:hover')) return; // Avoid conflict with image zoom/pan
        e.preventDefault();
        if (e.deltaY > 0) {
            navigate(state, 1);
        } else if (e.deltaY < 0) {
            navigate(state, -1);
        }
    };
    mainArea.addEventListener('wheel', wheelHandler, { passive: false });

    // Store cleanup function
    overlay.dataset.cleanup = 'true';
    overlay.addEventListener('cleanup', () => {
        document.removeEventListener('keydown', keyHandler);
        mainArea.removeEventListener('wheel', wheelHandler);
        if (state.slideshowInterval) {
            clearInterval(state.slideshowInterval);
        }
    });
}

function closeLightbox(state) {
    if (state && state.slideshowInterval) {
        clearInterval(state.slideshowInterval);
    }
    const overlay = document.getElementById('media-lightbox-overlay');
    if (overlay) {
        overlay.dispatchEvent(new Event('cleanup'));
        overlay.remove();
    }
}

function toggleSlideshow(state, slideshowBtn, intervalInput) {
    if (state.slideshowActive) {
        // Stop slideshow
        clearInterval(state.slideshowInterval);
        state.slideshowInterval = null;
        state.slideshowActive = false;
        slideshowBtn.textContent = '▶ Slideshow';
        slideshowBtn.classList.remove('active');
        intervalInput.disabled = false;
    } else {
        // Start slideshow
        const interval = parseInt(intervalInput.value) || 3;
        state.slideshowActive = true;
        slideshowBtn.textContent = '⏸ Stop';
        slideshowBtn.classList.add('active');
        intervalInput.disabled = true;

        state.slideshowInterval = setInterval(() => {
            navigate(state, 1);
        }, interval * 1000);
    }
}

function openFileInExplorer(app, state) {
    const file = state.mediaFiles[state.currentIndex];
    if (file) {
        // Use Obsidian's API to reveal file in system explorer
        app.showInFolder(file.path);
    }
}

function toggleRandom(state, randomBtn) {
    state.randomMode = !state.randomMode;
    updateRandomButton(state, randomBtn);
}

function updateRandomButton(state, randomBtn) {
    if (state.randomMode) {
        randomBtn.classList.add('active');
        randomBtn.textContent = '🎲 Random (ON)';
    } else {
        randomBtn.classList.remove('active');
        randomBtn.textContent = '🎲 Random';
    }
}

function getRandomIndex(state) {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * state.mediaFiles.length);
    } while (newIndex === state.currentIndex && state.mediaFiles.length > 1);
    return newIndex;
}

function navigate(state, direction) {
    if (state.randomMode) {
        state.currentIndex = getRandomIndex(state);
    } else {
        state.currentIndex = (state.currentIndex + direction + state.mediaFiles.length) % state.mediaFiles.length;
    }
    updateMedia(state, state.fileLink);
}

function updateMedia(state, fileLink) {
    const container = document.getElementById('lightbox-media-container');
    if (!container) return;
    container.innerHTML = '';

    const file = state.mediaFiles[state.currentIndex];
    const resourcePath = state.app.vault.getResourcePath(file);

    if (fileLink) {
        fileLink.textContent = file.name;
    }

    if (isImage(file.name)) {
        const img = document.createElement('img');
        img.src = resourcePath;
        img.alt = file.name;

        // Initialize zoom and pan state
        let zoomLevel = 1;
        let panX = 0;
        let panY = 0;

        // Apply transform
        const updateTransform = () => {
            img.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
            img.style.cursor = zoomLevel > 1 ? 'move' : 'zoom-in';
        };

        // Left click to zoom in
        img.addEventListener('click', (e) => {
            e.preventDefault();
            zoomLevel += 1;
            updateTransform();
        });

        // Right click to zoom out
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            zoomLevel = Math.max(1, zoomLevel - 1);
            if (zoomLevel === 1) {
                panX = 0;
                panY = 0;
            }
            updateTransform();
        });

        const wheelHandler = (e) => {
            if (!document.querySelector('img:hover')) return; // Avoid conflict with image zoom/pan
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomLevel += 1;
                updateTransform();
            } else if (e.deltaY > 0) {
                zoomLevel = Math.max(1, zoomLevel - 1);
                if (zoomLevel === 1) {
                    panX = 0;
                    panY = 0;
                }
                updateTransform();
            }
        };
        img.addEventListener('wheel', wheelHandler, { passive: false });

        // Mouse move to pan when zoomed
        img.addEventListener('mousemove', (e) => {
            if (zoomLevel > 1) {
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Get actual image dimensions
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;

                // Get displayed dimensions (considering max-width/max-height from CSS)
                const displayWidth = img.offsetWidth;
                const displayHeight = img.offsetHeight;

                // Calculate scaled dimensions
                const scaledWidth = displayWidth * zoomLevel;
                const scaledHeight = displayHeight * zoomLevel;

                // Calculate maximum pan (half of the overflow on each side)
                const maxPanX = Math.max(0, (scaledWidth - displayWidth) / 2);
                const maxPanY = Math.max(0, (scaledHeight - displayHeight) / 2);

                // Calculate pan based on mouse position relative to center
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Normalize mouse position (-1 to 1)
                const normalizedX = (mouseX - centerX) / centerX;
                const normalizedY = (mouseY - centerY) / centerY;

                // Apply damping factor to slow down pan at higher zoom levels
                const dampingFactor = 1 / zoomLevel;

                // Apply inverted pan with boundaries and damping
                panX = -normalizedX * maxPanX * dampingFactor;
                panY = -normalizedY * maxPanY * dampingFactor;

                updateTransform();
            }
        });



        // Reset on mouse leave
        // img.addEventListener('mouseleave', () => {
        //     if (zoomLevel > 1) {
        //         panX = 0;
        //         panY = 0;
        //         updateTransform();
        //     }
        // });

        img.style.transition = 'transform 0.1s ease-out';
        container.appendChild(img);

    } else if (isVideo(file.name)) {
        const video = document.createElement('video');
        video.src = resourcePath;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        container.appendChild(video);
    }

    // Update active thumbnail
    const thumbs = document.querySelectorAll('.lightbox-thumb');
    thumbs.forEach((thumb, index) => {
        if (index === state.currentIndex) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
}


function isImage(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext);
}

function isVideo(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogv', 'mov'].includes(ext);
}

function addLightboxStyles() {
    if (document.getElementById('media-lightbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'media-lightbox-styles';
    style.textContent = `
        #media-lightbox-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--background-primary);
            z-index: 9999;
            display: flex;
            flex-direction: column;
        }
        
        .lightbox-topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: var(--background-secondary);
            border-bottom: 1px solid var(--background-modifier-border);
            z-index: 10000;
            gap: 15px;
        }
        
        .lightbox-controls-left,
        .lightbox-controls-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .lightbox-slideshow-container {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .lightbox-interval-input {
            width: 60px;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid var(--background-modifier-border);
            background: var(--background-primary);
            color: var(--text-normal);
            font-size: 14px;
        }
        
        .lightbox-interval-input:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .lightbox-random-btn,
        .lightbox-slideshow-btn,
        .lightbox-close-btn {
            background: var(--interactive-normal);
            color: var(--text-normal);
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
            white-space: nowrap;
        }
        .lightbox-close-box {
            height: 40px;
            transform: translate(20px, -15px);
            cursor: pointer;
            padding: 14px 14px 0px 0px;
        }
        .lightbox-random-btn:hover,
        .lightbox-slideshow-btn:hover,
        .lightbox-close-btn:hover,
        .lightbox-close-box:hover .lightbox-close-btn {
            background: var(--interactive-hover);
        }
        
        .lightbox-random-btn.active,
        .lightbox-slideshow-btn.active {
            background: var(--interactive-accent);
            color: white;
        }
        
        .lightbox-file-link {
            color: var(--text-normal);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            background: var(--interactive-normal);
            transition: background 0.2s;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .lightbox-file-link:hover {
            background: var(--interactive-hover);
            text-decoration: underline;
        }
        
        .lightbox-close-btn {
            font-size: 20px;
            width: 40px;
            height: 40px;
            padding: 0;
        }
        
        .lightbox-main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: var(--background-primary);
            overflow: hidden;
        }
        
        .lightbox-media-container {
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .lightbox-media-container img,
        .lightbox-media-container video {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
        }
        .lightbox-media-container img {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            transform-origin: center center;
            user-select: none;
        }
        .lightbox-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            font-size: 48px;
            width: 60px;
            height: 60px;
            cursor: pointer;
            border-radius: 50%;
            transition: background 0.2s;
            z-index: 10;
        }
        
        .lightbox-nav:hover {
            background: rgba(0, 0, 0, 0.8);
        }
        
        .lightbox-prev {
            left: 20px;
        }
        
        .lightbox-next {
            right: 20px;
        }
        
        .lightbox-thumbnails {
            display: flex;
            gap: 10px;
            padding: 15px;
            overflow-x: auto;
            background: var(--background-secondary);
            max-height: 110px;
            border-top: 1px solid var(--background-modifier-border);
        }
        
        .lightbox-thumb {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            cursor: pointer;
            border-radius: 4px;
            overflow: hidden;
            border: 2px solid transparent;
            transition: border-color 0.2s, transform 0.2s;
        }
        
        .lightbox-thumb:hover {
            transform: scale(1.1);
        }
        
        .lightbox-thumb.active {
            border-color: var(--interactive-accent);
        }
        
        .lightbox-thumb img,
        .lightbox-thumb video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `;
    document.head.appendChild(style);
}

module.exports = MediaGalleryPlugin;