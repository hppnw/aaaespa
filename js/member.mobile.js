// 移动端交互增强
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('photo-gallery');
  const memberLeft = document.getElementById('member-left');
  
  // 触摸滑动支持
  let touchStartX = 0;
  let touchStartY = 0;
  let currentTranslateX = 0;
  let isDragging = false;

  gallery.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    gallery.style.transition = 'none';
  });

  gallery.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    // 如果垂直滑动大于水平滑动，不处理
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    e.preventDefault();
    const newTranslateX = currentTranslateX + deltaX;
    
    // 限制滑动范围
    if (newTranslateX > 0 || newTranslateX < -(gallery.scrollWidth - gallery.offsetWidth)) return;
    
    gallery.style.transform = `translateX(${newTranslateX}px)`;
  });

  gallery.addEventListener('touchend', () => {
    isDragging = false;
    currentTranslateX = parseInt(gallery.style.transform.replace('translateX(', '')) || 0;
    gallery.style.transition = 'transform 0.3s ease-out';
  });

  // 图片全屏预览优化
  const images = document.querySelectorAll('.gallery-item img');
  const fullscreenOverlay = document.createElement('div');
  fullscreenOverlay.className = 'fullscreen-overlay';
  document.body.appendChild(fullscreenOverlay);

  images.forEach(img => {
    img.addEventListener('click', () => {
      const fullImg = document.createElement('img');
      fullImg.src = img.src;
      fullImg.className = 'fullscreen-image';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-fullscreen';
      closeBtn.innerHTML = '×';
      
      fullscreenOverlay.innerHTML = '';
      fullscreenOverlay.appendChild(fullImg);
      fullscreenOverlay.appendChild(closeBtn);
      fullscreenOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // 支持双指缩放
      let currentScale = 1;
      let initialDistance = 0;

      fullImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          initialDistance = getDistance(e.touches[0], e.touches[1]);
          e.preventDefault();
        }
      });

      fullImg.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          const distance = getDistance(e.touches[0], e.touches[1]);
          const scale = (distance / initialDistance) * currentScale;
          
          if (scale > 0.5 && scale < 3) {
            fullImg.style.transform = `scale(${scale})`;
          }
          e.preventDefault();
        }
      });

      fullImg.addEventListener('touchend', () => {
        currentScale = parseFloat(fullImg.style.transform.replace('scale(', '')) || 1;
      });

      closeBtn.addEventListener('click', () => {
        fullscreenOverlay.style.display = 'none';
        document.body.style.overflow = '';
      });
    });
  });

  // 计算两个触摸点之间的距离
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 成员信息区域视差效果
  if (memberLeft) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      memberLeft.style.transform = `translateY(${scrolled * 0.5}px)`;
    }, { passive: true });
  }

  // 双击放大图片支持
  let lastTap = 0;
  images.forEach(img => {
    img.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        img.click(); // 触发全屏预览
      }
      lastTap = currentTime;
    });
  });
});
