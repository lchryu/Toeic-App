let correctAnswers = {};
let timerInterval;
let startTime;
let isQuizStarted = false;
let isPracticeMode = true;

async function initializeQuizzes() {
    try {
        const response = await fetch('http://localhost:8000/list-quizzes');
        const quizFiles = await response.json();
        
        const select = document.getElementById('quizSelect');
        
        quizFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            const displayName = file
                .replace('.txt', '')
                .replace(/test\s*số\s*/i, 'Test số ')
                .replace(/test\s*/i, 'Test số ')
                .replace(/(\d+)$/, (match) => match.padStart(2, '0'));
            option.textContent = displayName;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Không thể tải danh sách bộ đề:', error);
    }
}

document.getElementById('quizSelect').addEventListener('change', async function(event) {
    if (event.target.value) {
        try {
            const response = await fetch(`quiz-folder/${event.target.value}`);
            const text = await response.text();
            const lines = text.split('\n');
            correctAnswers = {};
            
            lines.forEach((line, index) => {
                const answer = line.trim().toLowerCase();
                if (answer) {
                    correctAnswers['q' + (index + 1)] = answer;
                }
            });

            generateQuestions(Object.keys(correctAnswers).length);
            
            document.getElementById('uploadStatus').innerHTML = 
                `<span style="color: green;">✓ Đã tải ${Object.keys(correctAnswers).length} câu hỏi</span>`;
            document.getElementById('startBtn').style.display = 'block';
            resetQuiz();
        } catch (error) {
            console.error('Không thể tải bộ đề:', error);
            document.getElementById('uploadStatus').innerHTML = 
                `<span style="color: red;">✗ Lỗi khi tải bộ đề</span>`;
        }
    }
});

window.addEventListener('DOMContentLoaded', initializeQuizzes);

document.getElementById('answerFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split('\n');
            correctAnswers = {};
            
            lines.forEach((line, index) => {
                const answer = line.trim().toLowerCase();
                if (answer) {
                    correctAnswers['q' + (index + 1)] = answer;
                }
            });

            generateQuestions(Object.keys(correctAnswers).length);
            
            document.getElementById('uploadStatus').innerHTML = 
                `<span style="color: green;">✓ Đã tải lên ${Object.keys(correctAnswers).length} đáp án</span>`;
            document.getElementById('startBtn').style.display = 'block';
            resetQuiz();
        };
        reader.readAsText(file);
    }
});

document.querySelectorAll('input[name="quizMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        isPracticeMode = this.value === 'practice';
        
        if (isQuizStarted) {
            const questionCount = Object.keys(correctAnswers).length;
            generateQuestions(questionCount);
            enableQuizInputs(true);
            
            document.getElementById('submitBtn').style.display = 
                isPracticeMode ? 'none' : 'block';
        }
    });
});

document.getElementById('showTimer').addEventListener('change', function() {
    const timer = document.getElementById('timer');
    timer.style.display = this.checked ? 'block' : 'none';
});

function startQuiz() {
    isQuizStarted = true;
    startTime = new Date();
    
    if (document.getElementById('showTimer').checked) {
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('submitBtn').style.display = isPracticeMode ? 'none' : 'block';
    document.getElementById('resetBtn').style.display = 'block';
    document.getElementById('answerFile').disabled = true;
    
    enableQuizInputs(true);
    
    const questionCount = Object.keys(correctAnswers).length;
    generateQuestions(questionCount);
}

function updateTimer() {
    if (!startTime) return;
    
    const now = new Date();
    const diff = now - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('timer').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function generateQuestions(count) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.setAttribute('data-question', `q${i}`);
        questionDiv.innerHTML = `
            <p><strong>Câu ${i}:</strong></p>
            <div class="options">
                <label><input type="radio" name="q${i}" value="a"> A</label>
                <label><input type="radio" name="q${i}" value="b"> B</label>
                <label><input type="radio" name="q${i}" value="c"> C</label>
                <label><input type="radio" name="q${i}" value="d"> D</label>
            </div>
        `;
        container.appendChild(questionDiv);

        if (isPracticeMode) {
            const radios = questionDiv.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (isPracticeMode && isQuizStarted) {
                        checkAnswerImmediate(this);
                    }
                });
            });
        }
    }

    if (!isQuizStarted) {
        enableQuizInputs(false);
    }
}

