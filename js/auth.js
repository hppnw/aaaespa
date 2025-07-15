// �û���֤״̬����
class AuthManager {
    constructor() {
        this.user = null;
        this.init();
    }

    // ��ʼ��������¼״̬
    async init() {
        try {
            // ��֤��������session
            const response = await fetch('/api/userinfo', {
                credentials: 'include'
            });
            const res = await response.json();

            if (res.success && res.user) {
                this.user = res.user;
                // ���±��ش洢
                sessionStorage.setItem('userInfo', JSON.stringify(res.user));
                if (localUser) { // ���֮ǰʹ����"��ס��"
                    localStorage.setItem('userInfo', JSON.stringify(res.user));
                }
                this.updateUI(true);
            } else {
                // ��������session��ʧЧ��������ش洢
                this.clearAuth();
            }
        } catch (err) {
            console.error('��֤��¼״̬ʧ��:', err);
        }
    }

    // ��¼
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
                return { success: false, message: data.message || '��¼ʧ��' };
            }
        } catch (err) {
            console.error('��¼ʧ��:', err);
            return { success: false, message: '����������Ժ�����' };
        }
    }

    // ע��
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
            console.error('ע��ʧ��:', err);
            return false;
        }
    }

    // �����֤״̬
    clearAuth() {
        this.user = null;
        sessionStorage.removeItem('userInfo');
        localStorage.removeItem('userInfo');
        this.updateUI(false);
    }

    // ��ȡ��ǰ�û���Ϣ
    getUser() {
        return this.user;
    }

    // ����Ƿ��ѵ�¼
    isLoggedIn() {
        return !!this.user;
    }

    // ����ҳ��UI
    updateUI(isLoggedIn) {
        // ��ȡ������Ҫ���ݵ�¼״̬��ʾ/���ص�Ԫ��
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(el => {
            const authType = el.dataset.auth;
            if (authType === 'logged-in') {
                el.style.display = isLoggedIn ? '' : 'none';
            } else if (authType === 'logged-out') {
                el.style.display = isLoggedIn ? 'none' : '';
            }
        });

        // ������¼״̬�ı��¼�
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn, user: this.user }
        }));
    }
}

// ����ȫ�ֵ���
window.authManager = new AuthManager();
