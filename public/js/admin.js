class AdminPanel {
    constructor() {
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.allUsers = [];
        this.filteredUsers = [];
        this.currentUserId = null;
        this.currentUserRole = null;
        this.charts = {};
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
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Load data for specific section
        if (sectionName === 'chat-stats') {
            this.loadChatStatistics();
        } else if (sectionName === 'analytics') {
            this.loadAnalytics();
        }
    }

    setupEventListeners() {
        // Search
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Pagination
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

        // Modal
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-role-change')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirm-role-change')?.addEventListener('click', () => {
            this.changeUserRole();
        });

        // Stats period
        document.getElementById('stats-period')?.addEventListener('change', (e) => {
            this.loadChatStatistics(e.target.value);
        });

        // Export data
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

            // Update local data
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
        const today = data.today || {};
        const trends = data.trends || {};

        document.getElementById('total-sessions').textContent = today.totalSessions || 0;
        document.getElementById('total-messages').textContent = today.totalMessages || 0;
        document.getElementById('avg-satisfaction').textContent = 
            today.averageSatisfaction ? today.averageSatisfaction.toFixed(1) : '0.0';

        this.updateTrend('sessions-change', trends.sessionsChange);
        this.updateTrend('messages-change', trends.messagesChange);
        this.updateTrend('satisfaction-change', trends.satisfactionChange);
    }

    updateTrend(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const isPositive = value >= 0;
        element.textContent = `${isPositive ? '+' : ''}${value}%`;
        element.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
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
                    tension: 0.4
                }, {
                    label: 'Повідомлення',
                    data: chartData.messages,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    tension: 0.4
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
        // Mock data - replace with real data from API
        const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
        const sessions = [12, 19, 15, 25, 22, 18, 14];
        const messages = [45, 67, 52, 89, 76, 61, 48];

        return { labels, sessions, messages };
    }

    renderPopularQuestions(questions) {
        const container = document.getElementById('popular-questions');
        if (!container) return;

        if (questions.length === 0) {
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

        if (feedback.length === 0) {
            container.innerHTML = '<p class="empty-state">Немає останніх відгуків</p>';
            return;
        }

        container.innerHTML = feedback.map(f => `
            <div class="feedback-item">
                <div class="feedback-rating">
                    ${this.renderStars(f.rating)}
                </div>
                ${f.comment ? `<div class="feedback-comment">${f.comment}</div>` : ''}
                <div class="feedback-time">${this.formatDate(f.timestamp)}</div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const stars = Math.round(rating);
        return '★'.repeat(stars) + '☆'.repeat(5 - stars);
    }

    async loadAnalytics() {
        try {
            // Load insights
            const insightsResponse = await fetch('/api/admin/chat-analytics/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ period: 7 })
            });

            if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json();
                this.renderInsights(insightsData.insights || []);
            }

            // Load active sessions
            const dashboardResponse = await fetch('/api/admin/chat-analytics/dashboard');
            if (dashboardResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                document.getElementById('active-sessions-count').textContent = 
                    dashboardData.activeSessions || 0;
            }

            // Render source chart
            this.renderSourceChart();
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    renderInsights(insights) {
        const container = document.getElementById('insights-list');
        if (!container) return;

        if (insights.length === 0) {
            container.innerHTML = '<p class="empty-state">Немає інсайтів для відображення</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-content">
                    <h4>${insight.message}</h4>
                    ${insight.action ? `<p class="insight-action">${insight.action}</p>` : ''}
                </div>
                <span class="insight-priority ${insight.priority}">${insight.priority}</span>
            </div>
        `).join('');
    }

    renderSourceChart() {
        const ctx = document.getElementById('source-chart');
        if (!ctx) return;

        if (this.charts.source) {
            this.charts.source.destroy();
        }

        this.charts.source = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['FAQ', 'AI'],
                datasets: [{
                    data: [60, 40],
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
            const response = await fetch('/api/admin/chat-analytics/export?format=json');
            
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
        // Refresh statistics every 5 minutes
        setInterval(() => {
            if (document.querySelector('[data-section="chat-stats"]').classList.contains('active')) {
                this.loadChatStatistics();
            }
            if (document.querySelector('[data-section="analytics"]').classList.contains('active')) {
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
        // Simple notification - you can enhance this
        alert(message);
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});