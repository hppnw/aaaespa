// �ƶ��˽�����ǿ
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('photo-gallery');
  const memberLeft = document.getElementById('member-left');
  
  // ��������֧��
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

    // �����ֱ��������ˮƽ������������
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    e.preventDefault();
    const newTranslateX = currentTranslateX + deltaX;
    
    // ���ƻ�����Χ
    if (newTranslateX > 0 || newTranslateX < -(gallery.scrollWidth - gallery.offsetWidth)) return;
    
    gallery.style.transform = `translateX(${newTranslateX}px)`;
  });

  gallery.addEventListener('touchend', () => {
    isDragging = false;
    currentTranslateX = parseInt(gallery.style.transform.replace('translateX(', '')) || 0;
    gallery.style.transition = 'transform 0.3s ease-out';
  });

  // ͼƬȫ��Ԥ���Ż�
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
      closeBtn.innerHTML = '��';
      
      fullscreenOverlay.innerHTML = '';
      fullscreenOverlay.appendChild(fullImg);
      fullscreenOverlay.appendChild(closeBtn);
      fullscreenOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // ֧��˫ָ����
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

  // ��������������֮��ľ���
  function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ��Ա��Ϣ�����Ӳ�Ч��
  if (memberLeft) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      memberLeft.style.transform = `translateY(${scrolled * 0.5}px)`;
    }, { passive: true });
  }

  // ˫���Ŵ�ͼƬ֧��
  let lastTap = 0;
  images.forEach(img => {
    img.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        img.click(); // ����ȫ��Ԥ��
      }
      lastTap = currentTime;
    });
  });
});
