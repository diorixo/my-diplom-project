class AdminPanel {
    constructor() {
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.allUsers = [];
        this.filteredUsers = [];
        this.currentUserId = null;
        this.currentUserRole = null;
        this.charts = {};
        this.chatStats = {};
        this.currentPeriod = 'today';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadUsers();
        this.loadChatStatistics();
        this.startAutoRefresh();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        if (sectionName === 'chat-stats') {
            this.loadChatStatistics(this.currentPeriod);
        } else if (sectionName === 'analytics') {
            this.loadAnalytics();
        }
    }

    setupEventListeners() {
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        document.getElementById('prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderUsers();
            }
        });

        document.getElementById('next-page')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderUsers();
            }
        });

        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-role-change')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirm-role-change')?.addEventListener('click', () => {
            this.changeUserRole();
        });

        document.getElementById('stats-period')?.addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.loadChatStatistics(e.target.value);
        });

        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportAnalytics();
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users');
            
            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            this.allUsers = data.users || [];
            this.filteredUsers = [...this.allUsers];
            this.updateUserStats();
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Помилка завантаження користувачів');
        }
    }

    updateUserStats() {
        const totalUsers = this.allUsers.length;
        const totalTrainers = this.allUsers.filter(u => u.role === 'trainer').length;
        const totalAdmins = this.allUsers.filter(u => u.role === 'admin').length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('total-trainers').textContent = totalTrainers;
        document.getElementById('total-admins').textContent = totalAdmins;
    }

    filterUsers(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredUsers = this.allUsers.filter(user => {
            return (
                user.firstname?.toLowerCase().includes(term) ||
                user.lastname?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.role?.toLowerCase().includes(term)
            );
        });
        this.currentPage = 1;
        this.renderUsers();
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const start = (this.currentPage - 1) * this.usersPerPage;
        const end = start + this.usersPerPage;
        const usersToShow = this.filteredUsers.slice(start, end);

        if (usersToShow.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <p>Користувачів не знайдено</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = usersToShow.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.firstname} ${user.lastname}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.role}">${this.getRoleLabel(user.role)}</span>
                </td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <button class="action-btn" onclick="adminPanel.openRoleModal(${user.id}, '${user.firstname} ${user.lastname}', '${user.role}')">
                        Змінити роль
                    </button>
                </td>
            </tr>
        `).join('');

        this.updatePagination();
    }

    getRoleLabel(role) {
        const labels = {
            'user': 'User',
            'trainer': 'Trainer',
            'admin': 'Admin'
        };
        return labels[role] || role;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
        
        document.getElementById('current-page').textContent = this.currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
    }

    openRoleModal(userId, userName, currentRole) {
        this.currentUserId = userId;
        this.currentUserRole = currentRole;

        document.getElementById('modal-user-name').textContent = userName;
        document.getElementById('new-role').value = currentRole;
        
        const modal = document.getElementById('role-modal');
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('role-modal');
        modal.classList.remove('active');
        this.currentUserId = null;
        this.currentUserRole = null;
    }

    async changeUserRole() {
        const newRole = document.getElementById('new-role').value;

        if (newRole === this.currentUserRole) {
            this.closeModal();
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${this.currentUserId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error('Failed to update role');
            }

            const userIndex = this.allUsers.findIndex(u => u.id === this.currentUserId);
            if (userIndex !== -1) {
                this.allUsers[userIndex].role = newRole;
            }

            this.filteredUsers = [...this.allUsers];
            this.updateUserStats();
            this.renderUsers();
            this.closeModal();
            this.showSuccess('Роль користувача успішно змінено');
        } catch (error) {
            console.error('Error changing role:', error);
            this.showError('Помилка зміни ролі користувача');
        }
    }

    async loadChatStatistics(period = 'today') {
        try {
            const endpoint = period === 'today' ? '/api/admin/chat-analytics/dashboard' : 
                           period === 'week' ? '/api/admin/chat-analytics/weekly' :
                           '/api/admin/chat-analytics/monthly';

            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error('Failed to load chat statistics');
            }

            const data = await response.json();
            
            this.chatStats = data;
            this.updateChatStats(data);
            this.renderActivityChart(data);
            this.renderPopularQuestions(data.popularQuestions || []);
            this.renderRecentFeedback(data.recentFeedback || []);
        } catch (error) {
            console.error('Error loading chat statistics:', error);
            this.showError('Помилка завантаження статистики чату');
        }
    }

    updateChatStats(data) {
        const todayStats = data.today || {};

        document.getElementById('total-sessions').textContent = todayStats.totalSessions || 0;
        document.getElementById('total-messages').textContent = todayStats.totalMessages || 0;
        
        // Показуємо відсоток задоволеності замість середньої оцінки
        const satisfactionRate = todayStats.satisfactionRate !== null && todayStats.satisfactionRate !== undefined 
            ? todayStats.satisfactionRate 
            : 0;
        document.getElementById('avg-satisfaction').textContent = satisfactionRate + '%';
    }

    renderActivityChart(data) {
        const ctx = document.getElementById('activity-chart');
        if (!ctx) return;

        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        const chartData = this.prepareChartData(data);

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Сесії',
                    data: chartData.sessions,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Повідомлення',
                    data: chartData.messages,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    prepareChartData(data) {
        const dailyStats = data.dailyStats || [];
        
        if (dailyStats.length === 0) {
            return {
                labels: [],
                sessions: [],
                messages: []
            };
        }

        const now = new Date();
        // Використовуємо UTC дату замість локальної
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const todayStr = todayUTC.toISOString().split('T')[0];

        console.log('📊 Chart data preparation:');
        console.log('Today string (UTC):', todayStr);

        const labels = dailyStats.map((item, index) => {
            // Порівнюємо рядки дат напряму
            if (item.date === todayStr) {
                return 'Сьогодні';
            }
            
            // Вчора
            const yesterdayUTC = new Date(todayUTC);
            yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
            const yesterdayStr = yesterdayUTC.toISOString().split('T')[0];
            
            if (item.date === yesterdayStr) {
                return 'Вчора';
            }
            
            // Інакше показуємо день тижня та дату
            const date = new Date(item.date + 'T00:00:00Z'); // Додаємо Z для UTC
            return date.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
        });

        const sessions = dailyStats.map(item => item.totalSessions || 0);
        const messages = dailyStats.map(item => item.totalMessages || 0);

        return { labels, sessions, messages };
    }

    renderPopularQuestions(questions) {
        const container = document.getElementById('popular-questions');
        if (!container) return;

        if (!questions || questions.length === 0) {
            container.innerHTML = '<p class="empty-state">Немає даних про популярні питання</p>';
            return;
        }

        container.innerHTML = questions.map(q => `
            <div class="question-item">
                <div class="question-text">${q.question || q.text}</div>
                <div class="question-count">Запитували ${q.count} разів</div>
            </div>
        `).join('');
    }

    renderRecentFeedback(feedback) {
        const container = document.getElementById('recent-feedback');
        if (!container) return;

        if (!feedback || feedback.length === 0) {
            container.innerHTML = '<p class="empty-state">Немає останніх відгуків</p>';
            return;
        }

        container.innerHTML = feedback.map(f => `
            <div class="feedback-item">
                <div class="feedback-rating ${f.isLike ? 'positive' : 'negative'}">
                    ${f.icon || (f.isLike ? '👍' : '👎')}
                    <span>${f.isLike ? 'Корисно' : 'Не корисно'}</span>
                </div>
                ${f.comment ? `<div class="feedback-comment">${f.comment}</div>` : ''}
                <div class="feedback-time">${this.formatDate(f.timestamp)}</div>
            </div>
        `).join('');
    }

    async loadAnalytics() {
        try {
            const response = await fetch('/api/admin/chat-analytics/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ period: 7 })
            });

            if (response.ok) {
                const data = await response.json();
                // Перевіряємо чи insights є масивом
                const insights = Array.isArray(data.insights) ? data.insights : [];
                this.renderInsights(insights);
            } else {
                console.error('Failed to load insights:', response.status);
                this.renderInsights([]);
            }

            // Отримуємо активні сесії з основного дашборду
            const dashboardResponse = await fetch('/api/admin/chat-analytics/dashboard');
            if (dashboardResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                document.getElementById('active-sessions-count').textContent = 
                    dashboardData.activeSessions?.length || 0;
            }

            this.renderSourceChart(this.chatStats);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.renderInsights([]);
            this.showError('Помилка завантаження аналітики');
        }
    }

    renderInsights(insights) {
        const container = document.getElementById('insights-list');
        if (!container) return;

        // Перевіряємо чи insights є масивом
        if (!Array.isArray(insights) || insights.length === 0) {
            container.innerHTML = '<p class="empty-state">Немає інсайтів для відображення</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type || 'info'}">
                <div class="insight-content">
                    <h4>${insight.message}</h4>
                    ${insight.action ? `<p class="insight-action">${insight.action}</p>` : ''}
                </div>
                <span class="insight-priority ${insight.priority || 'low'}">${insight.priority || 'normal'}</span>
            </div>
        `).join('');
    }

    renderSourceChart(data) {
        const ctx = document.getElementById('source-chart');
        if (!ctx) return;

        if (this.charts.source) {
            this.charts.source.destroy();
        }

        const dailyStats = data.dailyStats || [];
        const totalFaq = dailyStats.reduce((sum, day) => 
            sum + (day.responseSourceDistribution?.faq || 0), 0);
        const totalAi = dailyStats.reduce((sum, day) => 
            sum + (day.responseSourceDistribution?.ai || 0), 0);

        const labels = ['FAQ', 'AI'];
        const chartData = [totalFaq || 0, totalAi || 0];

        this.charts.source = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: chartData,
                    backgroundColor: ['#10b981', '#7c3aed']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async exportAnalytics() {
        try {
            const response = await fetch('/api/admin/chat-analytics/export?format=json', {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error('Export failed');
            }

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-analytics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showSuccess('Дані успішно експортовано');
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Помилка експорту даних');
        }
    }

    startAutoRefresh() {
        setInterval(() => {
            const activeSectionName = document.querySelector('.nav-item.active')?.getAttribute('data-section');
            
            if (activeSectionName === 'chat-stats') {
                this.loadChatStatistics(this.currentPeriod);
            } else if (activeSectionName === 'analytics') {
                this.loadAnalytics();
            }
        }, 5 * 60 * 1000);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }
}

let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});