import './style.css';
import { auth, db, googleProvider } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { collection, addDoc, getDocs, orderBy, query, Timestamp, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const appDiv = document.getElementById('app');
let currentUser = null;

function render() {
  if (currentUser === undefined) {
    appDiv.innerHTML = `<div id="loading">Đang tải...</div>`;
    return;
  }
  if (!currentUser) renderLogin();
  else renderDashboard();
}

function renderLogin() {
  appDiv.innerHTML = `
    <div class="auth-container glass-panel">
      <h1>Premium Auto-Checker</h1>
      <form id="loginForm">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" class="form-control" required placeholder="admin@example.com">
        </div>
        <div class="form-group">
          <label>Mật khẩu (Tối thiểu 6 ký tự)</label>
          <input type="password" id="password" class="form-control" required placeholder="********">
        </div>
        <div id="errorMsg" class="text-danger text-center"></div>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="submit" class="btn btn-primary">Vào Trạm</button>
          <button type="button" id="registerBtn" class="btn btn-primary" style="background-color: var(--success-color); box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">Tạo Tài Khoản</button>
        </div>
        <button type="button" id="googleBtn" class="btn mt-4" style="background-color: white; color: #333; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20">
          Đăng nhập bằng Google
        </button>
      </form>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = "Đang xử lý...";
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
    } catch (err) {
      document.getElementById('errorMsg').textContent = "Sai email hoặc mật khẩu, hoặc tài khoản không tồn tại!";
      btn.textContent = "Vào Trạm";
    }
  });

  document.getElementById('googleBtn').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      document.getElementById('errorMsg').textContent = "Lỗi Google Sign-in: " + err.message;
    }
  });

  document.getElementById('registerBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('registerBtn');

    if (!email || !password || password.length < 6) {
      errorMsg.textContent = "Vui lòng nhập Email và Mật khẩu (ít nhất 6 ký tự).";
      return;
    }

    btn.textContent = "Đang tạo...";
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      errorMsg.textContent = "Lỗi đăng ký: " + err.message;
      btn.textContent = "Tạo Tài Khoản";
    }
  });
}

function renderDashboard() {
  const isAdmin = currentUser.email === 'lch.ryu2001@gmail.com';

  appDiv.innerHTML = `
    <div class="dashboard-container">
      <div class="header">
        <div>
          <h2>Xin chào, ${currentUser.displayName || currentUser.email.split('@')[0]} 👋</h2>
          <span style="font-size: 0.85rem; color: var(--success-color); font-weight: bold;">
            Vai trò: ${isAdmin ? 'ADMIN' : 'Standard User'}
          </span>
        </div>
        <button id="logoutBtn" class="btn btn-danger" style="width: auto; padding: 0.5rem 1rem;">Đăng xuất</button>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; margin-top: 1rem;">
        
        ${isAdmin ? `
        <!-- Admin zone -->
        <div class="glass-panel">
          <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Nạp Bộ Đề Mới (Kéo & Thả .TXT)</h3>
          
          <div style="margin-bottom: 1rem;">
             <label for="quizNote" style="font-size: 0.9rem; color: var(--text-secondary);">Ghi chú đính kèm (vd: Link giải chi tiết, PDF...)</label>
             <input type="text" id="quizNote" class="form-control" placeholder="Dán link hoặc ghi chú vào đây (tùy chọn)">
          </div>

          <div id="uploadZone" style="border: 2px dashed var(--surface-border); padding: 3rem 1rem; text-align: center; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
            <p>Kéo thả file đáp án (.txt) vào đây<br><span style="font-size: 0.85rem; color: var(--text-secondary)">Số lượng câu tự động đếm (Ví dụ: 10 câu, 200 câu)</span></p>
            <input type="file" id="fileInput" accept=".txt" style="display:none;">
          </div>
          <div id="uploadStatus" class="mt-4 text-center"></div>
        </div>
        ` : ''}

        <!-- Quiz list -->
        <div class="glass-panel">
          <h3 style="margin-bottom: 1rem;">Danh sách Đề thi hiện có</h3>
          <div id="quizList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
             <p class="text-secondary text-center">Đang tải danh sách đề...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

  if (isAdmin) {
    setupDragAndDrop();
  }
  loadQuizzes();
}

function setupDragAndDrop() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--primary-color)';
    zone.style.background = 'rgba(99, 102, 241, 0.1)';
  });

  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--surface-border)';
    zone.style.background = 'transparent';
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.style.borderColor = 'var(--surface-border)';
    zone.style.background = 'transparent';
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
}

