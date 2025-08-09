// Main layout component
export { AppLayout } from './AppLayout'

// Individual panel components
export { AppHeader } from './AppHeader'
export { SettingsPanel } from './SettingsPanel'
export { EditorPanel } from './EditorPanel'
export { ToolsPanel } from './ToolsPanel'

// Hook and types
export { usePanelState } from '../../hooks/usePanelState'
export type { PanelState, PanelVisibility, ViewportSize } from '../../hooks/usePanelState'
