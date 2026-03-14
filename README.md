# tabby-quick-command-manager

A fork of [tabby-quick-cmds](https://github.com/minyoad/terminus-quick-cmds) with additional features. A plugin that provides quick command functionality for [Tabby](https://tabby.sh) terminal.

## What's new in this fork

- **Configurable palette shortcut**: Set a custom keyboard shortcut to open the command palette directly from the plugin settings (Settings > Quick Commands).
- **Per-command shortcuts**: Assign individual keyboard shortcuts to any command for instant execution without opening the palette.
- **Usage-based sorting**: Commands within groups are sorted by how frequently you use them.

## Installation

### From Tabby Plugin Manager

Search for `tabby-quick-command-manager` in Tabby's Plugin Manager (Settings > Plugins).

### From ZIP

1. Download the latest ZIP from [GitHub Releases](https://github.com/varunsub/tabby-quick-cmds/releases)
2. Extract and copy to Tabby's plugins directory:
   - Windows: `%APPDATA%\tabby\plugins\node_modules`
   - macOS: `~/Library/Application Support/tabby/plugins`
   - Linux: `~/.config/tabby/plugins`
3. Restart Tabby

## Usage

### Open palette shortcut

Go to Settings > Quick Commands and click **Capture** next to "Open palette shortcut". Press your desired key combination (e.g. `Ctrl+Space`). That shortcut will now open the command palette from anywhere.

The built-in `Alt+Q` hotkey (via Tabby's keyboard settings) also works by default.

### Per-command shortcuts

When editing a command, click **Capture** next to the shortcut field and press a key combination. That command will execute immediately when the shortcut is pressed, without opening the palette.

- Press `Escape` while capturing to cancel
- Press `Delete` or `Backspace` to clear a shortcut

For full documentation on command syntax (multi-line commands, control characters, delays), see the [original project](https://github.com/minyoad/terminus-quick-cmds).

## License

MIT