async function handleFileUpload(file) {
  if (!file) return;
  const status = document.getElementById('uploadStatus');
  status.innerHTML = `<span style="color: var(--primary-color);">Đang đọc file...</span>`;

  try {
    const text = await file.text();
    const lines = text.split('\n');
    let answers = [];

    lines.forEach((line) => {
      const char = line.trim().toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(char)) {
        answers.push(char);
      }
    });

    if (answers.length === 0) {
      status.innerHTML = `<span class="text-danger">Không tìm thấy đáp án hợp lệ (A, B, C, D) trong file.</span>`;
      return;
    }

    status.innerHTML = `<span style="color: var(--primary-color);">Đang đẩy lên Cloud (${answers.length} câu)...</span>`;

    // Get note if exists
    const noteEl = document.getElementById('quizNote');
    const noteVal = noteEl ? noteEl.value.trim() : '';

    const quizData = {
      title: file.name.replace('.txt', ''),
      answers: answers,
      questionCount: answers.length,
      note: noteVal,
      createdAt: Timestamp.now(),
      createdBy: currentUser.uid
    };

    await addDoc(collection(db, "quizzes"), quizData);
    status.innerHTML = `<span style="color: var(--success-color);">Lưu thành công đề: ${quizData.title}!</span>`;

    if (noteEl) noteEl.value = ''; // Reset note field
    loadQuizzes(); // reload list
  } catch (err) {
    status.innerHTML = `<span class="text-danger">Lỗi: ${err.message}</span>`;
  }
}

async function loadQuizzes() {
  const listDiv = document.getElementById('quizList');
  try {
    const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      listDiv.innerHTML = `<p class="text-secondary text-center" style="grid-column: 1/-1;">Chưa có bộ đề nào trong hệ thống.</p>`;
      return;
    }

    let html = '';
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('vi-VN') : '';
      const hasNote = data.note ? `<div style="font-size: 0.85rem; color: #a5b4fc; margin-bottom: 0.5rem; word-break: break-word;">📌 ${data.note}</div>` : '';

      const adminButtons = (currentUser.email === 'lch.ryu2001@gmail.com') ? `
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.5rem;">
          <button class="btn btn-primary" onclick="window.handleEditQuiz('${doc.id}')" style="background: rgba(255,255,255,0.1); border: 1px solid var(--surface-border); font-size: 0.85rem; padding: 0.5rem; flex: 1;">✏️ Sửa</button>
          <button class="btn btn-danger" onclick="window.handleDeleteQuiz('${doc.id}')" style="font-size: 0.85rem; padding: 0.5rem; flex: 1;">🗑 Xóa</button>
        </div>
      ` : '';

      html += `
        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--surface-border); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="margin-bottom: 0.5rem; color: var(--primary-color);">${data.title}</h4>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
              <span>Số câu: <strong>${data.questionCount}</strong></span>
              <br><span>Ngày nạp: ${date}</span>
            </div>
            ${hasNote}
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button class="btn btn-primary" onclick="window.handleStartQuiz('${doc.id}', '${data.title.replace(/'/g, "\\'")}')" style="font-size: 0.85rem; padding: 0.5rem; flex: 1;">[ Bắt Đầu Chấm ]</button>
            <button class="btn" onclick="window.openComments('${doc.id}', '${data.title.replace(/'/g, "\\'")}')" style="background: rgba(255,255,255,0.1); border: 1px solid var(--surface-border); font-size: 1.2rem; padding: 0.5rem;">💬</button>
          </div>
          ${adminButtons}
        </div>
      `;
    });
    listDiv.innerHTML = html;

  } catch (err) {
    listDiv.innerHTML = `<p class="text-danger text-center">Lỗi tải đề: ${err.message}</p>`;
  }
}

// Init
currentUser = undefined;
render();

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  render();
});

window.handleStartQuiz = (id, title) => {
  renderQuiz(id, title);
};

window.handleDeleteQuiz = async (id) => {
  if (confirm('Bạn có chắc muốn xóa vĩnh viễn bộ đề này?')) {
    try {
      await deleteDoc(doc(db, "quizzes", id));
      renderDashboard(); // reload list
    } catch (e) {
      alert('Lỗi xóa đề: ' + e.message);
    }
  }
};

window.handleEditQuiz = (id) => {
  renderEditQuiz(id);
};

