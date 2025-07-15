// 首页移动端交互增强
document.addEventListener('DOMContentLoaded', () => {
  // 平滑滚动支持
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

  // 时间线触摸交互
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
        e.preventDefault(); // 阻止水平滑动时的页面滚动
      }
    }, { passive: false });
  }

  // 导航菜单交互
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('touchstart', () => {
      item.style.transform = 'scale(0.95)';
    });

    item.addEventListener('touchend', () => {
      item.style.transform = 'scale(1)';
    });
  });

  // 视差滚动效果
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

  // 双击返回顶部
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

  // 下拉刷新支持
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

  // 页面转场动画优化
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
