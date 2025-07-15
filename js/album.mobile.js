// 移动端交互增强
document.addEventListener('DOMContentLoaded', () => {
  const playerControls = document.querySelector('.player-controls');
  const progressBar = document.querySelector('.progress-bar');
  const trackList = document.querySelector('.track-list');
  
  // 进度条触摸处理
  if (progressBar) {
    let isDragging = false;
    let startX, startLeft;
    
    progressBar.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX;
      startLeft = parseInt(progressBar.style.width || '0');
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.touches[0].clientX - startX;
      const parentWidth = progressBar.parentElement.offsetWidth;
      let newWidth = Math.max(0, Math.min(100, startLeft + (deltaX / parentWidth * 100)));
      
      progressBar.style.width = `${newWidth}%`;
      e.preventDefault();
    });

    document.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      
      // 触发进度更新事件
      const event = new CustomEvent('progressChanged', {
        detail: { progress: parseInt(progressBar.style.width) }
      });
      progressBar.dispatchEvent(event);
    });
  }

  // 专辑封面手势支持
  const cdCover = document.querySelector('#cd-cover');
  if (cdCover) {
    let startTime;
    let startTouches;
    
    cdCover.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        startTime = Date.now();
        startTouches = [...e.touches];
      }
    });

    cdCover.addEventListener('touchend', (e) => {
      if (startTouches && startTouches.length === 2) {
        const duration = Date.now() - startTime;
        if (duration < 300) { // 快速双指触摸
          // 触发封面旋转动画
          cdCover.classList.toggle('rotating');
        }
      }
      startTouches = null;
    });
  }

  // 优化滚动体验
  if (trackList) {
    let touchStartY;
    
    trackList.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    trackList.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const scrollTop = trackList.scrollTop;
      
      // 到达顶部或底部时阻止默认滚动
      if (
        (scrollTop <= 0 && touchY > touchStartY) || // 顶部下拉
        (scrollTop >= trackList.scrollHeight - trackList.offsetHeight && touchY < touchStartY) // 底部上拉
      ) {
        e.preventDefault();
      }
    });
  }

  // 双击播放/暂停支持
  const trackItems = document.querySelectorAll('.track-item');
  trackItems.forEach(item => {
    let lastTap = 0;
    
    item.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        // 双击播放/暂停
        const playButton = item.querySelector('.play-button');
        if (playButton) {
          playButton.click();
        }
      }
      lastTap = currentTime;
    });
  });

  // 播放器控件位置自适应
  function adjustPlayerControlsPosition() {
    const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0px';
    if (playerControls) {
      playerControls.style.bottom = safeAreaBottom;
    }
  }

  // 监听屏幕旋转
  window.addEventListener('orientationchange', adjustPlayerControlsPosition);
  adjustPlayerControlsPosition();

  // 为iOS设备添加专门的类
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.body.classList.add('ios-device');
  }
});
