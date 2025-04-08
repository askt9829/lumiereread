const pageContainer = document.getElementById("page-container");
const chapterLinks = document.querySelectorAll("#chapter-list a");
const frameSize = document.getElementById("frame-size");
const autoScrollBtn = document.getElementById("auto-scroll");
const scrollSpeed = document.getElementById("scroll-speed");
const soundToggle = document.getElementById("sound-toggle");
const toStartBtn = document.getElementById("to-start");
const toEndBtn = document.getElementById("to-end");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const pageFlipSound = document.getElementById("page-flip-sound");
const clickSound = document.getElementById("click-sound");
const burgerBtn = document.getElementById("burger-btn");
const settingsBtn = document.getElementById("settings-btn");
const sidebar = document.getElementById("sidebar");
const settingsPanel = document.getElementById("settings-panel");
const overlay = document.getElementById("overlay");
const toTopBtn = document.getElementById("to-top-btn");
const iconContainer = document.querySelector(".icon-container");

let currentChapter = "chapter1";
let totalPages = null;
let autoScrollActive = false;
let soundsEnabled = true;
let scrollSpeedValue = 1;
let targetScrollSpeed = 1;
let pages = [];
let isInterfaceHidden = false;

async function loadChapter(chapter) {
    pageContainer.innerHTML = "";
    try {
        const chapterFileName = chapter.charAt(0).toUpperCase() + chapter.slice(1);
        const response = await fetch(`assets/chapters_data/${chapterFileName}.json`);
        if (!response.ok) {
            throw new Error("JSON-файл не найден");
        }
        const pageUrls = await response.json();
        totalPages = pageUrls.length;
        pages = pageUrls.map((url, index) => ({ url, index }));
        loadVerticalMode(pageUrls);
        updateChapterHighlight();
    } catch (error) {
        console.error(error);
        pageContainer.innerHTML = "<p>Ошибка загрузки главы. Проверьте JSON-файл!</p>";
    }
}

function loadVerticalMode(pageUrls) {
    pageContainer.innerHTML = "";
    pageUrls.forEach((url, index) => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Страница ${index + 1}`;
        img.loading = "lazy";
        img.onerror = () => {
            img.src = "assets/fallback-image.jpg";
            img.alt = "Изображение не загрузилось";
        };
        applyFrameSize(img);
        pageContainer.appendChild(img);
    });

    const endMessage = document.createElement("div");
    endMessage.classList.add("end-message");
    endMessage.innerHTML = `
        <p>Спасибо за то, что прочитали эту главу</p>
        <div class="chapter-nav">
            <button id="prev-chapter">Прошлая глава</button>
            <button id="next-chapter">Следующая глава</button>
        </div>
    `;
    pageContainer.appendChild(endMessage);

    const prevChapterBtn = document.getElementById("prev-chapter");
    const nextChapterBtn = document.getElementById("next-chapter");

    const chapters = Array.from(chapterLinks).map(link => link.dataset.chapter);
    const currentIndex = chapters.indexOf(currentChapter);

    prevChapterBtn.disabled = currentIndex === 0;
    nextChapterBtn.disabled = currentIndex === chapters.length - 1;

    prevChapterBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentChapter = chapters[currentIndex - 1];
            loadChapter(currentChapter);
            window.location.hash = currentChapter;
            if (soundsEnabled) playClickSound();
        }
    });

    nextChapterBtn.addEventListener("click", () => {
        if (currentIndex < chapters.length - 1) {
            currentChapter = chapters[currentIndex + 1];
            loadChapter(currentChapter);
            window.location.hash = currentChapter;
            if (soundsEnabled) playClickSound();
        }
    });

    updateProgressVertical();

    // Добавляем обработчик клика на изображения
    const images = pageContainer.querySelectorAll("img");
    images.forEach(img => {
        img.addEventListener("click", toggleInterface);
    });
}

function applyFrameSize(img) {
    const size = frameSize.value;
    if (size === "auto") {
        img.style.maxWidth = "90%";
        img.style.width = "auto";
        img.style.height = "auto";
    } else if (size === "full") {
        img.style.maxWidth = "100%";
        img.style.width = "100%";
        img.style.height = "auto";
    } else if (size === "compact") {
        img.style.maxWidth = "60%";
        img.style.width = "auto";
        img.style.height = "auto";
    }
}

function updateProgressVertical() {
    const scrollTop = pageContainer.scrollTop;
    const scrollHeight = pageContainer.scrollHeight - pageContainer.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Прокручено: ${Math.round(progress)}%`;
    toTopBtn.classList.toggle("visible", scrollTop > 300);
}

function updateChapterHighlight() {
    chapterLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.chapter === currentChapter) {
            link.classList.add("active");
        }
    });
}

