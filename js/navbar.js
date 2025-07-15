// 导航栏状态管理
class NavbarManager {
    constructor() {
        this.init();
        this.isMobileMenuOpen = false;
    }

    async init() {
        // 创建导航栏
        const navbar = document.createElement('nav');
        navbar.className = 'site-nav';
        
        // 添加到页面
        document.body.insertBefore(navbar, document.body.firstChild);
        
        // 创建移动端菜单遮罩
        const overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.addEventListener('click', () => this.toggleMobileMenu());
        document.body.appendChild(overlay);
        
        // 更新导航栏状态
        this.updateNavbar();
        
        // 监听登录状态变化
        window.addEventListener('authStateChanged', () => {
            this.updateNavbar();
        });

        // 监听屏幕旋转
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
                <a href="index.html" class="nav-link">首页</a>
                <a href="album.html" class="nav-link">专辑</a>
                <a href="member.html" class="nav-link">成员</a>
            </div>
            <div class="nav-right">
                ${isLoggedIn 
                    ? `<span class="welcome-text">欢迎，${user.username}</span>
                       <a href="user.html" class="nav-link">个人中心</a>`
                    : `<a href="user.html" class="nav-link">登录/注册</a>`
                }
            </div>
        `;

        // 添加样式
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

// 创建全局导航栏管理器
window.navbarManager = new NavbarManager();
