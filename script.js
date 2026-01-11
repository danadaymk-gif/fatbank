// Головний об'єкт додатку
const BankApp = {
    // Дані
    currentUser: null,
    users: JSON.parse(localStorage.getItem('fat_bank_users')) || [],
    loans: JSON.parse(localStorage.getItem('fat_bank_loans')) || [],
    transfers: JSON.parse(localStorage.getItem('fat_bank_transfers')) || [],
    supportRequests: JSON.parse(localStorage.getItem('fat_bank_support')) || [],
    
    // Ініціалізація
    init() {
        this.loadData();
        this.setupEventListeners();
        this.initPWA();
        
        // Перевірка активного користувача
        const activeUser = localStorage.getItem('fat_bank_active_user');
        if (activeUser) {
            this.currentUser = JSON.parse(activeUser);
            this.showMainApp();
        }
        
        // Створення адміна за замовчуванням
        this.createDefaultAdmin();
    },
    
    // Завантаження даних
    loadData() {
        const savedUsers = localStorage.getItem('fat_bank_users');
        if (savedUsers) this.users = JSON.parse(savedUsers);
        
        const savedLoans = localStorage.getItem('fat_bank_loans');
        if (savedLoans) this.loans = JSON.parse(savedLoans);
        
        const savedTransfers = localStorage.getItem('fat_bank_transfers');
        if (savedTransfers) this.transfers = JSON.parse(savedTransfers);
        
        const savedSupport = localStorage.getItem('fat_bank_support');
        if (savedSupport) this.supportRequests = JSON.parse(savedSupport);
    },
    
    // Створення адміна
    createDefaultAdmin() {
        if (!this.users.find(u => u.email === 'admin@fatbank.com')) {
            this.users.push({
                id: this.generateId(),
                name: 'Адмін',
                email: 'admin@fatbank.com',
                password: 'admin123',
                balance: 1000000,
                clicks: 0,
                cardNumber: this.generateCardNumber(),
                isAdmin: true,
                isBlocked: false,
                joinDate: new Date().toISOString()
            });
            this.saveUsers();
        }
    },
    
    // Генерація ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Генерація номера картки
    generateCardNumber() {
        let card = '';
        for (let i = 0; i < 16; i++) {
            card += Math.floor(Math.random() * 10);
            if ((i + 1) % 4 === 0 && i !== 15) card += ' ';
        }
        return card;
    },
    
    // Збереження даних
    saveUsers() {
        localStorage.setItem('fat_bank_users', JSON.stringify(this.users));
    },
    
    saveLoans() {
        localStorage.setItem('fat_bank_loans', JSON.stringify(this.loans));
    },
    
    saveTransfers() {
        localStorage.setItem('fat_bank_transfers', JSON.stringify(this.transfers));
    },
    
    saveSupport() {
        localStorage.setItem('fat_bank_support', JSON.stringify(this.supportRequests));
    },
    
    // Показ головного додатку
    showMainApp() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.updateUserInfo();
        this.showScreen('home');
        
        // Показати кнопку адміна, якщо це адмін
        if (this.currentUser.isAdmin) {
            document.getElementById('adminBtn').style.display = 'flex';
        }
    },
    
    // Оновлення інформації користувача
    updateUserInfo() {
        if (!this.currentUser) return;
        
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userBalance').textContent = this.currentUser.balance + ' ₴';
        document.getElementById('homeBalance').textContent = this.currentUser.balance + ' ₴';
        document.getElementById('clickerBalance').textContent = this.currentUser.balance + ' ₴';
        document.getElementById('userCardNumber').textContent = this.currentUser.cardNumber || this.generateCardNumber();
        document.getElementById('clickCount').textContent = this.currentUser.clicks || 0;
        
        // Оновлення списку кредитів
        this.updateLoansList();
        
        // Оновлення історії переказів
        this.updateTransferHistory();
        
        // Оновлення кількості кредитів
        const userLoans = this.loans.filter(loan => loan.userId === this.currentUser.id && !loan.paid);
        document.getElementById('loanCount').textContent = userLoans.length;
    },
    
    // Показ екрану
    showScreen(screenName) {
        // Приховати всі екрани
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Прибрати активний клас з кнопок
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Показати потрібний екран
        document.getElementById(screenName + 'Screen').classList.add('active');
        
        // Активувати кнопку
        document.querySelector(`.nav-btn[onclick*="${screenName}"]`).classList.add('active');
        
        // Оновити адмін панель якщо потрібно
        if (screenName === 'admin') {
            this.updateAdminPanel();
        }
    },
    
    // Сповіщення
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification-${type}`;
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    },
    
    // Реєстрація
    register() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!name || !email || !password) {
            this.showNotification('Заповніть всі поля', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль має бути не менше 6 символів', 'error');
            return;
        }
        
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Користувач з таким email вже існує', 'error');
            return;
        }
        
        const newUser = {
            id: this.generateId(),
            name: name,
            email: email,
            password: password,
            balance: 100,
            clicks: 0,
            cardNumber: this.generateCardNumber(),
            isAdmin: false,
            isBlocked: false,
            joinDate: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        // Автоматичний вхід
        this.currentUser = newUser;
        localStorage.setItem('fat_bank_active_user', JSON.stringify(newUser));
        
        this.showNotification('Реєстрація успішна! Вам нараховано 100 ₴', 'success');
        this.showMainApp();
    },
    
    // Вхід
    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            if (user.isBlocked) {
                this.showNotification('Ваш акаунт заблоковано', 'error');
                return;
            }
            
            this.currentUser = user;
            localStorage.setItem('fat_bank_active_user', JSON.stringify(user));
            this.showMainApp();
        } else {
            this.showNotification('Невірний email або пароль', 'error');
        }
    },
    
    // Вийти
    logout() {
        this.currentUser = null;
        localStorage.removeItem('fat_bank_active_user');
        location.reload();
    },
    
    // Клікер
    clickMoney() {
        if (!this.currentUser) return;
        
        this.currentUser.balance += 1;
        this.currentUser.clicks = (this.currentUser.clicks || 0) + 1;
        this.updateUserInStorage();
        this.updateUserInfo();
        
        // Анімація кліку
        const clickerBtn = document.querySelector('.clicker-btn');
        clickerBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickerBtn.style.transform = 'scale(1)';
        }, 100);
    },
    
    // Кредити
    takeLoan() {
        if (!this.currentUser) return;
        
        const amount = parseInt(document.getElementById('loanAmount').value);
        const term = parseInt(document.getElementById('loanTerm').value);
        
        if (amount < 100) {
            this.showNotification('Мінімальна сума кредиту - 100 ₴', 'error');
            return;
        }
        
        // Розрахунок процентів
        let interestRate;
        switch (term) {
            case 3: interestRate = 0.05; break;
            case 6: interestRate = 0.10; break;
            case 12: interestRate = 0.20; break;
            default: interestRate = 0.10;
        }
        
        const totalAmount = amount + (amount * interestRate);
        const monthlyPayment = totalAmount / term;
        
        const loan = {
            id: this.generateId(),
            userId: this.currentUser.id,
            amount: amount,
            term: term,
            interestRate: interestRate,
            totalAmount: totalAmount,
            monthlyPayment: monthlyPayment,
            remainingAmount: totalAmount,
            paymentsLeft: term,
            paid: false,
            date: new Date().toISOString()
        };
        
        // Зачислити гроші
        this.currentUser.balance += amount;
        this.updateUserInStorage();
        
        // Зберегти кредит
        this.loans.push(loan);
        this.saveLoans();
        
        this.showNotification(`Кредит ${amount} ₴ оформлено!`, 'success');
        this.updateUserInfo();
    },
    
    updateLoansList() {
        if (!this.currentUser) return;
        
        const userLoans = this.loans.filter(loan => loan.userId === this.currentUser.id && !loan.paid);
        const list = document.getElementById('loansList');
        
        if (userLoans.length === 0) {
            list.innerHTML = '<p>У вас немає кредитів</p>';
            return;
        }
        
        let html = '';
        userLoans.forEach(loan => {
            html += `
                <div class="loan-item">
                    <div>
                        <strong>${loan.amount} ₴</strong><br>
                        <small>${loan.term} місяців</small>
                    </div>
                    <div>
                        <span>${loan.remainingAmount.toFixed(2)} ₴</span><br>
                        <button onclick="BankApp.payLoan('${loan.id}')" class="btn btn-small btn-success">Сплатити</button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    },
    
    payLoan(loanId) {
        const loan = this.loans.find(l => l.id === loanId);
        if (!loan) return;
        
        if (this.currentUser.balance < loan.monthlyPayment) {
            this.showNotification('Недостатньо коштів', 'error');
            return;
        }
        
        this.currentUser.balance -= loan.monthlyPayment;
        loan.remainingAmount -= loan.monthlyPayment;
        loan.paymentsLeft--;
        
        if (loan.paymentsLeft <= 0) {
            loan.paid = true;
            this.showNotification('Кредит погашено!', 'success');
        } else {
            this.showNotification(`Сплачено. Залишилось ${loan.paymentsLeft} платежів`, 'success');
        }
        
        this.updateUserInStorage();
        this.saveLoans();
        this.updateUserInfo();
    },
    
    // Переказ
    sendTransfer() {
        if (!this.currentUser) return;
        
        const recipientCard = document.getElementById('recipientCard').value.replace(/\s/g, '');
        const amount = parseInt(document.getElementById('transferAmount').value);
        
        if (!recipientCard || !amount) {
            this.showNotification('Заповніть всі поля', 'error');
            return;
        }
        
        if (amount <= 0) {
            this.showNotification('Сума має бути більше 0', 'error');
            return;
        }
        
        if (this.currentUser.balance < amount) {
            this.showNotification('Недостатньо коштів', 'error');
            return;
        }
        
        const recipient = this.users.find(u => u.cardNumber && u.cardNumber.replace(/\s/g, '') === recipientCard);
        if (!recipient) {
            this.showNotification('Користувача не знайдено', 'error');
            return;
        }
        
        if (recipient.isBlocked) {
            this.showNotification('Картка отримувача заблокована', 'error');
            return;
        }
        
        // Виконати переказ
        this.currentUser.balance -= amount;
        recipient.balance += amount;
        
        const transfer = {
            id: this.generateId(),
            fromUserId: this.currentUser.id,
            fromUserName: this.currentUser.name,
            toUserId: recipient.id,
            toUserName: recipient.name,
            amount: amount,
            date: new Date().toISOString()
        };
        
        this.transfers.push(transfer);
        this.saveTransfers();
        
        this.updateUserInStorage();
        this.updateUserInStorage(recipient);
        
        this.showNotification(`Переказ ${amount} ₴ виконано`, 'success');
        this.updateUserInfo();
        
        // Очистити поля
        document.getElementById('recipientCard').value = '';
        document.getElementById('transferAmount').value = '';
    },
    
    updateTransferHistory() {
        if (!this.currentUser) return;
        
        const userTransfers = this.transfers.filter(t => 
            t.fromUserId === this.currentUser.id || t.toUserId === this.currentUser.id
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const history = document.getElementById('transferHistory');
        
        if (userTransfers.length === 0) {
            history.innerHTML = '<p>Історія відсутня</p>';
            return;
        }
        
        let html = '';
        userTransfers.slice(0, 10).forEach(transfer => {
            const isOutgoing = transfer.fromUserId === this.currentUser.id;
            const date = new Date(transfer.date).toLocaleDateString();
            
            html += `
                <div class="transfer-item">
                    <div>
                        <strong>${date}</strong><br>
                        <small>${isOutgoing ? '→ ' + transfer.toUserName : '← ' + transfer.fromUserName}</small>
                    </div>
                    <div style="color: ${isOutgoing ? '#dc3545' : '#28a745'}">
                        ${isOutgoing ? '-' : '+'}${transfer.amount} ₴
                    </div>
                </div>
            `;
        });
        
        history.innerHTML = html;
    },
    
    // Підтримка
    sendSupport() {
        if (!this.currentUser) return;
        
        const subject = document.getElementById('supportSubject').value;
        const message = document.getElementById('supportMessage').value;
        
        if (!subject || !message) {
            this.showNotification('Заповніть всі поля', 'error');
            return;
        }
        
        const request = {
            id: this.generateId(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userEmail: this.currentUser.email,
            subject: subject,
            message: message,
            date: new Date().toISOString(),
            status: 'new',
            answer: ''
        };
        
        this.supportRequests.push(request);
        this.saveSupport();
        
        this.showNotification('Запит надіслано', 'success');
        
        // Очистити поля
        document.getElementById('supportSubject').value = '';
        document.getElementById('supportMessage').value = '';
    },
    
    // Адмін панель
    updateAdminPanel() {
        if (!this.currentUser || !this.currentUser.isAdmin) return;
        
        this.updateUsersList();
        this.updateSupportRequests();
        this.updateAdminUserSelect();
    },
    
    updateUsersList() {
        const list = document.getElementById('usersList');
        let html = '';
        
        this.users.forEach(user => {
            if (user.isAdmin) return;
            
            html += `
                <div class="user-item">
                    <div>
                        <strong>${user.name}</strong><br>
                        <small>${user.email}</small><br>
                        <span class="card-number">${user.cardNumber}</span>
                    </div>
                    <div>
                        ${user.balance} ₴<br>
                        <button onclick="BankApp.adminBlockUser('${user.id}')" class="btn btn-small ${user.isBlocked ? 'btn-success' : 'btn-warning'}">
                            ${user.isBlocked ? 'Розблокувати' : 'Заблокувати'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html || '<p>Користувачів немає</p>';
    },
    
    updateSupportRequests() {
        const requests = document.getElementById('supportRequests');
        const newRequests = this.supportRequests.filter(req => req.status === 'new');
        
        let html = '';
        newRequests.forEach(req => {
            html += `
                <div class="card" style="margin: 10px 0;">
                    <p><strong>${req.userName}</strong> (${req.userEmail})</p>
                    <p><em>${req.subject}</em></p>
                    <p>${req.message}</p>
                    <textarea id="answer_${req.id}" placeholder="Відповідь..." class="input-field"></textarea>
                    <button onclick="BankApp.adminAnswerSupport('${req.id}')" class="btn btn-small btn-primary">Відповісти</button>
                </div>
            `;
        });
        
        requests.innerHTML = html || '<p>Нових запитів немає</p>';
    },
    
    updateAdminUserSelect() {
        const select = document.getElementById('adminUserSelect');
        let html = '<option value="">Виберіть користувача</option>';
        
        this.users.forEach(user => {
            if (!user.isAdmin) {
                html += `<option value="${user.id}">${user.name} (${user.balance} ₴)</option>`;
            }
        });
        
        select.innerHTML = html;
    },
    
    adminBlockUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        user.isBlocked = !user.isBlocked;
        this.updateUserInStorage(user);
        this.updateUsersList();
        
        this.showNotification(`Користувач ${user.name} ${user.isBlocked ? 'заблокований' : 'розблокований'}`, 'success');
    },
    
    adminAnswerSupport(requestId) {
        const answer = document.getElementById(`answer_${requestId}`).value;
        if (!answer.trim()) {
            this.showNotification('Введіть відповідь', 'error');
            return;
        }
        
        const request = this.supportRequests.find(req => req.id === requestId);
        if (request) {
            request.status = 'answered';
            request.answer = answer;
            request.answeredBy = this.currentUser.name;
            request.answerDate = new Date().toISOString();
            this.saveSupport();
            this.updateSupportRequests();
            this.showNotification('Відповідь надіслана', 'success');
        }
    },
    
    adminAddMoney() {
        const userId = document.getElementById('adminUserSelect').value;
        const amount = parseInt(document.getElementById('adminAmount').value);
        
        if (!userId || !amount) {
            this.showNotification('Виберіть користувача та суму', 'error');
            return;
        }
        
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        user.balance += amount;
        this.updateUserInStorage(user);
        
        this.showNotification(`${amount} ₴ нараховано користувачу ${user.name}`, 'success');
        this.updateAdminUserSelect();
    },
    
    adminRemoveMoney() {
        const userId = document.getElementById('adminUserSelect').value;
        const amount = parseInt(document.getElementById('adminAmount').value);
        
        if (!userId || !amount) {
            this.showNotification('Виберіть користувача та суму', 'error');
            return;
        }
        
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        if (user.balance < amount) {
            this.showNotification('Недостатньо коштів', 'error');
            return;
        }
        
        user.balance -= amount;
        this.updateUserInStorage(user);
        
        this.showNotification(`${amount} ₴ списано з рахунку ${user.name}`, 'success');
        this.updateAdminUserSelect();
    },
    
    adminBlockCard() {
        const userId = document.getElementById('adminUserSelect').value;
        if (!userId) {
            this.showNotification('Виберіть користувача', 'error');
            return;
        }
        
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        user.isBlocked = !user.isBlocked;
        this.updateUserInStorage(user);
        
        this.showNotification(`Картка користувача ${user.name} ${user.isBlocked ? 'заблокована' : 'розблокована'}`, 'success');
    },
    
    showAdminTab(tabName) {
        document.querySelectorAll('.admin-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
        document.querySelector(`.admin-tab[onclick*="${tabName}"]`).classList.add('active');
    },
    
    updateUserInStorage(user = null) {
        const userToUpdate = user || this.currentUser;
        const index = this.users.findIndex(u => u.id === userToUpdate.id);
        if (index !== -1) {
            this.users[index] = userToUpdate;
            this.saveUsers();
            
            if (!user) {
                localStorage.setItem('fat_bank_active_user', JSON.stringify(userToUpdate));
            }
        }
    },
    
    // PWA функціонал
    initPWA() {
        // Манифест
        const manifest = {
            name: "Фат Банк",
            short_name: "Фат Банк",
            description: "Симулятор банківських операцій",
            start_url: "/",
            display: "standalone",
            background_color: "#0047ab",
            theme_color: "#0047ab",
            icons: [
                {
                    src: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/university.svg",
                    sizes: "192x192",
                    type: "image/svg+xml"
                }
            ]
        };
        
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestURL;
        document.head.appendChild(link);
        
        // Встановлення PWA
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installButton').classList.add('show');
        });
        
        document.getElementById('installButton').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.showNotification('Додаток встановлено!', 'success');
                }
                deferredPrompt = null;
            }
        });
    },
    
    setupEventListeners() {
        // Нічого не робимо, всі обробники вже в HTML
    }
};

// Глобальні функції для виклику з HTML
function showTab(tabName) {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Form').classList.add('active');
    document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');
}

function login() {
    BankApp.login();
}

function register() {
    BankApp.register();
}

function logout() {
    BankApp.logout();
}

function showScreen(screen) {
    BankApp.showScreen(screen);
}

function clickMoney() {
    BankApp.clickMoney();
}

function takeLoan() {
    BankApp.takeLoan();
}

function sendTransfer() {
    BankApp.sendTransfer();
}

function sendSupport() {
    BankApp.sendSupport();
}

function showAdminTab(tab) {
    BankApp.showAdminTab(tab);
}

function adminAddMoney() {
    BankApp.adminAddMoney();
}

function adminRemoveMoney() {
    BankApp.adminRemoveMoney();
}

function adminBlockCard() {
    BankApp.adminBlockCard();
}

// Ініціалізація при завантаженні
window.onload = function() {
    BankApp.init();
};