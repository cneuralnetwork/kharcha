import { useColorScheme } from 'react-native';

export const palettes = {
  dark: {
    bg: '#121412', surface: '#1B1E1B', sunk: '#0D0F0D', line: '#2C312C', strongLine: '#6B6F68',
    ink: '#EFEADF', muted: '#A6A499', marigold: '#F0B453', marigoldSoft: '#3A2F1A',
    onMarigold: '#1D211C', leaf: '#8FC7A8', onLeaf: '#10241A',
    debit: '#F38A63', debitSoft: '#3D1D12', credit: '#7CC0E8', creditSoft: '#14303F',
    review: '#F0B453', focus: '#7CC0E8',
  },
  light: {
    bg: '#F5F1E8', surface: '#FFFDF8', sunk: '#ECE6D8', line: '#DDD5C3', strongLine: '#8C8677',
    ink: '#1D211C', muted: '#5D5F56', marigold: '#E7A43A', marigoldSoft: '#F6E2B8',
    onMarigold: '#1D211C', leaf: '#1F4D3A', onLeaf: '#FFFDF8',
    debit: '#B5401B', debitSoft: '#FBE9E0', credit: '#1D5F8A', creditSoft: '#DCEBF3',
    review: '#8A5A00', focus: '#1D5F8A',
  },
} as const;

export type Palette = typeof palettes.dark | typeof palettes.light;

export function usePalette(): Palette {
  return useColorScheme() === 'light' ? palettes.light : palettes.dark;
}

export const categoryColors: Record<string, string> = {
  'Food & dining': '#F08A52', Groceries: '#84C06C', Travel: '#6FB1DE', Bills: '#B39AD6',
  Shopping: '#EC86AE', Health: '#5FCFC0', Entertainment: '#E2C056', Transfers: '#A9A495',
};

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
  monoRegular: 'IBMPlexMono_400Regular',
};
