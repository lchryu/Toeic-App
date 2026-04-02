from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs

class QuizHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/list-quizzes':
            # Lấy danh sách file từ thư mục quiz-folder
            quiz_files = [f for f in os.listdir('quiz-folder') if f.endswith('.txt')]
            quiz_files.sort()
            
            # Trả về JSON
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(quiz_files).encode())
        else:
            # Xử lý các request khác như bình thường
            super().do_GET()

# Chạy server
server = HTTPServer(('localhost', 8000), QuizHandler)
print("Server đang chạy tại http://localhost:8000")
server.serve_forever() 