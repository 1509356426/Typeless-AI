# Git Worktree 快速参考卡

> 打印出来贴在显示器旁边 📌

---

## 🚀 日常命令

### 创建 worktree
```bash
cd ~/GitHub/Typeless-AI
./new-worktree.sh <issue号>

# 示例
./new-worktree.sh 1
./new-worktree.sh 7
```

### 查看 worktree
```bash
./worktree-manager.sh status
# 或
git worktree list
```

### 进入 worktree
```bash
cd ~/GitHub/wt-1
# 或使用别名（已配置）
wtcd 1
```

### 删除 worktree
```bash
./worktree-manager.sh rm 1
# 或
git worktree remove ../wt-1
```

---

## 📋 完整工作流

### 开发新 Issue
```bash
# 1. 创建 worktree
cd ~/GitHub/Typeless-AI
./new-worktree.sh 1

# 2. 进入开发
cd ~/GitHub/wt-1
gh issue view 1

# 3. 开发...
git add .
git commit -m "feat: xxx"

# 4. 推送并创建 PR
git push -u origin feature/1-xxx
gh pr create --body "Closes #1"

# 5. PR 合并后清理
cd ~/GitHub/Typeless-AI
./worktree-manager.sh rm 1
```

---

## 🔧 高级命令

### 同步所有 worktree
```bash
./worktree-manager.sh sync
```

### 清理已合并的 worktree
```bash
./worktree-manager.sh clean
```

### 清理无效记录
```bash
./worktree-manager.sh prune
```

---

## 📁 目录结构

```
~/GitHub/
├── Typeless-AI/          # 主仓库（main）
│   ├── new-worktree.sh   # 创建脚本
│   └── worktree-manager.sh # 管理脚本
├── wt-1/                 # Issue #1
├── wt-7/                 # Issue #7
└── wt-13/                # Issue #13
```

---

## ⚠️ 常见问题

### Q: 找不到 worktree？
```bash
git worktree prune  # 清理无效记录
```

### Q: 分支已存在？
```bash
git branch -D feature/1-xxx  # 删除旧分支
./new-worktree.sh 1           # 重新创建
```

### Q: 如何在 Windows 中查看？
```
D:\GitHub\wt-1
```

---

## 🎯 最佳实践

✅ **DO**
- 一个 Issue 一个 worktree
- PR 合并后立即删除 worktree
- 定期运行 `git worktree prune`
- 使用脚本自动化

❌ **DON'T**
- 不要在主仓库直接开发
- 不要创建过多 worktree（< 5 个）
- 不要忘记推送分支
- 不要手动修改 .git 文件

---

## 📞 获取帮助

```bash
./worktree-manager.sh help
# 或查看完整教程
cat docs/git-worktree-tutorial.md
```

---

**Happy Coding! 🚀**
