# 剧本台词标注工具

一个用于标注和评估剧本对话的Web工具。

## 功能

- 📝 **对话标注** - 支持6个评分维度（剧情连贯性、角色一致性、台词自然度、情感表达、游戏相关度、长度合适度）
- 🏷️ **标签系统** - 预设标签：情感冲突、角色成长、伏笔铺垫、幽默、紧张、反转、信息揭示、互动选择
- 🤖 **AI补全** - 支持多种AI API：
  - Ollama（本地）
  - OpenAI（GPT-4o, GPT-4）
  - Claude
  - DeepSeek
  - 通义千问
  - 智谱AI
  - **MiniMax** (abab6.5s-chat, abab6.5-chat)
- 📊 **统计分析** - 自动计算平均分和标签使用统计
- 💾 **数据保存** - 支持JSON导出/导入、localStorage自动保存

## 使用方法

1. 双击 `index.html` 在浏览器中打开
2. 点击"+新增"添加对话
3. 输入角色名和台词
4. 选择评分和标签
5. 点击"保存"
6. 定期点击"导出JSON"备份

## MiniMax API 配置

- **API地址**: `https://api.minimax.chat/v1/text/chatcompletion_v2`
- **认证**: `Bearer {API_KEY}`
- **可用模型**:
  - `abab6.5s-chat`（推荐）
  - `abab6.5-chat`
  - `abab5.5s-chat`

## 技术栈

- 纯 HTML/CSS/JavaScript
- 单文件应用，无需安装
- 离线可用

## License

MIT
