import { useContext } from 'react';
import { ThemeContext } from '../app/_layout';

export function useColorScheme(): 'light' | 'dark' {
  const ctx = useContext(ThemeContext) as { theme: 'light' | 'dark' };
  return ctx?.theme ?? 'light';
}
