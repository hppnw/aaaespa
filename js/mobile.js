// 移动端适配脚本
document.addEventListener('DOMContentLoaded', function() {
    // 添加移动端菜单按钮
    const nav = document.querySelector('nav');
    if (nav) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        nav.appendChild(menuBtn);

        // 创建移动端导航菜单
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = nav.querySelector('.nav-links').innerHTML;
        document.body.appendChild(mobileNav);

        // 菜单开关
        menuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            menuBtn.innerHTML = mobileNav.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });

        // 点击菜单项后关闭菜单
        mobileNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mobileNav.classList.remove('active');
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // 优化触摸事件
    document.querySelectorAll('a, button').forEach(el => {
        el.classList.add('clickable');
    });

    // 检测设备类型
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }

    // 处理iOS回弹效果
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.classList.contains('scroll-container')) {
            e.stopPropagation();
        }
    }, { passive: false });

    // 双击缩放禁用
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});
