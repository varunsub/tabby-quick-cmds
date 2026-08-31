import { Injectable } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { HotkeysService, ToolbarButtonProvider, IToolbarButton, ConfigService, AppService } from 'terminus-core'
import { QuickCmdsModalComponent } from './components/quickCmdsModal.component'
import { sendCommand } from './sender'

@Injectable()
export class ButtonProvider extends ToolbarButtonProvider {
    private usageCount: Record<string, number> = {}

    constructor (
        private ngbModal: NgbModal,
        private hotkeys: HotkeysService,
        private config: ConfigService,
        private app: AppService,
    ) {
        super()
        
        // Listen for hotkey matches
        this.hotkeys.matchedHotkey.subscribe(async (hotkey) => {
            if (hotkey === 'qc') {
                this.activate()
            } else {
                // Check if this hotkey matches any command's shortcut
                this.executeCommandByShortcut(hotkey)
            }
        })
        
        // Also listen for document keydown events to capture all shortcuts
        // Use capture phase to ensure we get the event before other handlers
        document.addEventListener('keydown', this.handleDocumentKeyDown.bind(this), true)
    }

    private handleDocumentKeyDown(event: KeyboardEvent) {
        // Skip if the key is being repeated (holding down a key)
        if (event.repeat) {
            return
        }
        
        // Skip if the user is typing in an input field
        // const target = event.target as HTMLElement
        // if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        //     return
        // }
        
        // Build the shortcut string from the event
        let shortcut = ''
        const modifiers: string[] = []
        
        if (event.ctrlKey || event.metaKey) {
            modifiers.push('Ctrl')
        }
        if (event.altKey) {
            modifiers.push('Alt')
        }
        if (event.shiftKey) {
            modifiers.push('Shift')
        }
        
        // Sort modifiers to ensure consistent ordering
        modifiers.sort()
        
        // Add modifiers to shortcut string
        if (modifiers.length > 0) {
            shortcut = modifiers.join('+') + '+'
        }
        
        // Add the main key
        const mainKey = event.key
        
        // Only process if we have a valid main key (not just modifiers)
        if (mainKey && !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
            let processedKey = mainKey
            
            // Handle special cases for keys that need consistent naming
            if (mainKey.length === 1) {
                // For single character keys, use uppercase
                processedKey = mainKey.toUpperCase()
            } else {
                // For special keys (like ArrowUp), use camelCase with first letter uppercase
                processedKey = mainKey.charAt(0).toUpperCase() + mainKey.slice(1)
            }
            
            shortcut += processedKey
            
            // Check if this shortcut should open the command palette
            const openShortcut = this.config.store.qc.openShortcut
            if (openShortcut && shortcut === openShortcut) {
                event.preventDefault()
                event.stopPropagation()
                this.activate()
                return
            }

            // Check if this shortcut matches any command
            const commands = this.config.store.qc.cmds
            const matchedCommand = commands.find(cmd => cmd.shortcut === shortcut)

            // If a command is matched, prevent the default behavior to avoid sending extra escape sequences
            if (matchedCommand) {
                event.preventDefault()
                event.stopPropagation()
                this.executeCommandByShortcut(shortcut)
            }
        }
    }

    async executeCommandByShortcut(hotkey: string) {
        const commands = this.config.store.qc.cmds
        const matchedCommand = commands.find(cmd => cmd.shortcut === hotkey)
        
        if (matchedCommand) {
            // Use count +1 and persist
            this.usageCount[matchedCommand.text] = (this.usageCount[matchedCommand.text] || 0) + 1
            localStorage.setItem('qcUsageCount', JSON.stringify(this.usageCount))
            
            // Execute the command
            await sendCommand(this.app.activeTab, matchedCommand)
        }
    }

    activate () {
        this.ngbModal.open(QuickCmdsModalComponent)
    }

    provide (): IToolbarButton[] {
        return [{
            icon: require('./icons/keyboard.svg'),
            weight: 5,
            title: 'Quick commands',
            touchBarNSImage: 'NSTouchBarComposeTemplate',
            click: async () => {
                this.activate()
            }
        }]
    }
}
