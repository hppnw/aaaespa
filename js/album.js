// Helper to persist video (global)
async function saveUserVideo(video) {
  try {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video)
    });
    if (!res.ok) {
      console.warn('Failed to save video:', await res.text());
    }
  } catch (err) {
    console.error('Error saving video:', err);
  }
}

// Global variables
let officialMVs = [];
let mvIndex = 0;
let galleryVideos = [];
let galleryIndex = 0;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // --- Page Setup ---
  const getQueryParam = name => new URLSearchParams(window.location.search).get(name);
  const album = getQueryParam('album') || 'Savage';
  const basePath = `assets/albums/${album}/`;

  // 设置专辑封面作为背景
  const coverPath = `${basePath}cover.jpg`;
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="album-bg" style="
      position: fixed;
      inset: 0;
      background-image: url('${coverPath}');
      background-size: cover;
      background-position: center;
      filter: blur(30px) brightness(0.4);
      transform: scale(1.2);
      z-index: -1;
    "></div>
  `);

  // --- Element Selectors ---
  const elements = {

    albumTitle: document.getElementById('album-title'),
    albumIntro: document.getElementById('album-intro'),
    cdCover: document.getElementById('cd-cover'),
    mvCarousel: document.getElementById('mv-carousel'),
    posterCarousel: document.getElementById('poster-carousel'),
    posterInner: document.querySelector('.carousel-inner'),
    posterPrevBtn: document.querySelector('.carousel-nav .prev'),
    posterNextBtn: document.querySelector('.carousel-nav .next'),
    cdIntroOverlay: document.getElementById('cd-intro-overlay'),
    fullIntroTitle: document.getElementById('full-intro-title'),
    fullIntroText: document.getElementById('full-intro-text'),
    galleryOverlay: document.getElementById('gallery-overlay'),
    galleryGrid: document.querySelector('#gallery-overlay .gallery-grid'),
    galleryCloseBtn: document.getElementById('gallery-close-btn'),
    hamburgerBtn: document.getElementById('album-hamburger'),
    galleryBtn: document.getElementById('gallery-btn'),
    trackSidebar: document.getElementById('album-track-sidebar'),
    trackList: document.getElementById('album-track-list'),
    albumDescription: document.getElementById('album-description'),
  };

  // --- Poster Carousel Navigation ---
  let posterIndex = 0;
  const postersPerPage = 3;
  let photos = [];

  function renderPosterCarousel() {
    if (!elements.posterInner) return;
    
    // Clear current content
    elements.posterInner.innerHTML = '';
    
    // Render visible posters
    for (let i = posterIndex; i < Math.min(posterIndex + postersPerPage, photos.length); i++) {
      const div = document.createElement('div');
      div.className = 'carousel-item';
      div.style.backgroundImage = `url('${photos[i]}')`;
      // 添加点击事件
      div.addEventListener('click', () => {
        showPosterInGallery(photos[i]);
      });
      // 添加鼠标样式
      div.style.cursor = 'pointer';
      elements.posterInner.appendChild(div);
    }
  }

  function updatePosterNav() {
    if (!elements.posterInner) return;
    
    // Update navigation buttons
    if (elements.posterPrevBtn) {
      elements.posterPrevBtn.disabled = posterIndex === 0;
    }
    if (elements.posterNextBtn) {
      elements.posterNextBtn.disabled = posterIndex + postersPerPage >= photos.length;
    }
  }

  // Add event listeners for poster navigation
  if (elements.posterPrevBtn) {
    elements.posterPrevBtn.addEventListener('click', () => {
      if (posterIndex > 0) {
        posterIndex--;
        renderPosterCarousel();
        updatePosterNav();
      }
    });
  }

  if (elements.posterNextBtn) {
    elements.posterNextBtn.addEventListener('click', () => {
      if (posterIndex + postersPerPage < photos.length) {
        posterIndex++;
        renderPosterCarousel();
        updatePosterNav();
      }
    });
  }

  // --- Data Fetching & Rendering ---
  async function loadAlbumData() {
    // 1. 拉取当前用户收藏状态
    let favoriteList = [];
    try {
      const favRes = await fetch('/api/favorite');
      if (favRes.ok) {
        const favData = await favRes.json();
        if (favData.success && Array.isArray(favData.data)) {
          favoriteList = favData.data.filter(f=>f.fav_type==='track').map(f=>f.fav_id);
        }
      }
    } catch {}
    try {
      console.log('Loading album data from:', `${basePath}tracks.json`);
      const res = await fetch(`${basePath}tracks.json`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Album data loaded:', data);

      // Basic Info
      elements.albumTitle.textContent = data.title || album;
      elements.albumIntro.textContent = data.description_short || '';
      elements.cdCover.style.backgroundImage = `url(${basePath}cover.jpg)`;
      
      // Full Description
      if (data.description_full) {
        const paragraphs = data.description_full.split('\n').filter(para => para.trim());
        elements.albumDescription.innerHTML = paragraphs.map(para => 
          `<p>${para.trim()}</p>`
        ).join('');
      } else {
        elements.albumDescription.innerHTML = '<p>No detailed description available.</p>';
      }

      // Tracks
      if (Array.isArray(data.tracks)) {
        renderTracks(data.tracks, favoriteList);
      } else {
        console.error('Tracks data is not an array:', data.tracks);
      }

      // Load poster images
      try {
        // 尝试加载图片直到找不到为止
        const loadedPhotos = [];
        let photoIndex = 1;
        while (true) {
          try {
            const response = await fetch(`${basePath}photo${photoIndex}.jpg`);
            if (!response.ok) break;
            loadedPhotos.push(`${basePath}photo${photoIndex}.jpg`);
            photoIndex++;
          } catch {
            break;
          }
        }
        photos = loadedPhotos;
        if (photos.length > 0) {
          renderPosterCarousel();
          updatePosterNav();
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      }

    } catch (e) {
      console.error('Failed to load album info:', e);
      elements.albumTitle.textContent = 'Album not found';
      elements.albumIntro.textContent = 'Failed to load album information.';
      elements.albumDescription.innerHTML = '<p>Error loading album details.</p>';
    }

    // Load official MVs
    try {
      const officialRes = await fetch(`${basePath}official.json`);
      if (officialRes.ok) {
        const data = await officialRes.json();
        officialMVs = data || [];  // 直接使用数组
        if (officialMVs.length > 0) {
          const mvTitle = document.getElementById("mv-title");
          if (mvTitle) {
            mvTitle.innerHTML = `${officialMVs[0].title}<span class="mv-date">(${officialMVs[0].date})</span>`;
          }
          const mvIframe = document.getElementById("mv-iframe");
          if (mvIframe) {
            mvIframe.src = `https://player.bilibili.com/player.html?bvid=${officialMVs[0].bvid}&autoplay=1`;
          }
        }
      }
    } catch (error) {
      console.error('Error loading official MVs:', error);
    }

    // 加载二创区域内容
    try {
      console.log('Loading gallery from:', `${basePath}gallery.json`);
      const galleryRes = await fetch(`${basePath}gallery.json`);
      if (!galleryRes.ok) {
        throw new Error(`Failed to load gallery data`);
      }
      const galleryData = await galleryRes.json();
      console.log('Gallery data loaded:', galleryData);
      // 合并后端用户上传
    let userVideos = [];
    try {
      const userRes = await fetch('/api/gallery');
      if (userRes.ok) userVideos = await userRes.json();
    } catch {}
    const merged = Array.isArray(galleryData) ? [...galleryData, ...userVideos] : { items: [...(galleryData.items||[]), ...userVideos] };
    renderGalleryGrid(merged);
    } catch (e) { 
      console.error('Failed to load gallery:', e);
      // 如果加载失败，显示错误信息
      const galleryGrid = document.querySelector('#gallery-overlay .gallery-grid');
      if (galleryGrid) {
        galleryGrid.innerHTML = '<div style="color: #fff; text-align: center; padding: 20px;">暂无二创内容</div>';
      }
    }
  }

  function renderTracks(tracks, favoriteList = [], commentLikeMap = {}) {
    elements.trackList.innerHTML = '';
    tracks.forEach((track, i) => {
      const li = document.createElement('li');
      li.className = 'track-item';
      li.style.marginBottom = '18px';
      // 唯一标识
      const album = new URLSearchParams(window.location.search).get('album') || 'unknown';
      const trackId = `track_${album}_${track.title}`;
      // 判断收藏状态
      const isFav = favoriteList.includes(trackId);
      let html = `<div style="display:flex;align-items:center;gap:10px;">
        <span style="color:#fff;font-weight:bold;">${i + 1}. ${track.title}</span>
        <span style="color:#aaa;font-size:0.95em;">${track.length ? `(${track.length})` : ''}</span>
        <button class="track-fav-btn${isFav ? ' fav' : ''}" data-id="${trackId}" title="收藏" style="background:none;border:none;cursor:pointer;padding:0 4px;display:flex;align-items:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? '#ffb6e6' : 'none'}" stroke="#ffb6e6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </button>
      </div>`;
      if (track.audio) {
        html += `<div style="margin-top:8px;"><audio controls src="assets/albums/${album}/${track.audio}" style="width:100%;border-radius:16px;background:#fff;" preload="none"></audio></div>`;
      }
      li.innerHTML = html;
      elements.trackList.appendChild(li);
    });
    // 绑定收藏事件
    document.querySelectorAll('.track-fav-btn').forEach(btn => {
      btn.onclick = async function() {
        const id = btn.getAttribute('data-id');
        const fav = btn.classList.contains('fav');
        btn.disabled = true;
        if(fav){
          // 取消收藏，需查找收藏id
          let favId = null;
          try {
            const favRes = await fetch('/api/favorite');
            if(favRes.ok){
              const favData = await favRes.json();
              if(favData.success && Array.isArray(favData.data)){
                const found = favData.data.find(f=>f.fav_type==='track'&&f.fav_id===id);
                if(found) favId = found.id;
              }
            }
          } catch{}
          if(favId){
            const delRes = await fetch('/api/favorite/'+favId, {method:'DELETE'});
            const delData = await delRes.json();
            if(delData.success){
              btn.classList.remove('fav');
              const svg = btn.querySelector('svg');
              if(svg) svg.setAttribute('fill','none');
            }else{
              alert('取消收藏失败');
            }
          }
        }else{
          // 收藏
          const res = await fetch('/api/favorite', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fav_type:'track',fav_id:id})});
          const data = await res.json();
          if(data.success){
            btn.classList.add('fav');
            const svg = btn.querySelector('svg');
            if(svg) svg.setAttribute('fill','#ffb6e6');
          }else{
            alert(data.message||'收藏失败');
          }
        }
        btn.disabled = false;
      };
    });
  // 移除多余闭合
  }

  // --- Event Listeners ---
  if (elements.hamburgerBtn) {
    elements.hamburgerBtn.addEventListener('click', () => {
      elements.trackSidebar.classList.toggle('active');
    });
  }

  if (elements.trackSidebar && elements.trackSidebar.querySelector('.close-btn')) {
    elements.trackSidebar.querySelector('.close-btn').addEventListener('click', () => {
      elements.trackSidebar.classList.remove('active');
    });
  }

  if (elements.galleryBtn) {
    elements.galleryBtn.addEventListener('click', () => {
      elements.galleryOverlay.style.display = 'flex';
    });
  }

  if (elements.galleryOverlay && elements.galleryOverlay.querySelector('.close-btn')) {
    elements.galleryOverlay.querySelector('.close-btn').addEventListener('click', () => {
      elements.galleryOverlay.style.display = 'none';
    });
  }


  // ---- User Upload (Bilibili link) ----
  const uploadInput = document.getElementById('upload-input');
  const uploadBtn = document.getElementById('upload-btn');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => {
      const link = uploadInput.value.trim();
      if (!link) {
        alert('请输入链接');
        return;
      }

      // 解析BVID
      let newVideo = null;
      const todayStr = new Date().toISOString().split('T')[0];
      const bvidMatch = link.match(/BV[0-9A-Za-z]{10,}/);
      if (bvidMatch) {
        newVideo = {
          type: 'bilibili',
          bvid: bvidMatch[0],
          title: todayStr
        };
      } else {
        // 其他链接直接iframe
        newVideo = {
          type: 'iframe',
          url: link,
          title: todayStr
        };
      }

      galleryVideos.push(newVideo);
      galleryIndex = galleryVideos.length - 1;

      // 如果已渲染过gallery结构，直接更新；否则重绘
      if (document.getElementById('gallery-iframe')) {
        updateGalleryVideo();
      } else {
        renderGalleryGrid(galleryVideos);
      }

      uploadInput.value = '';
      saveUserVideo(newVideo);
    });
  }

  // 覆盖浏览器返回键逻辑，直接返回首页
  window.addEventListener('popstate', function (e) {
    window.location.href = 'index.html';
  });


  // --- Initialize ---
  loadAlbumData();
});

