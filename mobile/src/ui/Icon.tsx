import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

export type IconName = 'home' | 'inbox' | 'insights' | 'budgets' | 'you' | 'sms' | 'search' | 'plus' | 'edit' | 'refresh' | 'back' | 'check' | 'close' | 'lock' | 'cloud' | 'chevron' | 'filter' | 'share';

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  const common = { stroke: color, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  let art: React.ReactNode;
  switch (name) {
    case 'home': art = <Path fill={color} d="M4 3h16v15l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2V3Zm3 4v2h10V7H7Zm0 5v2h6v-2H7Z" />; break;
    case 'inbox': art = <><Path fill={color} opacity=".45" d="M5 2h14v4H5z" /><Path fill={color} d="M3 6h18v13l-2 2-2-2-2 2-3-2-3 2-2-2-2 2-2-2V6Zm4 4v2h10v-2H7Zm0 4v2h7v-2H7Z" /></>; break;
    case 'insights': art = <Path fill={color} d="M3 17h5v4H3v-4Zm7-7h5v11h-5V10Zm7-7h4v18h-4V3Zm-7 4h5v1h-5V7Zm7 8h4v2h-4v-2Z" />; break;
    case 'budgets': art = <><Path fill={color} d="M12 2a10 10 0 1 0 10 10H12V2Z" /><Path fill={color} opacity=".45" d="M14 2.2V10h7.8A10 10 0 0 0 14 2.2Z" /></>; break;
    case 'you': art = <><Path fill={color} d="M5 3h4v9l5-6h5l-6 7 6 8h-5l-5-7v7H5V3Z" /><Circle fill={color} cx="20" cy="20" r="2" /></>; break;
    case 'sms': art = <><Path {...common} d="M4 5.5h16v11H9l-4 3v-3H4z" /><Path {...common} d="M7.5 9h9m-9 3.5h6" /></>; break;
    case 'search': art = <><Circle {...common} cx="10.5" cy="10.5" r="6.3" /><Line {...common} x1="15.2" y1="15.2" x2="21" y2="21" /></>; break;
    case 'plus': art = <Path {...common} d="M12 4v16M4 12h16" />; break;
    case 'edit': art = <><Path {...common} d="m4 16 11-11 4 4-11 11-5 1z" /><Path {...common} d="m13 7 4 4" /></>; break;
    case 'refresh': art = <><Path {...common} d="M20 11a8 8 0 1 0 .2 3" /><Path {...common} d="M20 4v7h-7" /></>; break;
    case 'back': art = <Polyline {...common} points="15,4 7,12 15,20" />; break;
    case 'check': art = <Path {...common} d="m4.5 12.5 4.5 4.5L19.5 6.5" />; break;
    case 'close': art = <Path {...common} d="M5 5 19 19M19 5 5 19" />; break;
    case 'lock': art = <><Rect {...common} x="5" y="10" width="14" height="11" rx="2" /><Path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" /></>; break;
    case 'cloud': art = <Path {...common} d="M7.5 18h10a4 4 0 0 0 .3-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7.5 18z" />; break;
    case 'chevron': art = <Polyline {...common} points="9,5 16,12 9,19" />; break;
    case 'filter': art = <Path {...common} d="M4 6h16M7 12h10m-7 6h4" />; break;
    case 'share': art = <><Path {...common} d="M12 3v12m-4-8 4-4 4 4" /><Path {...common} d="M5 14v6h14v-6" /></>; break;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>{art}</Svg>;
}
