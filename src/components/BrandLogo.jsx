import { useTheme } from '../ThemeContext'

export default function BrandLogo({ className = '' }) {
  const { theme } = useTheme()

  const src = theme === 'dark' ? '/logo-blanco.png' : '/logo-negro.png'

  return <img src={src} alt="Digital Solutions" className={className} />
}
