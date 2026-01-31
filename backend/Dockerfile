# backend/Dockerfile

# 1. Chọn Python image nhẹ
FROM python:3.11-slim

# 2. Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file requirements trước (để tận dụng cache của Docker)
COPY requirements.txt .

# 4. Cài đặt các thư viện
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy toàn bộ code vào container
COPY . .

# 6. Mở port 8000
EXPOSE 8000

# 7. Lệnh chạy server
# Lưu ý: host 0.0.0.0 để container bên ngoài có thể truy cập được
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "app.main:app", "--reload"]