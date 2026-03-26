#!/bin/bash
# 一键创建 Git Worktree 开发环境
# 使用方法: ./new-worktree.sh <issue号>

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
    echo -e "${YELLOW}用法: $0 <issue号>${NC}"
    echo "示例: $0 1"
    exit 1
fi

ISSUE=$1
REPO_BASE="$(dirname "$(pwd)")"
WORKTREE_PATH="$REPO_BASE/wt-$ISSUE"
BRANCH_NAME="feature/$ISSUE-$(gh issue view $ISSUE --json title -q '.title' | sed 's/[^a-zA-Z0-9]/-/g' | sed 's/-$//' | head -c 30)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  创建 Issue #$ISSUE 的开发环境${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 确保在主仓库
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}错误: 请在主仓库目录下运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5]${NC} 拉取最新代码..."
git pull --rebase

echo -e "${GREEN}[2/5]${NC} 创建分支: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
git checkout main

echo -e "${GREEN}[3/5]${NC} 创建 worktree: $WORKTREE_PATH"
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${YELLOW}目录已存在，删除旧目录...${NC}"
    rm -rf "$WORKTREE_PATH"
fi

git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"

echo -e "${GREEN}[4/5]${NC} 进入 worktree 目录..."
cd "$WORKTREE_PATH"

echo -e "${GREEN}[5/5]${NC} 显示 Issue 信息..."
gh issue view $ISSUE --json title,body --jq '"Title: " + .title + "\n\n" + .body'

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 开发环境创建完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Worktree 路径: ${GREEN}$WORKTREE_PATH${NC}"
echo -e "分支名称: ${GREEN}$BRANCH_NAME${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo -e "  cd $WORKTREE_PATH"
echo -e "  # 开始开发..."
echo -e "  # 完成后提交 PR"
echo ""
