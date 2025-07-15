// �ƶ�������ű�
document.addEventListener('DOMContentLoaded', function() {
    // ����ƶ��˲˵���ť
    const nav = document.querySelector('nav');
    if (nav) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        nav.appendChild(menuBtn);

        // �����ƶ��˵����˵�
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = nav.querySelector('.nav-links').innerHTML;
        document.body.appendChild(mobileNav);

        // �˵�����
        menuBtn.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
            menuBtn.innerHTML = mobileNav.classList.contains('active') ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
        });

        // ����˵����رղ˵�
        mobileNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mobileNav.classList.remove('active');
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // �Ż������¼�
    document.querySelectorAll('a, button').forEach(el => {
        el.classList.add('clickable');
    });

    // ����豸����
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }

    // ����iOS�ص�Ч��
    document.body.addEventListener('touchmove', function(e) {
        if (e.target.classList.contains('scroll-container')) {
            e.stopPropagation();
        }
    }, { passive: false });

    // ˫�����Ž���
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});
