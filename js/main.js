
const groupImgPath = "assets/img/aespa-group.jpg";
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const transitionImg = new Image();
let memberData = null;

fetch("js/data/members.json")
  .then((res) => res.json())
  .then((data) => {
    memberData = data;
    setupClickAreas();
  });

function setupClickAreas() {
  const groupImg = document.getElementById("group-photo");
  const mapOverlay = document.createElement("div");
  mapOverlay.id = "map-overlay";
  mapOverlay.style.position = "absolute";
  mapOverlay.style.left = "0";
  mapOverlay.style.top = "0";
  mapOverlay.style.width = "100%";
  mapOverlay.style.height = "100%";
  mapOverlay.style.zIndex = "10";

  groupImg.parentElement.style.position = "relative";
  groupImg.parentElement.appendChild(mapOverlay);

  memberData.forEach((member) => {
    const region = document.createElement("div");
    region.className = "click-region";
    region.dataset.id = member.id;
    region.style.position = "absolute";

    const updatePosition = () => {
      const rect = groupImg.getBoundingClientRect();
      const scaleX = rect.width / groupImg.naturalWidth;
      const scaleY = rect.height / groupImg.naturalHeight;
      const x = member.faceArea.x * scaleX;
      const y = member.faceArea.y * scaleY;
      const width = member.faceArea.width * scaleX;
      const height = member.faceArea.height * scaleY;

      region.style.left = `${x}px`;
      region.style.top = `${y}px`;
      region.style.width = `${width}px`;
      region.style.height = `${height}px`;
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    region.addEventListener("click", (e) => {
      if (document.getElementById('mv-bg')) return;
      e.preventDefault();
      animateMemberTransition(member);
    });

    mapOverlay.appendChild(region);
  });
}

function animateMemberTransition(member) {
  const img = new Image();
  img.src = groupImgPath;
  img.onload = () => {
    const { x, y, width, height } = member.faceArea;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const blurMask = document.createElement("div");
    blurMask.id = "blur-mask";
    blurMask.style.position = "fixed";
    blurMask.style.left = "0";
    blurMask.style.top = "0";
    blurMask.style.width = "100vw";
    blurMask.style.height = "100vh";
    blurMask.style.zIndex = 9998;
    blurMask.style.background = "rgba(0,0,0,0.2)";
    blurMask.style.backdropFilter = "blur(16px)";
    blurMask.style.transition = "opacity 0.8s";
    blurMask.style.opacity = "1";
    document.body.appendChild(blurMask);

    const transitionContainer = document.createElement("div");
    transitionContainer.id = "transition-container";
    transitionContainer.style.position = "fixed";
    transitionContainer.style.left = "0";
    transitionContainer.style.top = "0";
    transitionContainer.style.width = "100vw";
    transitionContainer.style.height = "100vh";
    transitionContainer.style.zIndex = 9999;
    transitionContainer.style.overflow = "visible";
    transitionContainer.style.pointerEvents = "none";

    const avatarCanvas = document.createElement("canvas");
    avatarCanvas.width = width;
    avatarCanvas.height = height;
    const avatarCtx = avatarCanvas.getContext("2d");
    avatarCtx.drawImage(img, x, y, width, height, 0, 0, width, height);

    const avatarImg = new Image();
    const cutBase64 = avatarCanvas.toDataURL();
    avatarImg.src = cutBase64;
    avatarImg.style.position = "absolute";
    const scaleX = window.innerWidth / img.naturalWidth;
    const scaleY = window.innerHeight / img.naturalHeight;
    const startW = width * scaleX;
    const startH = height * scaleY;
    const startL = x * scaleX;
    const startT = y * scaleY;
    avatarImg.style.left = `${startL}px`;
    avatarImg.style.top = `${startT}px`;
    avatarImg.style.width = `${startW}px`;
    avatarImg.style.height = `${startH}px`;
    avatarImg.style.borderRadius = "0";
    avatarImg.style.boxShadow = "none";
    avatarImg.style.transition = "all 0.8s cubic-bezier(0.4,0,0.2,1)";
    avatarImg.style.zIndex = "10000";
    avatarImg.style.objectFit = "contain";

    transitionContainer.appendChild(avatarImg);
    document.body.appendChild(transitionContainer);

    setTimeout(() => {
      const targetW = 340;
      const scale = targetW / startW;
      avatarImg.style.transformOrigin = "top left";
      avatarImg.style.transform = `scale(${scale})`;
      avatarImg.style.left = `0px`;
      avatarImg.style.top = `0px`;
      blurMask.style.opacity = "1";
    }, 10);

    setTimeout(() => {
      blurMask.style.opacity = "0";
      transitionContainer.style.opacity = "0";
    }, 800);

    setTimeout(() => {
      try {
        sessionStorage.setItem('aespa_member_cut', cutBase64);
      } catch (e) {}
      window.location.href = `member.html?member=${member.id}`;
    }, 1000);
  };
}