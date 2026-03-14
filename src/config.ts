import { ConfigProvider } from 'terminus-core'

export class QuickCmdsConfigProvider extends ConfigProvider {
    defaults = {
        qc: {
            cmds: [],
            openShortcut: '',
        },
        hotkeys: {
            'qc': [
                'Alt-Q',
            ],
        },
    }

    platformDefaults = { }
}