// MV rendering and navigation
function renderOfficialMV() {
  const mvTitle = document.getElementById("mv-title");
  const mvIframe = document.getElementById("mv-iframe");
  if (!officialMVs[mvIndex]) {
    mvTitle.textContent = "暂无官方MV";
    mvIframe.src = "";
    return;
  }
  const mv = officialMVs[mvIndex];
  let title = mv.title || "官方MV";
  if (mv.date) title += ` (${mv.date})`;
  else if (mv.desc) title += ` (${mv.desc})`;
  mvTitle.textContent = title;
  const embedUrl = mv.type === 'bilibili' && mv.bvid ? 
    `https://player.bilibili.com/player.html?bvid=${mv.bvid}&autoplay=1` : 
    (mv.url || '');
  console.log('Setting MV iframe src to:', embedUrl);
  mvIframe.src = embedUrl;
}

function updateMVNav() {
  const prevBtn = document.getElementById('mv-prev');
  const nextBtn = document.getElementById('mv-next');
  if (prevBtn) prevBtn.disabled = mvIndex === 0;
  if (nextBtn) nextBtn.disabled = mvIndex === officialMVs.length - 1;
}

function bindMVNavEvents() {
  const prevBtn = document.getElementById('mv-prev');
  const nextBtn = document.getElementById('mv-next');
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      if (mvIndex > 0) {
        mvIndex--;
        renderOfficialMV();
        updateMVNav();
      }
    };
    nextBtn.onclick = () => {
      if (mvIndex < officialMVs.length - 1) {
        mvIndex++;
        renderOfficialMV();
        updateMVNav();
      }
    };
  }
}

