import SideNav from './SideNav'

/**
 * Full-viewport web layout with left sidebar navigation.
 * Use for all authenticated parent app screens.
 *
 * @param {string} active - active nav key: 'map' | 'history' | 'zones' | 'alerts' | 'profile' | 'settings'
 */
export default function WebLayout({ children, active }) {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-base)',
      display: 'flex',
      overflow: 'hidden',
    }}>
      <SideNav active={active} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
    </div>
  )
}
