window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("member");
  if (!memberId) return;

  fetch(`assets/members/${memberId}/info.json`)
    .then((res) => res.json())
    .then((data) => {
      loadMemberInfo(data, memberId);
    });
});


function loadMemberInfo(data, memberId) {
  const rightBg = document.getElementById("right-bg");
  let bgUrl = "";
  if (data.photos && data.photos.length > 0) {
    bgUrl = data.photos[0];
  } else {
    bgUrl = `assets/members/${memberId}/photo1.jpg`;
  }
  if (rightBg) {
    rightBg.style.setProperty('--bg-url', `url('${bgUrl}')`);
    rightBg.style.background = "linear-gradient(120deg,rgba(30,32,34,0.85) 60%,rgba(60,80,120,0.25) 100%)";
    rightBg.style.position = "absolute";
    rightBg.style.left = 0;
    rightBg.style.top = 0;
    rightBg.style.right = 0;
    rightBg.style.bottom = 0;
    rightBg.style.width = "100%";
    rightBg.style.height = "100%";
    rightBg.style.zIndex = 0;
    rightBg.style.pointerEvents = "none";
    rightBg.style.overflow = "hidden";
    rightBg.style.setProperty('background', "linear-gradient(120deg,rgba(30,32,34,0.85) 60%,rgba(60,80,120,0.25) 100%)");
    rightBg.style.setProperty('position', 'absolute');
    rightBg.style.setProperty('z-index', '0');
    rightBg.style.setProperty('pointer-events', 'none');
    rightBg.style.setProperty('overflow', 'hidden');
    rightBg.style.setProperty('width', '100%');
    rightBg.style.setProperty('height', '100%');
    rightBg.style.setProperty('left', '0');
    rightBg.style.setProperty('top', '0');
    rightBg.style.setProperty('right', '0');
    rightBg.style.setProperty('bottom', '0');
    rightBg.style.setProperty('background', "linear-gradient(120deg,rgba(30,32,34,0.85) 60%,rgba(60,80,120,0.25) 100%)");
    rightBg.style.setProperty('background-image', `linear-gradient(120deg,rgba(30,32,34,0.85) 60%,rgba(60,80,120,0.25) 100%), url('${bgUrl}')`);
    rightBg.style.setProperty('background-size', 'cover');
    rightBg.style.setProperty('background-position', 'center');
    rightBg.style.setProperty('background-repeat', 'no-repeat');
    rightBg.style.setProperty('opacity', '1');
    rightBg.style.setProperty('filter', 'blur(32px) brightness(1.1) saturate(1.2)');
  }
  let cutBase64 = null;
  try {
    cutBase64 = sessionStorage.getItem('aespa_member_cut');
    sessionStorage.removeItem('aespa_member_cut');
  } catch (e) {}
  const avatar = document.getElementById("member-avatar");
  if (cutBase64) {
    avatar.src = cutBase64;
    avatar.alt = data.name + " 照片";
    avatar.style.objectFit = "contain";
    avatar.style.background = "transparent";
    avatar.style.borderRadius = "0";
    avatar.style.boxShadow = "none";
    avatar.style.margin = "0";
    avatar.style.width = "100%";
    avatar.style.height = "auto";
    avatar.style.maxWidth = "100%";
    avatar.style.maxHeight = "100vh";
  } else {
    avatar.src = data.photos && data.photos.length > 0 ? data.photos[0] : `assets/members/${memberId}/photo1.jpg`;
    avatar.alt = data.name;
    avatar.style.objectFit = "cover";
    avatar.style.background = "#222";
    avatar.style.borderRadius = "24px";
    avatar.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
    avatar.style.margin = "32px auto 0 auto";
    avatar.style.width = "auto";
    avatar.style.height = "auto";
    avatar.style.maxWidth = "90%";
    avatar.style.maxHeight = "60vh";
  }

  document.getElementById("member-name").textContent = data.name;
  document.getElementById("member-MBTI").textContent = data.MBTI;
  document.getElementById("member-birth").textContent = `生日：${data.birth}`;
  document.getElementById("member-introduction").textContent = data.introduction; 

  const gallery = document.getElementById("photo-gallery");
  gallery.innerHTML = "";
  const photos = data.photos || [];
  let galleryIndex = 0;
  function renderGallery() {
    gallery.innerHTML = "";
    for (let i = galleryIndex; i < Math.min(galleryIndex + 3, photos.length); i++) {
      const img = document.createElement("img");
      img.src = photos[i];
      img.alt = "成员照片";
      img.classList.add("gallery-photo");
      gallery.appendChild(img);
    }
  }
  renderGallery();
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  function updateNav() {
    if (prevBtn) prevBtn.disabled = galleryIndex === 0;
    if (nextBtn) nextBtn.disabled = galleryIndex + 3 >= photos.length;
  }
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      if (galleryIndex > 0) {
        galleryIndex -= 1;
        renderGallery();
        updateNav();
      }
    };
    nextBtn.onclick = () => {
      if (galleryIndex + 3 < photos.length) {
        galleryIndex += 1;
        renderGallery();
        updateNav();
      }
    };
    updateNav();
  }

  const mvList = document.getElementById("mv-list");
  mvList.innerHTML = "";
  const mvs = data.soloMVs || [];
  let mvIndex = 0;
  function renderMV() {
    mvList.innerHTML = "";
    if (mvs[mvIndex]) {
      const mv = mvs[mvIndex];
      const li = document.createElement("li");
      li.innerHTML = `
        <h3>${mv.title} <span style="font-size:0.8em;color:#999">(${mv.date})</span></h3>
        <iframe
          src="https://player.bilibili.com/player.html?bvid=${mv.embed.bilibili}&autoplay=1"
          allowfullscreen></iframe>
      `;
      mvList.appendChild(li);
    }
  }
  renderMV();
  const mvPrev = document.getElementById("mv-prev");
  const mvNext = document.getElementById("mv-next");
  function updateMVNav() {
    if (mvPrev) mvPrev.disabled = mvIndex === 0;
    if (mvNext) mvNext.disabled = mvIndex === mvs.length - 1;
  }
  if (mvPrev && mvNext) {
    mvPrev.onclick = () => {
      if (mvIndex > 0) {
        mvIndex--;
        renderMV();
        updateMVNav();
      }
    };
    mvNext.onclick = () => {
      if (mvIndex < mvs.length - 1) {
        mvIndex++;
        renderMV();
        updateMVNav();
      }
    };
    updateMVNav();
  }
}