import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import { tokens } from '../theme/tokens';
import { App } from './App';
import './styles.css';

for (const [group, values] of Object.entries(tokens)) {
  if (group === 'font') continue;
  for (const [name, value] of Object.entries(values)) {
    document.documentElement.style.setProperty(`--${group}-${name}`, typeof value === 'number' ? `${value}px` : value);
  }
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
