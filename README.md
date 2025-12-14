# Claude Code Statusline

A custom statusline script for [Claude Code](https://claude.ai/code) that displays useful session information.

## Features

Shows in the terminal statusline:
- **Model** - Current model with emoji (🟣 opus, 🟠 sonnet, 🟢 haiku)
- **Git Branch** - Current branch with change indicators (●staged, ~modified, +untracked)
- **Project** - Current project folder name
- **Context %** - Context window usage matching `/context` command
- **Tokens** - Total tokens used
- **Cost** - Session cost in USD

## Example Output

```
🟣 opus │ ⎇ main │ 📁 my-project │ 📐 68% │ 📊 136k │ 💰 $3.88
```

## Installation

1. **Requirements**: [Bun](https://bun.sh/) runtime

2. **Copy the script** to your Claude Code scripts folder:
   ```bash
   cp statusline.ts ~/.claude/scripts/
   ```

3. **Configure Claude Code** to use the statusline:
   ```bash
   claude config set --global preferredNotifChannel terminal_bell
   claude config set --global terminalStatusBarMode script
   claude config set --global terminalStatusBarScriptPath ~/.claude/scripts/statusline.ts
   ```

   Or add to `~/.claude/settings.json`:
   ```json
   {
     "preferredNotifChannel": "terminal_bell",
     "terminalStatusBarMode": "script",
     "terminalStatusBarScriptPath": "~/.claude/scripts/statusline.ts"
   }
   ```

## How It Works

The script:
1. Receives session data via stdin from Claude Code
2. Parses the transcript JSONL to calculate accurate context usage
3. Applies scaling (0.88) to match `/context` display
4. Adds autocompact buffer (22.5%) for total context calculation
5. Outputs formatted statusline to stdout

## License

MIT
