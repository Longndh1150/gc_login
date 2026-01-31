# frontend/Dockerfile

# 1. 軽量な Node.js イメージを使用
FROM node:22-alpine

# 2. 作業ディレクトリを設定
WORKDIR /app

# 3. 依存関係インストール用に package.json を先にコピー
COPY package.json package-lock.json* ./

# 4. 依存ライブラリをインストール
RUN npm install

# 5. フロントエンドの全コードをコンテナにコピー
COPY . .

# 6. Vite のデフォルトポート（5173）を公開
EXPOSE 5173

# 7. 開発サーバー起動コマンド
# ※ --host を指定することで、ホストマシンのブラウザからアクセス可能
CMD ["npm", "run", "dev", "--", "--host"]