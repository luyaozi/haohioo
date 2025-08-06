# 发票重命名工具 (Invoice Renamer)

一个基于 Vue.js 的智能发票解析和重命名工具，支持批量处理 PDF 发票文件。

## ✨ 功能特性

- 📄 **多格式支持**: 支持 PDF 发票文件解析
- 🏷️ **自动重命名**: 根据发票信息自动生成规范的文件名
- 📊 **批量处理**: 支持同时处理多个发票文件
- 🎯 **双重保障**: Python 解析失败时自动回退到 JavaScript 解析
- 💻 **现代界面**: 基于 Vue 3 + Vite 的响应式 Web 界面

## 🛠️ 技术栈

### 前端
- Vue 3
- Vite
- Element Plus
- PDF.js

### 后端
- Python 3.9+
- Flask
- PyPDF2
- Flask-CORS

## 📦 安装说明

### 方式一：一键安装（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd invoice-renamer

# 运行安装脚本
./install_manual.sh

# 启动服务
./start.sh
```

### 方式二：手动安装

#### 1. 安装 Python 依赖

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install flask==2.3.3
pip install flask-cors==4.0.0
pip install PyPDF2==3.0.1
```

#### 2. 安装前端依赖

```bash
cd ..  # 回到项目根目录
npm install
```

## 🚀 启动服务

### 方式一：使用启动脚本

```bash
./start.sh
```

### 方式二：手动启动

#### 1. 启动 Python 后端

```bash
cd backend
source venv/bin/activate
python app.py
```

后端服务将在 http://localhost:5001 启动

#### 2. 启动前端（新终端窗口）

```bash
npm run dev
```

前端服务将在 http://localhost:3002 启动（如果端口被占用会自动选择其他端口）

## 📖 使用说明

1. **打开应用**: 在浏览器中访问前端地址（通常是 http://localhost:3002）

2. **上传发票**: 
   - 点击"选择文件"按钮
   - 选择一个或多个 PDF 发票文件
   - 系统会自动解析发票信息

3. **查看解析结果**:
   - 基本信息：发票号码、开票日期、购买方、销售方、金额等
   - 解析方法：显示使用的是 Python 还是 JavaScript 解析

4. **设置命名规则**:
   - 自定义文件命名格式
   - 支持使用发票信息作为变量

5. **批量重命名**:
   - 点击"批量重命名"按钮
   - 系统会根据设置的规则重命名所有文件

## 🔧 API 接口

### 健康检查
```
GET /api/health
```

### 发票解析
```
POST /api/parse-invoice
Content-Type: multipart/form-data

参数:
- file: PDF 文件

返回:
{
  "success": true,
  "data": {
    "invoiceNumber": "发票号码",
    "invoiceDate": "开票日期",
    "buyerName": "购买方名称",
    "sellerName": "销售方名称",
    "totalAmount": "价税合计",
    "taxAmount": "税额",
    "parseMethod": "python"
  }
}
```

## 🧪 测试

### 测试后端服务

```bash
python3 test_backend.py
```

### 测试发票解析

```bash
cd backend
source venv/bin/activate
python test_invoices.py
```

## 📁 项目结构

```
invoice-renamer/
├── backend/                 # Python 后端
│   ├── app.py              # Flask 应用主文件
│   ├── requirements.txt    # Python 依赖
│   ├── test_invoices.py    # 发票解析测试
│   └── venv/               # Python 虚拟环境
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── utils/              # 工具函数
│   └── main.js            # 入口文件
├── public/                 # 静态资源
├── test-invoices/          # 测试发票文件
├── install_manual.sh       # 安装脚本
├── start.sh               # 启动脚本
├── test_backend.py        # 后端测试脚本
└── README.md              # 项目说明
```

## 🔍 解析原理

### Python 解析（主要方式）
- 使用 PyPDF2 提取 PDF 文本内容
- 通过正则表达式匹配发票关键字段
- 支持多种发票格式和布局

### JavaScript 解析（备用方式）
- 使用 PDF.js 在浏览器中解析 PDF
- 当 Python 后端不可用时自动启用
- 保证系统的可用性和稳定性

## 🔧 构建和部署

### 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 目录包含所有生产文件，包括：
- 静态资源文件
- PDF.js worker 文件（自动复制）
- 优化后的代码分割文件

### 性能优化

项目已实施多项性能优化：

1. **代码分割 (Code Splitting)**:
   - Vue 核心库单独打包 (~78 kB)
   - Element Plus UI 库分离 (~843 kB)
   - Element Plus 图标库分离 (~173 kB)
   - PDF.js 库单独打包 (~331 kB)
   - 工具库单独打包 (~135 kB)

2. **懒加载 (Lazy Loading)**:
   - 主组件使用动态导入
   - 按需加载，提升首屏加载速度

3. **CSS 代码分割**:
   - 组件样式单独分离
   - 减少首次加载的 CSS 体积

4. **资源优化**:
   - 自动压缩和混淆
   - Gzip 压缩支持
   - 静态资源缓存优化

### 部署说明

1. **PDF.js Worker 配置**: 
   - 生产环境自动使用 CDN 加载 PDF.js worker
   - 包含多重 fallback 策略确保可用性
   - 本地 worker 文件作为最后备选

2. **静态文件服务**: 
   - 确保服务器能正确提供 `pdf.worker.js` 文件
   - 配置正确的 MIME 类型 `application/javascript`

## 🐛 常见问题

### PDF.js Worker 加载失败

**问题**: 部署后出现 "Cannot load script at: pdf.worker.js" 错误

**解决方案**: 
1. 系统已配置多重 fallback 策略
2. 优先使用 CDN (cdnjs.cloudflare.com)
3. 备用 CDN (unpkg.com)
4. 本地 worker 文件
5. 最后回退到主线程运行

**手动修复**:
```bash
# 确保 worker 文件存在
ls dist/pdf.worker.js

# 检查服务器配置
curl -I https://your-domain.com/pdf.worker.js
```

## ⚠️ 注意事项

1. **端口占用**: 如果 5001 端口被占用，请修改 `backend/app.py` 中的端口号

2. **PDF.js 版本兼容性**: 
   - 当前使用 PDF.js 3.11.174
   - 升级版本时需要更新 worker 文件

3. **浏览器兼容性**: 
   - 支持现代浏览器 (Chrome 88+, Firefox 85+, Safari 14+)
   - 需要支持 ES6 模块和 Web Workers
2. **文件格式**: 目前仅支持 PDF 格式的发票文件
3. **解析精度**: 不同格式的发票解析精度可能有差异
4. **网络环境**: Python 依赖安装可能需要良好的网络环境

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License
