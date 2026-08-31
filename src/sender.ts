import { BaseTabComponent, SplitTabComponent } from 'terminus-core'
import { BaseTerminalTabComponent as TerminalTabComponent } from 'terminus-terminal'
import { QuickCmds } from './api'

/**
 * A terminal reports the Enter key as a carriage return (0x0D), and that is the byte
 * every shell's line editor waits for before it runs what has been typed.
 *
 * A line feed (0x0A) is a different key: PSReadLine (PowerShell) binds it to "insert
 * a new line", so a command terminated with "\n" was only ever typed into the prompt,
 * never executed. Sending "\r\n" is not right either - the CR runs the command and the
 * stray LF then opens a continuation line on the next prompt.
 *
 * CR alone is correct everywhere: PSReadLine and cmd.exe treat it as Enter, readline /
 * zle accept it as accept-line, and a shell in canonical mode gets it translated to a
 * newline by the tty driver (ICRNL).
 */
export const ENTER = '\r'

/** Pause between the command text and the Enter that runs it, so ordering is preserved. */
const SEND_DELAY = 50

export type ShellKind = 'cmd' | 'powershell' | 'posix'

export function sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Best guess at the shell running in a tab. It only picks the syntax used to glue
 * multiple lines together when a command is pasted without being run, so a wrong
 * guess never stops a command from executing.
 */
export function detectShell (tab: TerminalTabComponent): ShellKind {
    const profile = (tab as any).profile || {}
    const options = profile.options || {}
    const haystack = [
        tab.title,
        profile.name,
        options.command,
        ...(Array.isArray(options.args) ? options.args : []),
    ].filter(x => typeof x === 'string').join(' ').toLowerCase()

    if (haystack.includes('powershell') || haystack.includes('pwsh')) {
        return 'powershell'
    }
    if (haystack.includes('cmd.exe') || haystack.includes('command prompt')) {
        return 'cmd'
    }
    return 'posix'
}

/** Expands `\xNN` escapes, so control characters (e.g. `\x03` for Ctrl+C) can be sent. */
function decodeHexEscapes (text: string): string {
    return text.replace(/\\x([0-9a-f]{2})/ig, (_, pair) => String.fromCharCode(parseInt(pair, 16)))
}

/** Joins lines into a single string that is typed at the prompt but not executed. */
function joinWithoutRunning (lines: string[], shell: ShellKind): string {
    if (shell === 'powershell') {
        return lines.join(' ; ')
    }
    const continuation = shell === 'cmd' ? ' &^' : ' &&\\'
    return lines.join(continuation + ENTER)
}

/**
 * Sends a quick command to a tab. With `appendCR` set each line is executed, otherwise
 * the lines are typed at the prompt as one command and left for the user to run.
 */
export async function sendCommand (tab: BaseTabComponent, cmd: QuickCmds): Promise<void> {
    if (tab instanceof SplitTabComponent) {
        await sendCommand(tab.getFocusedTab(), cmd)
        return
    }
    if (!(tab instanceof TerminalTabComponent)) {
        return
    }

    const terminal = tab as TerminalTabComponent
    const run = !!cmd.appendCR
    const pasted: string[] = []

    for (const rawLine of cmd.text.split(/(?:\r\n|\r|\n)/)) {
        if (rawLine === '') {
            continue
        }

        if (rawLine.startsWith('\\s')) {
            // \sNNN pauses between commands, which only makes sense while running them
            if (!run) {
                continue
            }
            const sleepTime = parseInt(rawLine.slice(2), 10)
            if (!isNaN(sleepTime)) {
                await sleep(sleepTime)
            }
            continue
        }

        const line = rawLine.startsWith('\\x') ? decodeHexEscapes(rawLine) : rawLine

        if (!run) {
            pasted.push(line)
            continue
        }

        await terminal.sendInput(line)
        await sleep(SEND_DELAY)
        await terminal.sendInput(ENTER)
    }

    if (pasted.length > 0) {
        await terminal.sendInput(joinWithoutRunning(pasted, detectShell(terminal)))
    }
}

/** Sends a quick command to every open terminal, including each pane of a split tab. */
export function sendCommandToAllTabs (tabs: BaseTabComponent[], cmd: QuickCmds): Promise<void[]> {
    const targets: BaseTabComponent[] = []
    for (const tab of tabs) {
        if (tab instanceof SplitTabComponent) {
            targets.push(...tab.getAllTabs())
        } else {
            targets.push(tab)
        }
    }
    return Promise.all(targets.map(tab => sendCommand(tab, cmd)))
}