// MV Navigation
const mvPrev = document.getElementById('mv-prev');
const mvNext = document.getElementById('mv-next');

function updateMV(index) {
  const mv = officialMVs[index];
  if (!mv) return;

  const mvTitle = document.getElementById("mv-title");
  if (mvTitle) {
    mvTitle.innerHTML = `${mv.title}<span class="mv-date">(${mv.date})</span>`;
  }

  const mvIframe = document.getElementById("mv-iframe");
  if (mvIframe) {
    mvIframe.src = `https://player.bilibili.com/player.html?bvid=${mv.bvid}&autoplay=1`;
  }
}

if (mvPrev) {
  mvPrev.onclick = () => {
    if (mvIndex > 0) {
      mvIndex--;
      updateMV(mvIndex);
      mvPrev.disabled = mvIndex === 0;
      mvNext.disabled = mvIndex === officialMVs.length - 1;
    }
  };
}

if (mvNext) {
  mvNext.onclick = () => {
    if (mvIndex < officialMVs.length - 1) {
      mvIndex++;
      updateMV(mvIndex);
      mvPrev.disabled = mvIndex === 0;
      mvNext.disabled = mvIndex === officialMVs.length - 1;
    }
  };
}

// Poster carousel functionality
function renderPosterCarousel(albumPath) {
  const carouselInner = document.getElementById('poster-carousel-inner');
  if (!carouselInner) return;

  // 清空现有内容
  carouselInner.innerHTML = '';

  // 创建5张海报的轮播项
  for (let i = 1; i <= 5; i++) {
    const posterItem = document.createElement('div');
    posterItem.className = 'carousel-item';
    posterItem.style.backgroundImage = `url(${albumPath}photo${i}.jpg)`;
    carouselInner.appendChild(posterItem);
  }

  setupPosterCarousel();
}

