# Claude Code Statusline

A custom statusline script for [Claude Code](https://claude.ai/code) that displays useful session information at the bottom of your terminal.

## Installation

### Prerequisites

You need [Bun](https://bun.sh/) installed on your system. Visit the Bun website for installation instructions for your operating system.

### Step 1: Download the Script

1. Download `statusline.ts` from this repository
2. Create a folder called `scripts` inside your `.claude` folder if it doesn't exist:
   - **Windows**: `C:\Users\YourUsername\.claude\scripts\`
   - **Mac/Linux**: `~/.claude/scripts/`
3. Place `statusline.ts` in that folder

### Step 2: Find Your Bun Path

You need to know where Bun is installed:
- **Windows**: Usually `C:\Users\YourUsername\.bun\bin\bun.exe`
- **Mac/Linux**: Usually `/usr/local/bin/bun` or `~/.bun/bin/bun`

### Step 3: Configure Claude Code

1. Open your Claude Code settings file:
   - **Windows**: `C:\Users\YourUsername\.claude\settings.json`
   - **Mac/Linux**: `~/.claude/settings.json`

2. Add or update the `statusLine` section (adjust paths for your system):

   **Windows example:**
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "C:/Users/YourUsername/.bun/bin/bun.exe run C:/Users/YourUsername/.claude/scripts/statusline.ts"
     }
   }
   ```

   **Mac/Linux example:**
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "bun run ~/.claude/scripts/statusline.ts"
     }
   }
   ```

3. Save the file and restart Claude Code

### Step 4: Verify It Works

After restarting Claude Code, you should see a statusline at the bottom of your terminal showing model, git branch, project name, context usage, and cost.

## Features

The statusline displays:

| Item | Description | Example |
|------|-------------|---------|
| Model | Current model with color indicator | 🟣 opus |
| Git Branch | Current branch with change counts | ⎇ main [●2 ~3] |
| Project | Current project folder | 📁 my-project |
| Context | Context window usage percentage | 📐 75% |
| Tokens | Total tokens used | 📊 150k |
| Cost | Session cost in USD | 💰 $4.50 |

### Git Status Indicators

- `●` Staged changes (ready to commit)
- `~` Modified files (not staged)
- `+` Untracked files (new files)

## Example Output

```
🟣 opus │ ⎇ main │ 📁 my-project │ 📐 75% │ 📊 150k │ 💰 $4.50
```

## Troubleshooting

**Statusline not appearing?**
- Make sure Bun is installed and the path is correct
- Check that the paths in settings.json match your actual file locations
- Restart Claude Code after making changes

**Context percentage seems off?**
- The script includes the autocompact buffer (22.5%) in its calculation
- It should closely match the `/context` command output

## How It Works

1. Claude Code calls the script and passes session data via stdin
2. The script parses the transcript to calculate context usage
3. It applies scaling to match the `/context` command display
4. Outputs the formatted statusline to stdout

## License

MIT
