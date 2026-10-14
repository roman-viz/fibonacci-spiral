import { Moon, Sun } from 'lucide-react';
import { PageText } from '../models/PageText';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const nextThemeLabel = nextTheme === 'dark' ? PageText.DarkTheme : PageText.LightTheme;
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`${PageText.EnableThemeAction} ${nextThemeLabel} тему`}
      aria-pressed={theme === 'dark'}
      title={`${PageText.EnableThemeAction} ${nextThemeLabel} тему`}
    >
      <span className={`theme-switch${theme === 'dark' ? ' is-dark' : ''}`} aria-hidden="true">
        <Sun className="theme-sun" size={14} strokeWidth={1.7} />
        <Moon className="theme-moon" size={14} strokeWidth={1.7} />
        <span className="theme-switch-knob" />
      </span>
      <span className="theme-toggle-label">{theme === 'dark' ? PageText.DarkThemeLabel : PageText.LightThemeLabel}</span>
    </button>
  );
}