function setupPosterCarousel() {
  const carousel = document.getElementById('poster-carousel');
  const inner = document.getElementById('poster-carousel-inner');
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');
  let currentIndex = 0;

  function updateCarousel() {
    const items = inner.children;
    const itemWidth = 100 / 3; // 显示3个项目
    inner.style.transform = `translateX(-${currentIndex * itemWidth}%)`;
    
    // 更新按钮状态
    if (prevBtn) prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
    if (nextBtn) nextBtn.style.display = currentIndex >= items.length - 3 ? 'none' : 'block';
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const items = inner.children;
      if (currentIndex < items.length - 3) {
        currentIndex++;
        updateCarousel();
      }
    };
  }

  updateCarousel();
}

// Gallery grid rendering
function renderGalleryGrid(gallery) {
  const galleryGrid = document.querySelector('#gallery-overlay .gallery-grid');
  if (!galleryGrid) return;

  // 清空现有内容
  galleryGrid.innerHTML = '';

  // 如果gallery是数组，直接使用；如果是对象，获取其items属性
  galleryVideos = Array.isArray(gallery) ? gallery : (gallery?.items || []);

  if (galleryVideos.length === 0) {
    galleryGrid.innerHTML = '<div style="color: #fff; text-align: center; padding: 20px;">暂无二创内容</div>';
    return;
  }

  // 创建类似MV区域的结构
  galleryGrid.innerHTML = `
    <div class="mv-card-container">
      <button class="mv-card-nav-btn" id="gallery-prev">&lt;</button>
      <div class="mv-card">
        <div class="mv-title" id="gallery-title"></div>
        <iframe id="gallery-iframe" allowfullscreen></iframe>
      </div>
      <button class="mv-card-nav-btn" id="gallery-next">&gt;</button>
    </div>
  `;

  // 设置导航按钮事件
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (galleryIndex > 0) {
        galleryIndex--;
        updateGalleryVideo();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (galleryIndex < galleryVideos.length - 1) {
        galleryIndex++;
        updateGalleryVideo();
      }
    };
  }

  // 初始化显示第一个视频
  updateGalleryVideo();

  // --- Add Button to Upload New Video ---
  const addRow = document.createElement('div');
  addRow.style.marginTop = '16px';
  addRow.style.textAlign = 'center';
  addRow.innerHTML = `<button id="add-video-btn" title="添加二创视频" style="padding:8px 0;border:none;border-radius:50%;width:48px;height:48px;font-size:28px;line-height:1;background:#ffb6e6;color:#fff;cursor:pointer;">＋</button>`;
  galleryGrid.appendChild(addRow);

  const addVideoBtn = document.getElementById('add-video-btn');
  if (addVideoBtn) {
    addVideoBtn.onclick = () => {
      const link = prompt('请输入B站视频链接或其它视频URL');
      if (!link) return;

      const trimmed = link.trim();
      const bvidMatch = trimmed.match(/BV[0-9A-Za-z]{10,}/);
      let newVideo;
      const todayStr = new Date().toISOString().split('T')[0];
      if (bvidMatch) {
        newVideo = { type: 'bilibili', bvid: bvidMatch[0], title: todayStr };
      } else {
        newVideo = { type: 'iframe', url: trimmed, title: todayStr };
      }
      galleryVideos.push(newVideo);
      galleryIndex = galleryVideos.length - 1;
      updateGalleryVideo();
      saveUserVideo(newVideo);
    };
  }

  // 结束渲染
  updateGalleryVideo();
}

