# Git + GitHub

**Описание:** Система контроля версий и платформа для ведения «Летописи» кода проекта Pygmalion.

**Для чего используется:**
- Версионирование кода проекта
- Работа с форком TVOY1000/-Pygmalion-
- Code review через pull requests
- CI/CD через GitHub Actions
- Ведение истории изменений (Летопись)

**Основные команды:**

1. **Настройка Git:**
```bash
# Первая настройка
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Проверка конфигурации
git config --list
```

2. **Работа с форком Pygmalion:**
```bash
# Клонирование форка
git clone https://github.com/TVOY1000/-Pygmalion-.git
cd -Pygmalion-

# Добавление upstream (оригинальный репозиторий)
git remote add upstream https://github.com/ORIGINAL_OWNER/Pygmalion.git

# Проверка remote
git remote -v
```

3. **Ветвление (Branching):**
```bash
# Структура веток
main          # Production версия
develop       # Основная ветка разработки
feature/*     # Новые функции
bugfix/*      # Исправления ошибок
hotfix/*      # Срочные исправления для main

# Создание ветки
git checkout -b feature/new-protocol
git checkout -b bugfix/fix-transaction

# Переключение
git checkout develop
git switch main

# Список веток
git branch
git branch -a  # все включая remote
```

4. **Коммиты:**
```bash
# Проверка статуса
git status

# Добавление файлов
git add <file>
git add .              # все файлы
git add *.ts           # по маске

# Коммит
git commit -m "feat: добавить протокол ТИУП"
git commit -am "fix: исправить ошибку валидации"

# Просмотр истории
git log --oneline
git log --graph --oneline --all
```

5. **Conventional Commits:**
```
feat:     новая функция
fix:      исправление ошибки
docs:     изменения в документации
style:    форматирование (без изменения логики)
refactor: рефакторинг кода
test:     добавление тестов
chore:    изменения в сборке, зависимостях

Пример:
feat(api): добавить endpoint для транзакций
fix(docker): исправить порт PostgreSQL
docs(readme): обновить инструкцию установки
```

6. **Синхронизация с upstream:**
```bash
# Обновление локальной develop
git checkout develop
git fetch upstream
git merge upstream/develop

# Или rebase
git rebase upstream/develop

# Отправка изменений в свой форк
git push origin develop
```

7. **Pull Request (PR):**
```bash
# Создание ветки для PR
git checkout -b feature/ro-dag-schema
git add .
git commit -m "feat: схема ro.DAG для транзакций"
git push origin feature/ro-dag-schema

# Затем создать PR на GitHub:
# 1. Зайти на https://github.com/TVOY1000/-Pygmalion-
# 2. Click "Compare & pull request"
# 3. Выбрать base: develop, compare: feature/ro-dag-schema
# 4. Добавить описание и reviewers
```

8. **.gitignore для Pygmalion:**
```gitignore
# Зависимости
node_modules/
package-lock.json

# Сборка
dist/
build/
*.tsbuildinfo

# Окружение
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Логи
*.log
logs/

# Тесты
coverage/
```

9. **Полезные команды:**
```bash
# Отмена изменений
git checkout -- <file>       # отменить изменения в файле
git reset HEAD <file>        # убрать из staged
git revert <commit>          # отменить коммит новым коммитом

# Stash (временное сохранение)
git stash
git stash pop
git stash list

# Teardown (удаление слитых веток)
git branch --merged | grep -v "\*\|main\|develop" | xargs git branch -d
```

10. **GitHub CLI (опционально):**
```bash
# Установка
winget install GitHub.cli

# Использование
gh auth login
gh repo clone TVOY1000/-Pygmalion-
gh pr create --title "feat: новый протокол" --body "Описание изменений"
gh pr list
gh pr merge --merge --delete-branch
```

**Ссылки:**
- Git Docs: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com
- Conventional Commits: https://www.conventionalcommits.org
- GitHub CLI: https://cli.github.com
- Pygmalion Fork: https://github.com/TVOY1000/-Pygmalion-
