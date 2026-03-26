#!/bin/bash
# Git Worktree 管理工具
# 使用方法: ./worktree-manager.sh [command]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 显示帮助
show_help() {
    echo -e "${BLUE}Git Worktree 管理工具${NC}"
    echo ""
    echo "用法: $0 [command] [options]"
    echo ""
    echo "命令:"
    echo "  list              列出所有 worktree"
    echo "  add <issue>       为 Issue 创建 worktree"
    echo "  rm <issue>        删除 worktree"
    echo "  prune             清理无效 worktree"
    echo "  sync              同步所有 worktree 到最新 main"
    echo "  clean             清理所有已合并的 worktree"
    echo "  status            显示所有 worktree 的状态"
    echo ""
}

# 列出所有 worktree
list_worktrees() {
    echo -e "${BLUE}所有 Worktree:${NC}"
    echo ""
    git worktree list | while read -r path branch; do
        if [ "$path" = "$(git rev-parse --show-toplevel)" ]; then
            echo -e "${GREEN}★${NC} $path ${YELLOW}(主仓库)${NC}"
        else
            echo -e "  $path $branch"
        fi
    done
}

# 显示 worktree 状态
show_status() {
    echo -e "${BLUE}Worktree 状态:${NC}"
    echo ""

    git worktree list --porcelain | while read -r key value; do
        if [ "$key" = "worktree" ]; then
            path="$value"
            echo -e "${GREEN}▸${NC} $path"
        elif [ "$key" = "branch" ]; then
            branch=$(basename "$value")
            echo -e "  分支: ${BLUE}$branch${NC}"
        fi
    done

    echo ""
    echo -e "${YELLOW}提示: 使用 'git status' 查看具体更改${NC}"
}

# 同步所有 worktree
sync_worktrees() {
    echo -e "${BLUE}同步所有 Worktree 到最新 main...${NC}"
    echo ""

    # 先更新主仓库
    git pull --rebase

    # 更新所有 worktree
    git worktree list | grep -v "main" | while read -r path branch; do
        echo -e "${GREEN}➜${NC} 更新 $path"
        cd "$path"
        git rebase main
    done

    echo ""
    echo -e "${GREEN}✓ 同步完成${NC}"
}

# 清理已合并的 worktree
clean_worktrees() {
    echo -e "${BLUE}清理已合并的 Worktree...${NC}"
    echo ""

    git worktree list | grep -v "main" | while read -r path branch; do
        branch_name=$(echo "$branch" | sed 's/.*\[\(.*\)\]/\1/')

        # 检查分支是否已合并
        if git branch --merged main | grep -q "$branch_name"; then
            echo -e "${YELLOW}删除已合并分支: $branch_name${NC}"
            git worktree remove "$path"
            git branch -d "$branch_name"
        else
            echo -e "${GREEN}保留未合并分支: $branch_name${NC}"
        fi
    done

    echo ""
    echo -e "${GREEN}✓ 清理完成${NC}"
}

# 主逻辑
case "${1:-help}" in
    list)
        list_worktrees
        ;;
    ls)
        list_worktrees
        ;;
    add)
        if [ -z "$2" ]; then
            echo -e "${RED}错误: 请提供 Issue 号${NC}"
            exit 1
        fi
        ./new-worktree.sh "$2"
        ;;
    rm)
        if [ -z "$2" ]; then
            echo -e "${RED}错误: 请提供 Issue 号${NC}"
            exit 1
        fi
        path="../wt-$2"
        if [ -d "$path" ]; then
            git worktree remove "$path"
            echo -e "${GREEN}✓ 已删除 $path${NC}"
        else
            echo -e "${RED}错误: Worktree 不存在${NC}"
            exit 1
        fi
        ;;
    prune)
        git worktree prune
        echo -e "${GREEN}✓ 已清理无效 worktree${NC}"
        ;;
    sync)
        sync_worktrees
        ;;
    clean)
        clean_worktrees
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}未知命令: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