// 更新二创视频显示
function updateGalleryVideo() {
  const video = galleryVideos[galleryIndex];
  if (!video) return;

  const titleElem = document.getElementById('gallery-title');
  const iframeElem = document.getElementById('gallery-iframe');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  if (titleElem) {
    titleElem.textContent = video.title || video.desc || 'Untitled Video';
  }

  if (iframeElem) {
    if (video.type === 'bilibili' && video.bvid) {
      iframeElem.src = `//player.bilibili.com/player.html?bvid=${video.bvid}&page=1&high_quality=1&danmaku=0`;
    } else if (video.url) {
      iframeElem.src = video.url;
    }
  }

  // 更新导航按钮状态
  if (prevBtn) {
    prevBtn.disabled = galleryIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = galleryIndex === galleryVideos.length - 1;
  }
}

// 添加显示大图的函数
function showPosterInGallery(photoUrl) {
  const overlay = document.getElementById('gallery-overlay');
  const grid = document.querySelector('#gallery-overlay .gallery-grid');
  
  if (!overlay || !grid) {
    console.error('Gallery elements not found');
    return;
  }

  // 清空现有内容和移除旧的事件监听器
  grid.innerHTML = '';
  overlay.onclick = null;

  // 创建图片元素
  const img = document.createElement('img');
  img.src = photoUrl;
  
  // 添加点击事件来关闭
  img.onclick = (e) => {
    e.stopPropagation();
    closeGallery();
  };

  grid.appendChild(img);
  overlay.classList.add('active');

  // 添加关闭功能
  const closeBtn = document.getElementById('gallery-close-btn');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeGallery();
    };
  }

  // 点击遮罩层关闭
  overlay.onclick = () => {
    closeGallery();
  };

  // 添加键盘事件支持
  document.addEventListener('keydown', handleKeydown);
}

