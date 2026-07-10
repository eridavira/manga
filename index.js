import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 1. Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBOzNyBoQzolKF6p1O-ijlGWWF1Tu3iGxE",
    authDomain: "anon-chat-eri.firebaseapp.com",
    databaseURL: "https://anon-chat-eri-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "anon-chat-eri",
    storageBucket: "anon-chat-eri.firebasestorage.app",
    messagingSenderId: "770226352457",
    appId: "1:770226352457:web:43d01526df75e5e49cea98",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 2. Elemen DOM
const galleryDiv = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const tagContainer = document.getElementById('tagContainer');
const tagList = document.getElementById('tagList');
const tagSidePanel = document.getElementById('tagSidePanel');
const tagDrawerBtn = document.getElementById('tagDrawerBtn');
const showAllTagsBtn = document.getElementById('showAllTagsBtn');
const modalLoader = document.getElementById('modalLoader');
const modalCaption = document.getElementById('modalCaption');
const downloadBtn = document.getElementById('downloadBtn');
const directDownloadBtn = document.getElementById('directDownloadBtn');
const loadingIndicator = document.getElementById('loading');

let allItems = [];
let filteredItems = [];
let currentIndex = 0;
let currentPage = 1;
const itemsPerPage = 28;

// 3. Ambil Data dari Database
onValue(ref(db, 'cewek'), (snapshot) => {
    if (snapshot.exists()) {
        allItems = Object.values(snapshot.val()).reverse();
        filteredItems = [...allItems];
        renderGallery();
    }
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}, (error) => {
    if (loadingIndicator) loadingIndicator.innerText = "CONNECTION ERROR";
});

// 4. Render Gallery & Pagination
function renderGallery() {
    galleryDiv.innerHTML = "";
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filteredItems.slice(start, start + itemsPerPage);
    
    paginated.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <div class="thumb-box">
                <img src="${item.thumb || item.url}" loading="lazy">
            </div>
            <div class="title">${item.title}</div>
        `;
        div.onclick = () => {
            currentIndex = start + index;
            openModal();
        };
        galleryDiv.appendChild(div);
    });
    updatePaginationUI();
}

function updatePaginationUI() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    const containers = [document.getElementById('pageNumbersTop'), document.getElementById('pageNumbersBottom')];
    
    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.innerText = i.toString().padStart(2, '0');
            btn.className = `page-num-btn ${i === currentPage ? 'active' : ''}`;
            btn.onclick = () => {
                currentPage = i;
                renderGallery();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            container.appendChild(btn);
        }
    });
}

// 5. Logika Modal & Tagging
function openModal() {
    updateModalContent();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function updateModalContent() {
    modalLoader.style.display = "block";
    modalImg.style.display = "none";
    modalImg.classList.remove('image-transition'); // Reset animasi
    
    // Reset status tombol Show All
    showAllTagsBtn.classList.remove('active');
    showAllTagsBtn.innerText = "SHOW ALL TAGS";
    
    tagContainer.innerHTML = "";
    tagList.innerHTML = "";
    tagSidePanel.classList.remove('open');

    const item = filteredItems[currentIndex];
    if (!item) return;

    modalImg.src = item.thumb || item.url;
    modalImg.onload = () => {
        modalLoader.style.display = "none";
        modalImg.style.display = "block";
        modalImg.classList.add('image-transition'); // Jalankan animasi
        renderTags(item.tags);
    };

    modalCaption.innerText = item.title;
    downloadBtn.href = item.url;
    directDownloadBtn.setAttribute('data-url', item.url);
}

function renderTags(tags) {
    if (!tags || Object.keys(tags).length === 0) {
        tagDrawerBtn.style.display = "none";
        return;
    }
    tagDrawerBtn.style.display = "block";
    
    Object.entries(tags).forEach(([id, tag]) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'photo-tag';
        tagEl.style.left = tag.x + "%";
        tagEl.style.top = tag.y + "%";
        tagEl.innerHTML = `<div class="tag-label">${tag.name}</div>`;
        tagContainer.appendChild(tagEl);

        const listItem = document.createElement('div');
        listItem.className = 'tag-list-item';
        listItem.innerText = tag.name;
        listItem.onmouseenter = () => tagEl.classList.add('active-highlight');
        listItem.onmouseleave = () => tagEl.classList.remove('active-highlight');
        tagList.appendChild(listItem);
    });
}

// 6. Event Listeners
tagDrawerBtn.onclick = () => tagSidePanel.classList.toggle('open');

showAllTagsBtn.onclick = () => {
    const tags = document.querySelectorAll('.photo-tag');
    const isActive = showAllTagsBtn.classList.toggle('active');
    tags.forEach(t => isActive ? t.classList.add('force-show') : t.classList.remove('force-show'));
    showAllTagsBtn.innerText = isActive ? "HIDE ALL TAGS" : "SHOW ALL TAGS";
};

document.getElementById('closeModal').onclick = () => {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    modalImg.src = "";
};

const navigate = (step) => {
    currentIndex = (currentIndex + step + filteredItems.length) % filteredItems.length;
    updateModalContent();
};

document.getElementById('nextBtn').onclick = (e) => { e.stopPropagation(); navigate(1); };
document.getElementById('prevBtn').onclick = (e) => { e.stopPropagation(); navigate(-1); };

// Pencarian
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredItems = allItems.filter(item => item.title.toLowerCase().includes(term));
    currentPage = 1;
    renderGallery();
});

// Navigasi Halaman Utama
const goToPrev = () => { if (currentPage > 1) { currentPage--; renderGallery(); window.scrollTo({ top: 0 }); } };
const goToNext = () => { if (currentPage < Math.ceil(filteredItems.length / itemsPerPage)) { currentPage++; renderGallery(); window.scrollTo({ top: 0 }); } };
document.getElementById('prevPageTop').onclick = goToPrev;
document.getElementById('prevPageBottom').onclick = goToPrev;
document.getElementById('nextPageTop').onclick = goToNext;
document.getElementById('nextPageBottom').onclick = goToNext;

// Direct Download (Nama file asli)
directDownloadBtn.onclick = async () => {
    const url = directDownloadBtn.getAttribute('data-url');
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const fileName = url.split('/').pop().split('?')[0] || "image.jpg";
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (e) { alert("Download failed."); }
};

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('show')) return;
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'Escape') document.getElementById('closeModal').click();
});