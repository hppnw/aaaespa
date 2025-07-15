// �ƶ��˽�����ǿ
document.addEventListener('DOMContentLoaded', () => {
  const playerControls = document.querySelector('.player-controls');
  const progressBar = document.querySelector('.progress-bar');
  const trackList = document.querySelector('.track-list');
  
  // ��������������
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
      
      // �������ȸ����¼�
      const event = new CustomEvent('progressChanged', {
        detail: { progress: parseInt(progressBar.style.width) }
      });
      progressBar.dispatchEvent(event);
    });
  }

  // ר����������֧��
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
        if (duration < 300) { // ����˫ָ����
          // ����������ת����
          cdCover.classList.toggle('rotating');
        }
      }
      startTouches = null;
    });
  }

  // �Ż���������
  if (trackList) {
    let touchStartY;
    
    trackList.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    });

    trackList.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const scrollTop = trackList.scrollTop;
      
      // ���ﶥ����ײ�ʱ��ֹĬ�Ϲ���
      if (
        (scrollTop <= 0 && touchY > touchStartY) || // ��������
        (scrollTop >= trackList.scrollHeight - trackList.offsetHeight && touchY < touchStartY) // �ײ�����
      ) {
        e.preventDefault();
      }
    });
  }

  // ˫������/��֧ͣ��
  const trackItems = document.querySelectorAll('.track-item');
  trackItems.forEach(item => {
    let lastTap = 0;
    
    item.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        // ˫������/��ͣ
        const playButton = item.querySelector('.play-button');
        if (playButton) {
          playButton.click();
        }
      }
      lastTap = currentTime;
    });
  });

  // �������ؼ�λ������Ӧ
  function adjustPlayerControlsPosition() {
    const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0px';
    if (playerControls) {
      playerControls.style.bottom = safeAreaBottom;
    }
  }

  // ������Ļ��ת
  window.addEventListener('orientationchange', adjustPlayerControlsPosition);
  adjustPlayerControlsPosition();

  // ΪiOS�豸���ר�ŵ���
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.body.classList.add('ios-device');
  }
});