// 将关闭逻辑抽取到单独的函数
function closeGallery() {
  const overlay = document.getElementById('gallery-overlay');
  if (overlay) {
    // 先停止视频播放
    const iframe = document.getElementById('gallery-iframe');
    if (iframe) {
      // 1. 先将src设为空
      iframe.src = '';
      // 2. 移除iframe元素
      iframe.remove();
    }

    // 然后重建整个结构
    const galleryGrid = document.querySelector('#gallery-overlay .gallery-grid');
    if (galleryGrid) {
      galleryGrid.innerHTML = `
        <div class="mv-card-container">
          <button class="mv-card-nav-btn" id="gallery-prev">&lt;</button>
          <div class="mv-card">
            <div class="mv-title" id="gallery-title"></div>
            <iframe id="gallery-iframe" allowfullscreen></iframe>
          </div>
          <button class="mv-card-nav-btn" id="gallery-next">&gt;</button>
        </div>
      `;
    }

    // 最后移除遮罩层和事件监听
    overlay.classList.remove('active');
    document.removeEventListener('keydown', handleKeydown);
    overlay.onclick = null;
    const closeBtn = document.getElementById('gallery-close-btn');
    if (closeBtn) {
      closeBtn.onclick = null;
    }
  }
}

// 将键盘事件处理抽取到外部
function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeGallery();
  }
}

// 添加关闭按钮事件
const galleryCloseBtn = document.getElementById('gallery-close-btn');