function renderEditQuiz(quizId) {
  appDiv.innerHTML = `<div id="loading">Đang tải data đề...</div>`;

  getDoc(doc(db, "quizzes", quizId)).then((snap) => {
    if (!snap.exists()) return alert('Không tìm thấy đề!');
    const data = snap.data();

    const answersHtml = (data.answers || []).map((ans, idx) => `
      <div style="display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 6px; border: 1px solid var(--surface-border);">
        <span style="color: var(--primary-color); width: 30px; text-align: right; font-weight: bold;">${idx + 1}.</span>
        <input type="text" class="form-control edit-ans-input" value="${ans.toUpperCase()}" maxlength="1" style="width: 40px; text-align: center; font-weight: bold; padding: 5px; text-transform: uppercase;">
      </div>
    `).join('');

    appDiv.innerHTML = `
      <div class="dashboard-container">
        <div class="header" style="border-bottom:none; margin-bottom:0;">
          <h2>✏️ Sửa Bộ Đề</h2>
          <button id="cancelEditBtn" class="btn btn-danger" style="width: auto;">Thoát</button>
        </div>

        <div class="glass-panel" style="margin-top: 2rem;">
          <form id="editQuizForm">
            <div class="form-group">
              <label>Tên Bộ Đề</label>
              <input type="text" id="editTitle" class="form-control" value="${data.title}" required>
            </div>
            <div class="form-group">
              <label>Ghi chú / Link</label>
              <input type="text" id="editNote" class="form-control" value="${data.note || ''}">
            </div>
            <div class="form-group">
              <label>Tinh chỉnh Trực Tiếp (Danh sách ${data.answers.length} câu)</label>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; max-height: 400px; overflow-y: auto; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid var(--surface-border);">
                ${answersHtml}
              </div>
              <small class="text-secondary mt-2" style="display:block;">Gõ lại A, B, C hoặc D. Chữ sẽ tự động bự lên. Tính năng này dùng để sửa lỗi sai sót từng câu (VD: Xoá B gõ C). Nếu muốn sửa lại cả 200 câu, khuyên mày nên Xoá bài này và nạp kéo-thả file gốc lên lại cho lẹ!</small>
            </div>

            <button type="submit" class="btn btn-primary" style="background-color: var(--success-color);">Lưu Lại Ngay</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('cancelEditBtn').onclick = () => renderDashboard();

    document.getElementById('editQuizForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const title = document.getElementById('editTitle').value.trim();
      const note = document.getElementById('editNote').value.trim();
      
      let answers = [];
      let hasError = false;
      
      document.querySelectorAll('.edit-ans-input').forEach(input => {
        const val = input.value.trim().toLowerCase();
        if (['a', 'b', 'c', 'd'].includes(val)) {
          answers.push(val);
        } else {
          hasError = true;
          input.style.borderColor = 'var(--danger-color)';
        }
      });

      if (hasError) return alert('Có ô bị trống hoặc chứa ký tự linh tinh! (chỉ nhận chữ A, B, C, D)');
      if (answers.length === 0) return alert('Chưa có câu nào cả!');

      btn.textContent = "Đang rặn lên DB...";

      try {
        await updateDoc(doc(db, "quizzes", quizId), {
          title: title,
          note: note,
          answers: answers,
          questionCount: answers.length
        });
        alert('Lưu thành công! Đã sửa xong ' + answers.length + ' câu.');
        renderDashboard();
      } catch (err) {
        alert('Lỗi: ' + err.message);
        btn.textContent = "Lưu Lại Ngay";
      }
    });

  }).catch(e => {
    alert('Lỗi: ' + e.message);
    renderDashboard();
  });
}

// ----------------------------------------
// Comments System Logic
// ----------------------------------------
let unsubComments = null;
let currentCommentQuizId = null;

window.openComments = (quizId, title) => {
  currentCommentQuizId = quizId;
  document.getElementById('modalQuizTitle').textContent = '💬 ' + title;
  document.getElementById('commentModal').style.display = 'flex';
  document.getElementById('commentList').innerHTML = '<div style="text-align: center; color: gray;">Đang rà soát bình luận...</div>';
  
  const q = query(collection(db, "quizzes", quizId, "comments"), orderBy("createdAt", "asc"));
  unsubComments = onSnapshot(q, (snapshot) => {
    let html = '';
    snapshot.forEach((snapDoc) => {
      const c = snapDoc.data();
      const timeStr = c.createdAt ? c.createdAt.toDate().toLocaleString('vi-VN') : '';
      const isMine = c.author === currentUser.email;
      html += `
        <div class="comment-bubble" style="${isMine ? 'border-color: var(--primary-color); margin-left: 30px;' : 'margin-right: 30px;'}">
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 4px;">
            <strong>${c.author.split('@')[0]}</strong> • ${timeStr}
          </div>
          <div style="word-break: break-word;">${c.text}</div>
        </div>
      `;
    });
    
    if (html === '') html = '<div style="text-align: center; color: gray; font-size: 0.85rem; flex-grow: 1; align-content: center;">Chưa có bình luận nào. Nổ súng đi!</div>';
    
    const clist = document.getElementById('commentList');
    clist.innerHTML = html;
    clist.scrollTop = clist.scrollHeight; // Auto-scroll to bottom
  });
};

window.closeComments = () => {
  document.getElementById('commentModal').style.display = 'none';
  if (unsubComments) {
    unsubComments();
    unsubComments = null;
  }
  currentCommentQuizId = null;
};

window.sendComment = async () => {
  if (!currentCommentQuizId) return;
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if(!text) return;
  
  input.value = '';
  try {
    await addDoc(collection(db, "quizzes", currentCommentQuizId, "comments"), {
      text: text,
      author: currentUser.email,
      createdAt: Timestamp.now()
    });
  } catch(e) {
    alert("Lỗi gửi cmt: " + e.message);
  }
};

function renderQuiz(quizId, title) {
  appDiv.innerHTML = `<div id="loading">Chuẩn bị phòng thi...</div>`;

  getDoc(doc(db, "quizzes", quizId)).then((snap) => {
    if (!snap.exists()) return alert('Không tìm thấy đề!');
    const quizData = snap.data();
    const total = quizData.questionCount;

    let answers = new Array(total).fill(null);
    let currentIndex = 0;
    let isSubmitted = false;

    // Convert notes with http:// into clickable links
    let formattedNote = '';
    if (quizData.note) {
      if (quizData.note.startsWith('http')) {
        formattedNote = `<p style="margin-top: 1rem; font-size: 0.9rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">📌 Ghi chú/Link: <br><a href="${quizData.note}" target="_blank" style="color: #818cf8;">Bấm vào đây để mở</a></p>`;
      } else {
        formattedNote = `<p style="margin-top: 1rem; font-size: 0.9rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; color: #a5b4fc;">📌 Ghi chú: ${quizData.note}</p>`;
      }
    }

    appDiv.innerHTML = `
      <div class="test-view" style="display: flex; height: 100vh; overflow: hidden; background: var(--bg-gradient);">
        <!-- Sidebar grid -->
        <div class="glass-panel" style="width: 320px; margin: 1rem; flex-shrink: 0; display: flex; flex-direction: column; padding: 1.5rem; overflow-y: auto;">
           <h3 style="margin-bottom: 0.5rem; word-break: break-word; line-height: 1.4;">${title}</h3>
           ${formattedNote}
           
           <p class="desktop-only" style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
             🎯 <strong>Tốc độ bàn phím:</strong><br>Bấm phím A, B, C, D để điền siêu tốc!<br>⬅️ Dùng phím Trái/Phải để chuyển câu!
           </p>
           <hr class="desktop-only" style="margin: 1rem 0; border: 0; border-top: 1px solid var(--surface-border);">
           
           <div id="qGrid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; overflow-y: auto; flex-grow: 1; padding-right: 5px; min-height: 80px;">
             ${Array.from({ length: total }, (_, i) => `<div class="grid-box" id="gb-${i}" onclick="window.goToQ(${i})">${i + 1}</div>`).join('')}
           </div>
           
           <div class="side-action-btns" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
             <button id="submitTest" class="btn btn-primary" style="background-color: var(--success-color);">HOÀN THÀNH (NỘP)</button>
             <button id="backBtn" class="btn btn-danger" style="background: transparent; border: 1px solid var(--danger-color); color: var(--danger-color);">THOÁT</button>
           </div>
        </div>
        
        <!-- Main taking area -->
        <div class="test-area glass-panel" style="flex-grow: 1; margin: 1rem 1rem 1rem 0; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative;">
             <h1 id="qLabel" style="font-size: 5rem; margin-bottom: 2rem; color: var(--primary-color);">Câu ${currentIndex + 1}</h1>
             
             <div class="options-container" style="display: flex; gap: 3rem; font-size: 2.5rem;">
                <div class="opt-btn" id="opt-a" onclick="window.setAnswer('a')">A</div>
                <div class="opt-btn" id="opt-b" onclick="window.setAnswer('b')">B</div>
                <div class="opt-btn" id="opt-c" onclick="window.setAnswer('c')">C</div>
                <div class="opt-btn" id="opt-d" onclick="window.setAnswer('d')">D</div>
             </div>
             
             <div class="mobile-touch-nav" style="margin-top: 2rem; display: flex; gap: 4rem;">
                <button class="touch-nav-btn btn" onclick="window.goPrev()" style="background: rgba(255,255,255,0.05); color: var(--text-color); border: 2px solid var(--surface-border); padding: 15px 30px; font-size: 2rem; border-radius: 12px; transition: all 0.2s;">⬅️</button>
                <button class="touch-nav-btn btn" onclick="window.goNext()" style="background: rgba(255,255,255,0.05); color: var(--text-color); border: 2px solid var(--surface-border); padding: 15px 30px; font-size: 2rem; border-radius: 12px; transition: all 0.2s;">➡️</button>
             </div>
             
             <!-- Overlay Result -->
             <div id="testResult" style="display:none; position: absolute; inset: 0; background: rgba(15,23,42,0.95); z-index: 10; flex-direction: column; align-items: center; justify-content: center; border-radius: 20px;">
                <h1 style="color: var(--success-color); font-size: 4rem; margin-bottom: 1rem;">ĐÃ CHẤM XONG!</h1>
                <h2 id="scoreText" style="font-size: 3rem; margin-bottom: 2rem;"></h2>
                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; text-align: center;">
                   <p style="font-size: 1.2rem; color: var(--text-secondary);">Mày hãy nhìn sang lưới câu hỏi bên tay trái 👇</p>
                   <ul style="list-style: none; display: flex; gap: 2rem; justify-content: center; margin-top: 1rem; color: white;">
                     <li><span style="display:inline-block; width:15px; height:15px; background:var(--success-color); border-radius:3px;"></span> Xanh = Đúng</li>
                     <li><span style="display:inline-block; width:15px; height:15px; background:var(--danger-color); border-radius:3px;"></span> Đỏ = Sai (Hover để xem đáp án đúng)</li>
                   </ul>
                </div>
             </div>
        </div>
      </div>
    `;

    const renderQ = () => {
      document.getElementById('qLabel').textContent = `Câu ${currentIndex + 1}`;
      document.querySelectorAll('.grid-box').forEach(el => el.classList.remove('active'));
      const activeBox = document.getElementById(`gb-${currentIndex}`);
      activeBox.classList.add('active');
      activeBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      document.querySelectorAll('.opt-btn').forEach(el => el.classList.remove('selected'));
      const currentAns = answers[currentIndex];
      if (currentAns) {
        document.getElementById(`opt-${currentAns}`).classList.add('selected');
      }
    };

    window.setAnswer = (char) => {
      if (isSubmitted) return;
      answers[currentIndex] = char;
      const box = document.getElementById(`gb-${currentIndex}`);
      box.classList.add('filled');
      box.textContent = `${currentIndex + 1}: ${char.toUpperCase()}`; // Show letter in box
      if (currentIndex < total - 1) {
        currentIndex++;
      }
      renderQ();
    };

    window.goToQ = (index) => {
      if (isSubmitted) return;
      currentIndex = index;
      renderQ();
    };

    window.goPrev = () => {
       if (isSubmitted) return;
       currentIndex = Math.max(0, currentIndex - 1);
       renderQ();
    };

    window.goNext = () => {
       if (isSubmitted) return;
       currentIndex = Math.min(total - 1, currentIndex + 1);
       renderQ();
    };

    const handleKey = (e) => {
      if (isSubmitted) return;
      const k = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(k)) {
        window.setAnswer(k);
      } else if (k === 'arrowleft') {
        window.goPrev();
      } else if (k === 'arrowright') {
        window.goNext();
      }
    };

    window.addEventListener('keydown', handleKey);

    document.getElementById('backBtn').onclick = () => {
      window.removeEventListener('keydown', handleKey);
      renderDashboard();
    };

    document.getElementById('submitTest').onclick = () => {
      isSubmitted = true;
      window.removeEventListener('keydown', handleKey);
      let correct = 0;

      answers.forEach((ans, idx) => {
        const isCorrect = ans === quizData.answers[idx];
        const box = document.getElementById(`gb-${idx}`);
        if (isCorrect) {
          correct++;
          box.style.background = 'var(--success-color)';
          box.style.color = 'white';
          box.style.borderColor = 'var(--success-color)';
        } else {
          box.style.background = 'var(--danger-color)';
          box.style.color = 'white';
          box.style.borderColor = 'var(--danger-color)';
          box.title = `Sai! Chọn: ${(ans || '').toUpperCase() || 'Trống'} - Đúng: ${quizData.answers[idx].toUpperCase()}`;
        }
      });

      document.getElementById('testResult').style.display = 'flex';
      document.getElementById('scoreText').textContent = `Mày đúng ${correct} / ${total} câu`;
      document.getElementById('submitTest').style.display = 'none'; // hide submit
    };

    renderQ();
  }).catch(e => {
    console.error(e);
    appDiv.innerHTML = `<div class="text-danger">Lỗi tải đề: ${e.message}</div>`;
  });
}
