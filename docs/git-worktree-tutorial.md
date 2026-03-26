# Git Worktree 实战教程

> 一个 Issue 一个 Worktree，并行开发不求人

---

## 📚 目录

1. [什么是 Git Worktree](#什么是-git-worktree)
2. [为什么使用 Worktree](#为什么使用-worktree)
3. [基础命令](#基础命令)
4. [实际使用场景](#实际使用场景)
5. [与 Typeless-AI 项目结合](#与-typeless-ai-项目结合)
6. [常见问题](#常见问题)
7. [最佳实践](#最佳实践)

---

## 什么是 Git Worktree

**Git Worktree** 允许你在**同一个仓库的不同目录**中同时检出多个分支。

### 传统方式 vs Worktree

```
❌ 传统方式（单目录）:
   Typeless-AI/ (main)
   ├── git checkout feature/1  ← 切换分支
   ├── git stash             ← 暂存代码
   ├── git checkout feature/2 ← 切换到另一个分支
   └── git stash pop         ← 恢复代码
   （容易混乱，经常忘记当前状态）

✅ Worktree 方式（多目录）:
   Typeless-AI/  (main)      ← 主仓库
   wt-1/        (feature/1)  ← Issue #1 开发
   wt-2/        (feature/2)  ← Issue #2 开发
   wt-7/        (feature/7)  ← Issue #7 开发
   （完全隔离，互不影响）
```

---

## 为什么使用 Worktree

### ✅ 优势

1. **并行开发**：同时处理多个 Issue，无需切换分支
2. **上下文隔离**：每个 Issue 有独立目录，不会混淆
3. **零切换成本**：不需要 `git stash`、`git checkout`
4. **安全**：每个 worktree 独立，误操作不会影响其他分支
5. **CI/CD 友好**：可以同时在多个分支运行测试

### 🎯 适用场景

- 同时开发多个功能
- 需要参考其他分支的代码
- Code Review 时测试多个 PR
- 长时间运行的任务（如热重载开发）

---

## 基础命令

### 1️⃣ 查看 Worktree 列表

```bash
# 查看所有 worktree
git worktree list

# 输出示例：
# /mnt/d/GitHub/Typeless-AI    0175711 [main]
# /mnt/d/GitHub/wt-1           0175711 [feature/1-project-init]
# /mnt/d/GitHub/wt-7           0175711 [feature/7-hotkey-research]
```

### 2️⃣ 创建新 Worktree

```bash
# 基本语法
git worktree add <路径> -b <分支名>

# 示例 1：为 Issue #1 创建 worktree
git worktree add ../wt-1 -b feature/1-project-init

# 示例 2：基于现有分支创建 worktree
git worktree add ../wt-hotfix origin/hotfix-fix

# 示例 3：创建临时 worktree（不创建新分支）
git worktree add ../wt-temp HEAD~1  # 检出历史版本
```

### 3️⃣ 删除 Worktree

```bash
# 方法 1：安全删除（推荐）
git worktree remove ../wt-1

# 方法 2：手动删除后清理
rm -rf ../wt-1
git worktree prune  # 清理无效记录

# 方法 3：删除所有 worktree
git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}
```

### 4️⃣ 移动 Worktree

```bash
# 将 worktree 移动到新位置
git worktree move ../wt-1 ../wt-1-new
```

### 5️⃣ 清理无效 Worktree

```bash
# 清理已删除的 worktree 记录
git worktree prune

# 查看无效的 worktree
git worktree list --porcelain | grep "^worktree" | while read -r _ path; do
    if [ ! -d "$path" ]; then
        echo "无效: $path"
    fi
done
```

---

## 实际使用场景

### 🎯 场景 1：同时开发多个 Issue

```bash
# 1. 在主仓库拉取最新代码
cd ~/GitHub/Typeless-AI
git pull --rebase

# 2. 为 Issue #1 创建 worktree
./new-worktree.sh 1

# 3. 为 Issue #7 创建 worktree（并行开发）
./new-worktree.sh 7

# 4. 同时在两个终端中开发
# 终端 1：
cd ~/GitHub/wt-1
# 开发热键功能...

# 终端 2：
cd ~/GitHub/wt-7
# 开发录音功能...
```

### 🎯 场景 2：紧急 Bug 修复

```bash
# 当前在 wt-1 开发 Issue #1，突然需要修复紧急 bug

# 1. 为 hotfix 创建临时 worktree
cd ~/GitHub/Typeless-AI
git worktree add ../wt-hotfix -b hotfix/critical-bug

# 2. 快速修复 bug
cd ../wt-hotfix
# 修复代码...
git add .
git commit -m "fix: 修复关键 bug"
git push origin hotfix/critical-bug

# 3. 创建 PR 合并后删除 worktree
gh pr create --title "hotfix: 修复关键 bug"
git worktree remove ../wt-hotfix

# 4. 回到 wt-1 继续开发
cd ../wt-1
# 之前的代码状态完好无损 ✅
```

### 🎯 场景 3：Code Review 多个 PR

```bash
# 1. 为每个 PR 创建 worktree
gh pr list --limit 5 --json number,title --jq '.[] | "#\(.number): \(.title)"' | while read -r pr; do
    number=$(echo $pr | grep -oP '#\K[0-9]+')
    git worktree add ../wt-pr-$number origin/pr/$number
done

# 2. 在不同的 worktree 中测试每个 PR
cd ../wt-pr-123
npm test

cd ../wt-pr-124
npm test

# 3. 测试完成后删除
git worktree list | grep wt-pr | awk '{print $1}' | xargs -I {} git worktree remove {}
```

### 🎯 场景 4：参考其他分支代码

```bash
# 在 wt-1 开发时，需要参考 main 分支的代码

# 1. main 分支本身就是 worktree（主仓库）
cd ~/GitHub/Typeless-AI  # main 分支

# 2. 在另一个终端查看 wt-1
cd ~/GitHub/wt-1

# 3. 在编辑器中同时打开两个目录
# VS Code: code --add ~/GitHub/Typeless-AI --add ~/GitHub/wt-1
```

---

## 与 Typeless-AI 项目结合

### 🚀 完整开发流程

#### 1️⃣ 初始化项目结构

```bash
# 主仓库（只读，用于同步代码）
cd ~/GitHub/Typeless-AI
git pull --rebase

# 为 Issue #1 创建 worktree
./new-worktree.sh 1
```

#### 2️⃣ 在 worktree 中开发

```bash
cd ~/GitHub/wt-1

# 查看任务详情
gh issue view 1

# 开始开发...
# npm install
# npm run dev
# 写代码...
```

#### 3️⃣ 提交代码

```bash
cd ~/GitHub/wt-1

git add .
git commit -m "feat: 初始化 Electron + React + TypeScript 项目结构

- 搭建项目基础架构
- 配置 TypeScript
- 添加 ESLint 和 Prettier
- 实现热重载开发模式

Closes #1"
```

#### 4️⃣ 推送并创建 PR

```bash
# 推送到远程
git push -u origin feature/1-project-init

# 创建 PR
gh pr create \
  --title "feat(project): 初始化 Electron + React + TypeScript 项目结构" \
  --body "## 完成内容
- ✅ 搭建项目基础架构
- ✅ 配置 TypeScript
- ✅ 添加 ESLint 和 Prettier
- ✅ 实现热重载开发模式

Closes #1"

# PR 会自动链接到 Issue #1
```

#### 5️⃣ PR 合并后清理

```bash
# 等待 PR 合并后...

# 1. 删除本地分支
cd ~/GitHub/Typeless-AI
git branch -d feature/1-project-init

# 2. 删除 worktree
git worktree remove ~/GitHub/wt-1

# 3. 主仓库拉取最新代码
git pull --rebase

# 4. 继续下一个 Issue
./new-worktree.sh 2
```

---

## 常见问题

### ❓ Q1: Worktree 和 Submodule 有什么区别？

```
Worktree:
  - 同一个仓库的多个分支
  - 共享 .git 目录
  - 适合并行开发不同分支

Submodule:
  - 嵌入其他独立仓库
  - 有独立的 .git 目录
  - 适合管理第三方依赖
```

### ❓ Q2: Worktree 会占用双倍空间吗？

```bash
# 查看实际占用
du -sh ~/GitHub/Typeless-AI  # 主仓库
du -sh ~/GitHub/wt-1         # worktree

# Worktree 只包含工作文件，不包含 .git
# 所以每个 worktree 只占用几十 MB（代码文件）
# .git 目录只在主仓库，共享所有历史记录
```

**实际空间占用：**
```
Typeless-AI/  (main)  100 MB  ← 包含 .git 目录
wt-1/                  50 MB  ← 只有工作文件
wt-2/                  50 MB  ← 只有工作文件
总计:                  200 MB
```

如果用传统方式（克隆多次）：300+ MB（每个都有完整 .git）

### ❓ Q3: 如何在多个 worktree 之间共享依赖？

```bash
# 方案 1：使用符号链接（推荐）
cd ~/GitHub/wt-1
ln -s ../Typeless-AI/node_modules node_modules

# 方案 2：使用 pnpm workspace（现代方案）
# 在主仓库创建 pnpm-workspace.yaml
echo "packages:
  - 'wt-*'" > pnpm-workspace.yaml

# 方案 3：使用 npm link
cd ~/GitHub/Typeless-AI
npm link

cd ~/GitHub/wt-1
npm link typeless-ai
```

### ❓ Q4: Worktree 中修改了文件怎么办？

```bash
# 在 wt-1 中修改了文件，但忘记提交
cd ~/GitHub/wt-1
echo "新代码" > app.js

# 切换到主仓库
cd ~/GitHub/Typeless-AI

# 主仓库的 app.js 不会受到影响 ✅
# Worktree 完全隔离

# 如果需要同步更改
cd ~/GitHub/wt-1
git add .
git commit -m "feat: 添加新功能"
```

### ❓ Q5: 如何批量管理 worktree？

```bash
# 查看所有 worktree
git worktree list

# 批量删除所有 worktree
git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}

# 批量创建 worktree（为 Issue #1-#10）
for i in {1..10}; do
    ./new-worktree.sh $i
done

# 批量推送所有分支
for wt in ~/GitHub/wt-*; do
    cd "$wt"
    git push -u origin $(git branch --show-current)
done
```

---

## 最佳实践

### ✅ Do（推荐做法）

1. **命名规范**
   ```bash
   # Good
   wt-1, wt-7, wt-13

   # Bad
   my-worktree, temp, test-branch
   ```

2. **分支命名**
   ```bash
   # Good
   feature/1-project-init
   feature/7-hotkey-research
   hotfix/critical-bug

   # Bad
   feature-1
   test
   temp
   ```

3. **定期清理**
   ```bash
   # 每周清理已合并的 worktree
   git worktree list | grep feature | while read -r path branch; do
       if gh pr view --json state --jq '.state == "CLOSED"' 2>/dev/null; then
           git worktree remove "$path"
       fi
   done
   ```

4. **使用脚本自动化**
   ```bash
   # 使用提供的 new-worktree.sh 脚本
   ./new-worktree.sh <issue号>
   ```

5. **主仓库保持同步**
   ```bash
   # 每天早上执行
   cd ~/GitHub/Typeless-AI
   git pull --rebase
   ```

### ❌ Don't（避免做法）

1. **不要在主仓库直接开发**
   ```bash
   # Bad
   cd ~/GitHub/Typeless-AI
   git checkout -b feature/new-feature
   # 应该使用 worktree

   # Good
   ./new-worktree.sh 1
   ```

2. **不要在 worktree 中修改 .git**
   ```bash
   # 不要手动修改 .git 文件
   # 使用 git worktree 命令管理
   ```

3. **不要创建过多 worktree**
   ```bash
   # 建议同时不超过 5 个 active worktree
   # 完成 PR 后及时清理
   ```

4. **不要忘记推送分支**
   ```bash
   # 在 worktree 中开发完成后
   git push -u origin $(git branch --show-current)
   # 否则 PR 无法创建
   ```

---

## 🎯 快速参考

### 常用命令速查

```bash
# 查看 worktree
git worktree list

# 创建 worktree
git worktree add <路径> -b <分支名>

# 删除 worktree
git worktree remove <路径>

# 移动 worktree
git worktree move <旧路径> <新路径>

# 清理无效记录
git worktree prune

# 使用脚本（推荐）
./new-worktree.sh <issue号>
```

### 项目目录结构

```
~/GitHub/
├── Typeless-AI/          # 主仓库（main 分支）
│   ├── .git/             # 共享的 git 目录
│   ├── new-worktree.sh   # 创建 worktree 的脚本
│   └── ...
├── wt-1/                 # Issue #1 的 worktree
├── wt-7/                 # Issue #7 的 worktree
└── wt-13/                # Issue #13 的 worktree
```

---

## 📚 进阶阅读

- [Git Worktree 官方文档](https://git-scm.com/docs/git-worktree)
- [Git Worktree 使用场景](https://github.blog/git-tools-git-worktree/)
- [Typeless-AI Project Board](https://github.com/users/1509356426/projects/2)

---

## 🎉 总结

**Git Worktree = 一个 Issue 一个目录**

- ✅ 并行开发多个 Issue
- ✅ 零切换成本
- ✅ 上下文隔离
- ✅ 安全可靠

**开始使用：**
```bash
cd ~/GitHub/Typeless-AI
./new-worktree.sh 1
```

**Happy Coding! 🚀**