function animateScrollSpeed() {
    const diff = targetScrollSpeed - scrollSpeedValue;
    if (Math.abs(diff) > 0.1) {
        scrollSpeedValue += diff * 0.1;
        requestAnimationFrame(animateScrollSpeed);
    } else {
        scrollSpeedValue = targetScrollSpeed;
    }
}

function playClickSound() {
    clickSound.currentTime = 0; // Сбрасываем время, чтобы звук воспроизводился без задержки
    clickSound.play().catch(error => {
        console.error("Ошибка воспроизведения звука:", error);
    });
}

function toggleInterface() {
    isInterfaceHidden = !isInterfaceHidden;
    if (isInterfaceHidden) {
        iconContainer.classList.add("hidden");
        sidebar.classList.remove("open");
        settingsPanel.classList.remove("open");
        overlay.classList.remove("active");
    } else {
        iconContainer.classList.remove("hidden");
    }
}

chapterLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        currentChapter = link.dataset.chapter;
        loadChapter(currentChapter);
        window.location.hash = currentChapter;
        if (soundsEnabled) playClickSound();
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });
});

frameSize.addEventListener("change", () => {
    const images = pageContainer.querySelectorAll("img");
    images.forEach(img => applyFrameSize(img));
});

autoScrollBtn.addEventListener("click", () => {
    if (autoScrollActive) {
        autoScrollActive = false;
        autoScrollBtn.textContent = "Вкл/Выкл";
    } else {
        autoScrollActive = true;
        autoScrollBtn.textContent = "Остановить";
        smoothScroll();
    }
});

scrollSpeed.addEventListener("input", () => {
    targetScrollSpeed = parseInt(scrollSpeed.value);
    animateScrollSpeed();
});

function smoothScroll() {
    if (!autoScrollActive) return;
    pageContainer.scrollTop += scrollSpeedValue;
    updateProgressVertical();
    if (pageContainer.scrollTop + pageContainer.clientHeight < pageContainer.scrollHeight) {
        requestAnimationFrame(smoothScroll);
    } else {
        autoScrollActive = false;
        autoScrollBtn.textContent = "Вкл/Выкл";
    }
}

soundToggle.addEventListener("click", () => {
    soundsEnabled = !soundsEnabled;
    soundToggle.textContent = soundsEnabled ? "Включены" : "Выключены";
});

toStartBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
});

toEndBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: pageContainer.scrollHeight, behavior: "smooth" });
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    settingsPanel.classList.remove("open");
    overlay.classList.toggle("active");
});

settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
    sidebar.classList.remove("open");
    overlay.classList.toggle("active");
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    settingsPanel.classList.remove("open");
    overlay.classList.remove("active");
});

progressBar.addEventListener("click", () => {
    progressBar.classList.toggle("hidden");
});

toTopBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("load", () => {
    const hash = window.location.hash.slice(1) || "chapter1";
    currentChapter = hash;
    loadChapter(currentChapter);
});

pageContainer.addEventListener("scroll", () => {
    updateProgressVertical();
});