function checkAnswerImmediate(radio) {
    if (!isPracticeMode || !isQuizStarted) return;
    
    const questionName = radio.name;
    const selectedValue = radio.value;
    const correctAnswer = correctAnswers[questionName];
    const questionDiv = radio.closest('.question');
    
    // Reset classes
    questionDiv.classList.remove('correct-answer', 'wrong-answer');
    questionDiv.querySelectorAll('.options label').forEach(label => {
        label.classList.remove('correct-option', 'wrong-option');
    });

    if (selectedValue === correctAnswer) {
        questionDiv.classList.add('correct-answer');
        radio.parentElement.classList.add('correct-option');
    } else {
        questionDiv.classList.add('wrong-answer');
        radio.parentElement.classList.add('wrong-option');
        // Hiển thị đáp án đúng
        const correctLabel = questionDiv.querySelector(`input[value="${correctAnswer}"]`).parentElement;
        correctLabel.classList.add('correct-option');
    }
}

function enableQuizInputs(enable) {
    const inputs = document.querySelectorAll('.question input[type="radio"]');
    inputs.forEach(input => {
        input.disabled = !enable;
    });
}

function checkAnswers() {
    if (!isQuizStarted) {
        alert('Vui lòng bắt đầu bài thi trước!');
        return;
    }

    document.querySelectorAll('input[name="quizMode"]').forEach(radio => {
        radio.disabled = true;
    });

    clearInterval(timerInterval);
    const endTime = new Date();
    const timeSpent = endTime - startTime;
    const hours = Math.floor(timeSpent / 3600000);
    const minutes = Math.floor((timeSpent % 3600000) / 60000);
    const seconds = Math.floor((timeSpent % 60000) / 1000);

    let score = 0;
    let totalQuestions = Object.keys(correctAnswers).length;
    let resultDiv = document.getElementById('result');
    let incorrectAnswers = [];

    for (let [question, correctAnswer] of Object.entries(correctAnswers)) {
        let selected = document.querySelector(`input[name="${question}"]:checked`);
        if (selected) {
            if (selected.value === correctAnswer) {
                score++;
            } else {
                incorrectAnswers.push({
                    question: question.slice(1),
                    selected: selected.value.toUpperCase(),
                    correct: correctAnswer.toUpperCase()
                });
            }
        } else {
            incorrectAnswers.push({
                question: question.slice(1),
                selected: '(chưa chọn)',
                correct: correctAnswer.toUpperCase()
            });
        }
    }

    let resultHTML = `
        <div class="summary">
            <p class="correct">Kết quả: ${score}/${totalQuestions} câu đúng (${Math.round(score/totalQuestions*100)}%)</p>
            <p>Thời gian làm bài: ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</p>
        </div>`;

    if (incorrectAnswers.length > 0) {
        resultHTML += '<h3>Các câu trả lời sai:</h3>';
        incorrectAnswers.forEach(answer => {
            resultHTML += `
                <p class="incorrect">
                    Câu ${answer.question}: 
                    Bạn chọn ${answer.selected}, 
                    Đáp án đúng: ${answer.correct}
                </p>`;
        });
    }

    resultDiv.innerHTML = resultHTML;
    resultDiv.style.display = 'block';
    
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'block';
    
    enableQuizInputs(false);
}

function resetQuiz() {
    clearInterval(timerInterval);
    startTime = null;
    document.getElementById('timer').textContent = '00:00:00';
    
    document.getElementById('quizForm').reset();
    document.getElementById('result').style.display = 'none';
    
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'none';
    
    document.getElementById('answerFile').disabled = false;
    
    document.querySelectorAll('input[name="quizMode"]').forEach(radio => {
        radio.disabled = false;
    });
    
    enableQuizInputs(false);
    isQuizStarted = false;
    
    const questionCount = Object.keys(correctAnswers).length;
    generateQuestions(questionCount);
}
