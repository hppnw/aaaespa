// ��ҳ�ƶ��˽�����ǿ
document.addEventListener('DOMContentLoaded', () => {
  // ƽ������֧��
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ʱ���ߴ�������
  const timeline = document.querySelector('.timeline-wrapper');
  if (timeline) {
    let startX, startY;
    let isScrolling;
    
    timeline.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = undefined;
    }, { passive: true });

    timeline.addEventListener('touchmove', (e) => {
      if (isScrolling === undefined) {
        isScrolling = Math.abs(e.touches[0].clientY - startY) > Math.abs(e.touches[0].clientX - startX);
      }

      if (!isScrolling) {
        e.preventDefault(); // ��ֹˮƽ����ʱ��ҳ�����
      }
    }, { passive: false });
  }

  // �����˵�����
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('touchstart', () => {
      item.style.transform = 'scale(0.95)';
    });

    item.addEventListener('touchend', () => {
      item.style.transform = 'scale(1)';
    });
  });

  // �Ӳ����Ч��
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
          const scrolled = window.pageYOffset;
          heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ˫�����ض���
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0 && e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    lastTap = currentTime;
  });

  // ����ˢ��֧��
  let touchStart = 0;
  let pullStarted = false;
  const threshold = 100;
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      touchStart = e.touches[0].clientY;
      pullStarted = true;
    }
  });

  document.addEventListener('touchmove', (e) => {
    if (!pullStarted) return;
    
    const pullDistance = e.touches[0].clientY - touchStart;
    if (pullDistance > 0 && pullDistance < threshold) {
      document.body.style.transform = `translateY(${pullDistance}px)`;
    }
  });

  document.addEventListener('touchend', () => {
    if (!pullStarted) return;
    
    document.body.style.transform = '';
    pullStarted = false;

    if (parseInt(document.body.style.transform) > threshold) {
      location.reload();
    }
  });

  // ҳ��ת�������Ż�
  const pageTransitionMask = document.getElementById('page-transition-mask');
  if (pageTransitionMask) {
    document.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          e.preventDefault();
          pageTransitionMask.classList.add('active');
          setTimeout(() => {
            window.location.href = href;
          }, 300);
        }
      });
    });
  }
});
