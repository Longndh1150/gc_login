# backend/Dockerfile

# 1. 軽量な Python イメージを使用
FROM python:3.11-slim

# 2. コンテナ内の作業ディレクトリを設定
WORKDIR /app

# 3. Docker のキャッシュを有効活用するため、先に requirements.txt をコピー
COPY requirements.txt .

# 4. 依存ライブラリをインストール
RUN pip install --no-cache-dir -r requirements.txt

# 5. アプリケーションの全コードをコンテナにコピー
COPY . .

# 6. ポート 8000 を公開
EXPOSE 8000

# 7. サーバー起動コマンド
# ※ host を 0.0.0.0 にすることで、コンテナ外からアクセス可能
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "app.main:app", "--reload"]