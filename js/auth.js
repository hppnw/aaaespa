// 用户认证状态管理
class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    // 初始化：检查登录状态
    async init() {
        try {
            // 验证服务器端session
            const response = await fetch('/api/userinfo', {
                credentials: 'include'
            });
            const res = await response.json();

            if (res.success && res.user) {
                this.user = res.user;
                // 更新本地存储
                sessionStorage.setItem('userInfo', JSON.stringify(res.user));
                if (localUser) { // 如果之前使用了"记住我"
                    localStorage.setItem('userInfo', JSON.stringify(res.user));
                }
                this.updateUI(true);
            } else {
                // 服务器端session已失效，清除本地存储
                this.clearAuth();
            }
        } catch (err) {
            console.error('验证登录状态失败:', err);
        }
    }

    // 登录
    async login(username, password, remember = false) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password, remember })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.user = data.user;
                sessionStorage.setItem('userInfo', JSON.stringify(data.user));
                if (remember) {
                    localStorage.setItem('userInfo', JSON.stringify(data.user));
                }
                this.updateUI(true);
                return { success: true };
            } else {
                return { success: false, message: data.message || '登录失败' };
            }
        } catch (err) {
            console.error('登录失败:', err);
            return { success: false, message: '网络错误，请稍后重试' };
        }
    }

    // 注销
    async logout() {
        try {
            const response = await fetch('/api/logout', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Logout failed');
            }
            this.clearAuth();
            return true;
        } catch (err) {
            console.error('注销失败:', err);
            return false;
        }
    }

    // 清除认证状态
    clearAuth() {
        this.user = null;
        sessionStorage.removeItem('userInfo');
        localStorage.removeItem('userInfo');
        this.updateUI(false);
    }

    // 获取当前用户信息
    getUser() {
        return this.user;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.user;
    }

    // 更新页面UI
    updateUI(isLoggedIn) {
        // 获取所有需要根据登录状态显示/隐藏的元素
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(el => {
            const authType = el.dataset.auth;
            if (authType === 'logged-in') {
                el.style.display = isLoggedIn ? '' : 'none';
            } else if (authType === 'logged-out') {
                el.style.display = isLoggedIn ? 'none' : '';
            }
        });

        // 触发登录状态改变事件
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn, user: this.user }
        }));
    }
}

// 创建全局单例
window.authManager = new AuthManager();
