# 部署到码云（Gitee）指南

## 方法一：使用 Git 命令

### 1. 在码云创建仓库
1. 访问 https://gitee.com
2. 点击右上角 + → 新建仓库
3. 仓库名：`sanguo-three-match`
4. 初始化时**不要**勾选"使用 README.md 初始化"

### 2. 关联远程仓库
```bash
cd /root/.openclaw/workspace/games/sanguo-three-match

# 添加远程仓库（替换为你的仓库地址）
git remote add origin git@gitee.com:你的用户名/sanguo-three-match.git

# 或者使用 HTTPS
git remote add origin https://gitee.com/你的用户名/sanguo-three-match.git

# 推送代码
git branch -M main
git push -u origin main --force
```

### 3. 启用 Gitee Pages
1. 进入仓库页面
2. 点击 服务 → Gitee Pages
3. 选择分支：main
4. 点击 启动

访问地址：`https://你的用户名.gitee.io/sanguo-three-match/`

---

## 方法二：使用 GitHub 同步

如果已有 GitHub 仓库，可以使用 Gitee 的仓库同步功能：

1. 进入 Gitee → 仓库 → 导入仓库
2. 选择 GitHub
3. 授权并选择仓库
4. 开始导入

---

## 获取 Gitee SSH 密钥

### 生成 SSH 密钥
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 添加公钥到 Gitee
1. 查看公钥：`cat ~/.ssh/id_ed25519.pub`
2. 复制内容
3. Gitee → 设置 → SSH 公钥
4. 粘贴并保存

---

## 注意事项

1. **仓库名称**：必须与代码中的配置一致
2. **分支名称**：推荐使用 main 分支
3. **Pages 服务**：代码推送后需要手动启用
4. **审核**：Gitee Pages 可能需要审核（通常几分钟）

---

## 快速部署脚本

```bash
#!/bin/bash

# 配置
GITEE_USER="你的用户名"
REPO_NAME="sanguo-three-match"

# 进入项目目录
cd /root/.openclaw/workspace/games/$REPO_NAME

# 初始化 git
git init
git add .
git commit -m "Initial commit"

# 关联远程
git remote add origin git@gitee.com:$GITEE_USER/$REPO_NAME.git

# 推送
git branch -M main
git push -u origin main --force

echo "部署完成！访问：https://$GITEE_USER.gitee.io/$REPO_NAME/"
```

---

*创建日期：2026-04-29*
