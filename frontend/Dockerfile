# frontend/Dockerfile

# 1. Chọn Node image nhẹ
FROM node:22-alpine

# 2. Thiết lập thư mục làm việc
WORKDIR /app

# 3. Copy package.json để cài thư viện
COPY package.json package-lock.json* ./

# 4. Cài đặt dependencies
RUN npm install

# 5. Copy toàn bộ code Frontend
COPY . .

# 6. Mở port 5173 (Port mặc định của Vite)
EXPOSE 5173

# 7. Lệnh chạy dev server
# Lưu ý: --host là bắt buộc để truy cập từ trình duyệt máy thật
CMD ["npm", "run", "dev", "--", "--host"]