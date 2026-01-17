// Interview Practice App
class InterviewApp {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.userAnswers = {};
        this.viewedAnswers = new Set();

        // Mock interview state
        this.mockState = {
            isRunning: false,
            isPaused: false,
            currentPhase: 'read', // 'read', 'answer', 'review'
            currentQuestionIndex: 0,
            selectedQuestions: [],
            mockAnswers: {},
            timer: null,
            timeRemaining: 0,
            totalTime: 0,
            startTime: null,
            settings: {
                readTime: 15,
                answerTime: 30,
                reviewTime: 20,
                questionCount: 10
            }
        };

        this.init();
    }

    async init() {
        await this.loadConfig();
        await this.loadQuestions();
        await this.loadTips();
        this.loadProgress();
        this.setupEventListeners();
        this.renderQuestion();
    }

    // Load configuration
    async loadConfig() {
        try {
            const response = await fetch('data/config.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            this.config = { questions: [], tips: 'tips.md' };
        }
    }

    // Load all questions from MD files
    async loadQuestions() {
        const questionFiles = this.config.questions || [];
        let loadErrors = [];

        for (const file of questionFiles) {
            try {
                const response = await fetch(`data/${file}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const markdown = await response.text();
                const parsed = this.parseQuestionMD(markdown);
                if (parsed) {
                    this.questions.push(parsed);
                }
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
                loadErrors.push(file);
            }
        }

        // Update total count
        document.getElementById('totalNum').textContent = this.questions.length;
        this.renderQuestionDots();

        // Show error if no questions loaded
        if (this.questions.length === 0) {
            this.showLoadError(loadErrors);
        }
    }

    // Show error when questions fail to load
    showLoadError(failedFiles) {
        const errorHtml = `
            <div class="card" style="background: #fee; border-color: #c00; color: #900;">
                <h2>⚠️ 질문을 불러올 수 없습니다</h2>
                <p>질문 파일을 로드하는 데 실패했습니다. 네트워크 연결을 확인하거나 페이지를 새로고침 해주세요.</p>
                <p style="font-size: 0.85em; margin-top: 1em;">
                    <strong>디버깅 정보:</strong><br>
                    현재 URL: ${window.location.href}<br>
                    실패한 파일: ${failedFiles.join(', ') || 'config.json'}
                </p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1em;">새로고침</button>
            </div>
        `;

        // Show in mock tab
        document.getElementById('mockStart').innerHTML = errorHtml;

        // Show in practice tab
        document.querySelector('#practice .question-card').innerHTML = errorHtml;
    }

    // Parse question markdown file
    parseQuestionMD(markdown) {
        const result = {
            id: 0,
            category: '',
            question: '',
            answer: '',
            keywords: []
        };

        // Parse frontmatter
        const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const idMatch = frontmatter.match(/id:\s*(\d+)/);
            const categoryMatch = frontmatter.match(/category:\s*(.+)/);

            if (idMatch) result.id = parseInt(idMatch[1]);
            if (categoryMatch) result.category = categoryMatch[1].trim();
        }

        // Parse sections
        const content = markdown.replace(/^---\n[\s\S]*?\n---\n*/, '');

        // Extract Question
        const questionMatch = content.match(/# Question\n+([\s\S]*?)(?=\n# |$)/);
        if (questionMatch) {
            result.question = questionMatch[1].trim();
        }

        // Extract Answer
        const answerMatch = content.match(/# Answer\n+([\s\S]*?)(?=\n# |$)/);
        if (answerMatch) {
            result.answer = answerMatch[1].trim();
        }

        // Extract Keywords
        const keywordsMatch = content.match(/# Keywords\n+([\s\S]*?)(?=\n# |$)/);
        if (keywordsMatch) {
            const keywordsText = keywordsMatch[1];
            const keywords = keywordsText.match(/-\s*(.+)/g);
            if (keywords) {
                result.keywords = keywords.map(k => k.replace(/^-\s*/, '').trim());
            }
        }

        return result;
    }

    // Load tips markdown
    async loadTips() {
        try {
            const response = await fetch(`data/${this.config.tips}`);
            const markdown = await response.text();
            const html = marked.parse(markdown);
            document.getElementById('tipsContent').innerHTML = html;
        } catch (error) {
            console.error('Failed to load tips:', error);
            document.getElementById('tipsContent').innerHTML = '<p>Failed to load tips.</p>';
        }
    }

    // Load progress from localStorage
    loadProgress() {
        try {
            const saved = localStorage.getItem('interviewProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.userAnswers = data.userAnswers || {};
                this.viewedAnswers = new Set(data.viewedAnswers || []);
                this.currentIndex = data.currentIndex || 0;
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    // Save progress to localStorage
    saveProgress() {
        try {
            const data = {
                userAnswers: this.userAnswers,
                viewedAnswers: Array.from(this.viewedAnswers),
                currentIndex: this.currentIndex
            };
            localStorage.setItem('interviewProgress', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Question navigation
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.goToQuestion(this.currentIndex - 1);
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.goToQuestion(this.currentIndex + 1);
        });

        // Answer actions
        document.getElementById('saveAnswerBtn').addEventListener('click', () => {
            this.saveAnswer();
        });

        document.getElementById('showAnswerBtn').addEventListener('click', () => {
            this.toggleModelAnswer();
        });

        // Auto-save on textarea change
        document.getElementById('userAnswer').addEventListener('input', () => {
            this.autoSave();
        });

        // Mock interview controls
        document.getElementById('startMockBtn').addEventListener('click', () => {
            this.startMockInterview();
        });

        document.getElementById('pauseMockBtn').addEventListener('click', () => {
            this.togglePauseMock();
        });

        document.getElementById('skipMockBtn').addEventListener('click', () => {
            this.skipToNextPhase();
        });

        document.getElementById('stopMockBtn').addEventListener('click', () => {
            this.stopMockInterview();
        });

        document.getElementById('restartMockBtn').addEventListener('click', () => {
            this.showMockStart();
        });

        document.getElementById('reviewAnswersBtn').addEventListener('click', () => {
            this.switchTab('practice');
        });

        // Overview controls
        document.getElementById('expandAllBtn').addEventListener('click', () => {
            this.expandAllOverview();
        });

        document.getElementById('collapseAllBtn').addEventListener('click', () => {
            this.collapseAllOverview();
        });
    }

    // Switch tabs
    switchTab(tabName) {
        // Stop mock interview if switching away
        if (tabName !== 'mock' && this.mockState.isRunning) {
            this.stopMockInterview();
        }

        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Render overview if switching to overview tab
        if (tabName === 'overview') {
            this.renderOverview();
        }
    }

    // Render question dots
    renderQuestionDots() {
        const container = document.getElementById('questionDots');
        container.innerHTML = '';

        this.questions.forEach((q, index) => {
            const dot = document.createElement('button');
            dot.className = 'question-dot';
            dot.textContent = index + 1;

            if (index === this.currentIndex) {
                dot.classList.add('active');
            }

            if (this.userAnswers[q.id]) {
                dot.classList.add('answered');
            }

            dot.addEventListener('click', () => {
                this.goToQuestion(index);
            });

            container.appendChild(dot);
        });
    }

    // Go to specific question
    goToQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;

        this.currentIndex = index;
        this.renderQuestion();
        this.saveProgress();
    }

    // Render current question
    renderQuestion() {
        const question = this.questions[this.currentIndex];
        if (!question) return;

        // Update counter
        document.getElementById('currentNum').textContent = this.currentIndex + 1;

        // Update category badge
        document.getElementById('categoryBadge').textContent = question.category;

        // Update question text
        document.getElementById('questionText').textContent = question.question;

        // Update user answer
        const textarea = document.getElementById('userAnswer');
        textarea.value = this.userAnswers[question.id] || '';

        // Hide model answer by default
        const modelAnswerSection = document.getElementById('modelAnswer');
        modelAnswerSection.classList.add('hidden');
        document.getElementById('showAnswerBtn').textContent = '모범 답안 보기';

        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentIndex === 0;
        document.getElementById('nextBtn').disabled = this.currentIndex === this.questions.length - 1;

        // Update dots
        this.renderQuestionDots();
    }

    // Toggle model answer visibility
    toggleModelAnswer() {
        const question = this.questions[this.currentIndex];
        const modelAnswerSection = document.getElementById('modelAnswer');
        const showBtn = document.getElementById('showAnswerBtn');

        if (modelAnswerSection.classList.contains('hidden')) {
            // Show answer
            modelAnswerSection.classList.remove('hidden');
            showBtn.textContent = '모범 답안 숨기기';

            // Render answer
            document.getElementById('modelAnswerText').innerHTML = marked.parse(question.answer);

            // Render keywords
            const keywordsContainer = document.getElementById('keywords');
            keywordsContainer.innerHTML = question.keywords
                .map(k => `<span class="keyword-tag">${k}</span>`)
                .join('');

            // Mark as viewed
            this.viewedAnswers.add(question.id);
            this.saveProgress();
            this.updateProgress();
        } else {
            // Hide answer
            modelAnswerSection.classList.add('hidden');
            showBtn.textContent = '모범 답안 보기';
        }
    }

    // Save current answer
    saveAnswer() {
        const question = this.questions[this.currentIndex];
        const textarea = document.getElementById('userAnswer');
        const answer = textarea.value.trim();

        if (answer) {
            this.userAnswers[question.id] = answer;
            this.saveProgress();
            this.updateProgress();
            this.renderQuestionDots();

            // Visual feedback
            const btn = document.getElementById('saveAnswerBtn');
            const originalText = btn.textContent;
            btn.textContent = '저장됨!';
            btn.style.background = 'var(--success-color)';
            btn.style.color = 'white';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
            }, 1500);
        }
    }

    // Auto-save with debounce
    autoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const question = this.questions[this.currentIndex];
            const textarea = document.getElementById('userAnswer');
            const answer = textarea.value.trim();

            if (answer) {
                this.userAnswers[question.id] = answer;
                this.saveProgress();
                this.updateProgress();
                this.renderQuestionDots();
            }
        }, 1000);
    }

    // Update progress (for internal tracking)
    updateProgress() {
        // Progress tracking is maintained for answer saving
    }

    // ==================== Overview Methods ====================

    // Render overview list
    renderOverview() {
        const container = document.getElementById('overviewList');
        container.innerHTML = '';

        this.questions.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'overview-item';
            item.innerHTML = `
                <div class="overview-header" data-index="${index}">
                    <span class="overview-number">${index + 1}</span>
                    <span class="overview-question">${q.question}</span>
                    <span class="overview-toggle">▼</span>
                </div>
                <div class="overview-content">
                    <div class="overview-category">${q.category}</div>
                    <div class="overview-answer">
                        <div class="overview-answer-label">Model Answer</div>
                        <div class="overview-answer-text">${q.answer.replace(/^"|"$/g, '')}</div>
                    </div>
                    <div class="overview-keywords">
                        ${q.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                    </div>
                </div>
            `;

            // Toggle expand/collapse on header click
            const header = item.querySelector('.overview-header');
            header.addEventListener('click', () => {
                item.classList.toggle('expanded');
            });

            container.appendChild(item);
        });
    }

    // Expand all overview items
    expandAllOverview() {
        document.querySelectorAll('.overview-item').forEach(item => {
            item.classList.add('expanded');
        });
    }

    // Collapse all overview items
    collapseAllOverview() {
        document.querySelectorAll('.overview-item').forEach(item => {
            item.classList.remove('expanded');
        });
    }

    // ==================== Mock Interview Methods ====================

    // Start mock interview
    startMockInterview() {
        // Get settings from inputs
        this.mockState.settings.readTime = parseInt(document.getElementById('readTime').value) || 15;
        this.mockState.settings.answerTime = parseInt(document.getElementById('answerTime').value) || 30;
        this.mockState.settings.reviewTime = parseInt(document.getElementById('reviewTime').value) || 20;
        this.mockState.settings.questionCount = parseInt(document.getElementById('questionCount').value) || 10;

        // Select questions (shuffle and pick)
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        this.mockState.selectedQuestions = shuffled.slice(0, this.mockState.settings.questionCount);

        // Reset state
        this.mockState.isRunning = true;
        this.mockState.isPaused = false;
        this.mockState.currentQuestionIndex = 0;
        this.mockState.currentPhase = 'read';
        this.mockState.mockAnswers = {};
        this.mockState.startTime = Date.now();
        this.mockState.totalTime = 0;

        // Update UI
        document.getElementById('mockStart').classList.add('hidden');
        document.getElementById('mockInProgress').classList.remove('hidden');
        document.getElementById('mockComplete').classList.add('hidden');

        document.getElementById('mockTotalNum').textContent = this.mockState.selectedQuestions.length;

        // Start first question
        this.renderMockQuestion();
        this.startPhase('read');
    }

    // Render current mock question
    renderMockQuestion() {
        const question = this.mockState.selectedQuestions[this.mockState.currentQuestionIndex];
        if (!question) return;

        document.getElementById('mockCurrentNum').textContent = this.mockState.currentQuestionIndex + 1;
        document.getElementById('mockCategoryBadge').textContent = question.category;
        document.getElementById('mockQuestionText').textContent = question.question;

        // Clear previous answer
        document.getElementById('mockUserAnswer').value = this.mockState.mockAnswers[question.id] || '';
    }

    // Start a phase (read, answer, or review)
    startPhase(phase) {
        this.mockState.currentPhase = phase;

        const question = this.mockState.selectedQuestions[this.mockState.currentQuestionIndex];
        const questionCard = document.querySelector('.mock-question-card');

        // Update phase indicators
        document.getElementById('phaseRead').classList.toggle('active', phase === 'read');
        document.getElementById('phaseAnswer').classList.toggle('active', phase === 'answer');
        document.getElementById('phaseReview').classList.toggle('active', phase === 'review');

        // Update question card styling
        questionCard.classList.remove('reading', 'answering');
        if (phase === 'read') {
            questionCard.classList.add('reading');
        } else if (phase === 'answer') {
            questionCard.classList.add('answering');
        }

        // Show/hide sections based on phase
        const answerSection = document.getElementById('mockAnswerSection');
        const modelAnswerSection = document.getElementById('mockModelAnswer');

        if (phase === 'read') {
            answerSection.classList.add('hidden');
            modelAnswerSection.classList.add('hidden');
            this.mockState.timeRemaining = this.mockState.settings.readTime;
            document.getElementById('timerLabel').textContent = '질문 읽기';
        } else if (phase === 'answer') {
            answerSection.classList.remove('hidden');
            modelAnswerSection.classList.add('hidden');
            this.mockState.timeRemaining = this.mockState.settings.answerTime;
            document.getElementById('timerLabel').textContent = '답변 시간';
            // Focus on textarea
            document.getElementById('mockUserAnswer').focus();
        } else if (phase === 'review') {
            // Save answer before showing review
            const answer = document.getElementById('mockUserAnswer').value.trim();
            if (answer) {
                this.mockState.mockAnswers[question.id] = answer;
            }

            answerSection.classList.add('hidden');
            modelAnswerSection.classList.remove('hidden');
            this.mockState.timeRemaining = this.mockState.settings.reviewTime;
            document.getElementById('timerLabel').textContent = '모범 답안';

            // Render model answer
            document.getElementById('mockModelAnswerText').innerHTML = marked.parse(question.answer);
            document.getElementById('mockKeywords').innerHTML = question.keywords
                .map(k => `<span class="keyword-tag">${k}</span>`)
                .join('');
        }

        // Start timer
        this.updateTimerDisplay();
        this.startTimer();
    }

    // Update timer display
    updateTimerDisplay() {
        const seconds = this.mockState.timeRemaining;
        const totalSeconds = this.mockState.currentPhase === 'read'
            ? this.mockState.settings.readTime
            : this.mockState.currentPhase === 'answer'
                ? this.mockState.settings.answerTime
                : this.mockState.settings.reviewTime;

        // Update text
        document.getElementById('timerSeconds').textContent = seconds;

        // Update circle progress
        const progress = document.getElementById('timerProgress');
        const circumference = 283; // 2 * PI * 45
        const offset = circumference * (1 - seconds / totalSeconds);
        progress.style.strokeDashoffset = offset;

        // Update colors based on time remaining
        const timerSeconds = document.getElementById('timerSeconds');
        progress.classList.remove('warning', 'danger');
        timerSeconds.classList.remove('warning', 'danger');

        if (seconds <= 5) {
            progress.classList.add('danger');
            timerSeconds.classList.add('danger');
        } else if (seconds <= 10) {
            progress.classList.add('warning');
            timerSeconds.classList.add('warning');
        }
    }

    // Start the countdown timer
    startTimer() {
        // Clear any existing timer
        if (this.mockState.timer) {
            clearInterval(this.mockState.timer);
        }

        this.mockState.timer = setInterval(() => {
            if (this.mockState.isPaused) return;

            this.mockState.timeRemaining--;
            this.updateTimerDisplay();

            // Play pulse animation at low time
            if (this.mockState.timeRemaining <= 5 && this.mockState.timeRemaining > 0) {
                const timerCircle = document.querySelector('.timer-circle-compact');
                timerCircle.classList.remove('pulse');
                void timerCircle.offsetWidth; // Trigger reflow
                timerCircle.classList.add('pulse');
            }

            if (this.mockState.timeRemaining <= 0) {
                this.onPhaseComplete();
            }
        }, 1000);
    }

    // Called when a phase timer completes
    onPhaseComplete() {
        clearInterval(this.mockState.timer);

        if (this.mockState.currentPhase === 'read') {
            this.startPhase('answer');
        } else if (this.mockState.currentPhase === 'answer') {
            this.startPhase('review');
        } else if (this.mockState.currentPhase === 'review') {
            // Move to next question or complete
            if (this.mockState.currentQuestionIndex < this.mockState.selectedQuestions.length - 1) {
                this.mockState.currentQuestionIndex++;
                this.renderMockQuestion();
                this.startPhase('read');
            } else {
                this.completeMockInterview();
            }
        }
    }

    // Skip to next phase
    skipToNextPhase() {
        if (!this.mockState.isRunning) return;

        // Save answer if in answer phase
        if (this.mockState.currentPhase === 'answer') {
            const question = this.mockState.selectedQuestions[this.mockState.currentQuestionIndex];
            const answer = document.getElementById('mockUserAnswer').value.trim();
            if (answer) {
                this.mockState.mockAnswers[question.id] = answer;
            }
        }

        this.mockState.timeRemaining = 0;
        this.onPhaseComplete();
    }

    // Toggle pause
    togglePauseMock() {
        if (!this.mockState.isRunning) return;

        this.mockState.isPaused = !this.mockState.isPaused;

        const pauseBtn = document.getElementById('pauseMockBtn');
        if (this.mockState.isPaused) {
            pauseBtn.textContent = '계속하기';
            pauseBtn.classList.add('btn-primary');
            pauseBtn.classList.remove('btn-secondary');
        } else {
            pauseBtn.textContent = '일시정지';
            pauseBtn.classList.remove('btn-primary');
            pauseBtn.classList.add('btn-secondary');
        }
    }

    // Stop mock interview
    stopMockInterview() {
        if (!this.mockState.isRunning) return;

        if (confirm('모의 면접을 중단하시겠습니까?')) {
            clearInterval(this.mockState.timer);
            this.mockState.isRunning = false;
            this.mockState.isPaused = false;

            // Calculate total time
            this.mockState.totalTime = Math.floor((Date.now() - this.mockState.startTime) / 1000);

            this.showMockComplete();
        }
    }

    // Complete mock interview
    completeMockInterview() {
        clearInterval(this.mockState.timer);
        this.mockState.isRunning = false;

        // Calculate total time
        this.mockState.totalTime = Math.floor((Date.now() - this.mockState.startTime) / 1000);

        this.showMockComplete();
    }

    // Show mock complete screen
    showMockComplete() {
        document.getElementById('mockStart').classList.add('hidden');
        document.getElementById('mockInProgress').classList.add('hidden');
        document.getElementById('mockComplete').classList.remove('hidden');

        // Update stats
        document.getElementById('completedQuestions').textContent =
            this.mockState.currentQuestionIndex + 1;

        const minutes = Math.floor(this.mockState.totalTime / 60);
        const seconds = this.mockState.totalTime % 60;
        document.getElementById('totalTime').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Save mock answers to main progress
        Object.entries(this.mockState.mockAnswers).forEach(([id, answer]) => {
            this.userAnswers[id] = answer;
        });
        this.saveProgress();
        this.updateProgress();

        // Reset pause button
        const pauseBtn = document.getElementById('pauseMockBtn');
        pauseBtn.textContent = '일시정지';
        pauseBtn.classList.remove('btn-primary');
        pauseBtn.classList.add('btn-secondary');
    }

    // Show mock start screen
    showMockStart() {
        document.getElementById('mockStart').classList.remove('hidden');
        document.getElementById('mockInProgress').classList.add('hidden');
        document.getElementById('mockComplete').classList.add('hidden');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new InterviewApp();
});
