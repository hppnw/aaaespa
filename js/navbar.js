// ������״̬����
class NavbarManager {
    constructor() {
        this.init();
        this.isMobileMenuOpen = false;
    }

    async init() {
        // ����������
        const navbar = document.createElement('nav');
        navbar.className = 'site-nav';
        
        // ��ӵ�ҳ��
        document.body.insertBefore(navbar, document.body.firstChild);
        
        // �����ƶ��˲˵�����
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.addEventListener('click', () => this.toggleMobileMenu());
        document.body.appendChild(overlay);
        
        // ���µ�����״̬
        this.updateNavbar();
        
        // ������¼״̬�仯
        window.addEventListener('authStateChanged', () => {
            this.updateNavbar();
        });

        // ������Ļ��ת
        window.addEventListener('orientationchange', () => {
            if (this.isMobileMenuOpen) {
                this.toggleMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const navbar = document.querySelector('.site-nav');
        const overlay = document.querySelector('.mobile-menu-overlay');
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.isMobileMenuOpen) {
            navbar.classList.add('mobile-menu-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            navbar.classList.remove('mobile-menu-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async updateNavbar() {
        const navbar = document.querySelector('.site-nav');
        if (!navbar) return;

        const isLoggedIn = window.authManager.isLoggedIn();
        const user = window.authManager.getUser();

        navbar.innerHTML = `
            <div class="nav-left">
                <a href="index.html" class="nav-logo">aespa</a>
                <a href="index.html" class="nav-link">��ҳ</a>
                <a href="album.html" class="nav-link">ר��</a>
                <a href="member.html" class="nav-link">��Ա</a>
            </div>
            <div class="nav-right">
                ${isLoggedIn 
                    ? `<span class="welcome-text">��ӭ��${user.username}</span>
                       <a href="user.html" class="nav-link">��������</a>`
                    : `<a href="user.html" class="nav-link">��¼/ע��</a>`
                }
            </div>
        `;

        // �����ʽ
        if (!document.querySelector('#navbar-styles')) {
            const style = document.createElement('style');
            style.id = 'navbar-styles';
            style.textContent = `
                .site-nav {
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    padding: 0.8rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }

                .nav-left, .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .nav-logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #ffb6e6;
                    text-decoration: none;
                    font-family: 'Arial', sans-serif;
                }

                .nav-link {
                    color: #666;
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: color 0.3s;
                    position: relative;
                }

                .nav-link:hover {
                    color: #ffb6e6;
                }

                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: #ffb6e6;
                    transform: scaleX(0);
                    transition: transform 0.3s;
                }

                .nav-link:hover::after {
                    transform: scaleX(1);
                }

                .welcome-text {
                    color: #666;
                    font-size: 0.95rem;
                }

                body {
                    padding-top: 60px;
                }
            `;
            document.head.appendChild(style);
        }


    }
}

// ����ȫ�ֵ�����������
window.navbarManager = new NavbarManager();
