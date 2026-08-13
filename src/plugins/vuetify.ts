import type {ThemeDefinition} from 'vuetify';
import {createVuetify} from 'vuetify';

export const lightTheme = {
  dark: false,
  colors: {
    // Canvas & Main Surfaces
    background: '#F4F6F5',
    surface: '#FFFFFF',

    // Primary & Brand Identity (Adapted for light backgrounds)
    primary: '#006B51',   // Adjusted slightly darker for WCAG AA contrast against light surfaces
    secondary: '#1A8862', // Deepened slightly from #20A879 to pass contrast ratios
    accent: '#0E8579',    // Deepened slightly from #11A697 for readable text/icons

    // Status Colors (Standard accessible light-mode variants)
    error: '#D32F2F',     // Darker red for high contrast on light base
    info: '#0288D1',      // Deeper blue
    success: '#388E3C',   // Deeper green
    warning: '#F57C00',   // Amber-orange (pure #FFC107 yellow fails on white)

    'on-background': '#1A1D1C',
    'on-surface': '#1A1D1C',
    'on-primary': '#FFFFFF',

    'depth-0': '#FFFFFF', // Clean ground level (cards, primary surface)
    'depth-1': '#EBF0EE', // Soft cool-teal tinted container fill
    'depth-2': '#D8E2DE', // Distinct section boundaries / grouped items
  },
}

export const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    // Canvas & Main Surfaces
    background: '#1D1F1F',
    surface: '#272929',

    // Primary & Brand Identity (Desaturated & Brightened for Dark Surfaces)
    primary: '#43C29E',   // Lifted from #007357 to achieve 4.5:1+ contrast against depth-0
    secondary: '#53D3A6', // Softened teal-green for clear distinction from primary
    accent: '#4EDAC8',    // Brightened mint-teal

    // W3C-Compliant Status Colors for Dark Mode
    error: '#FF8A80',     // Desaturated red (AA compliant on dark surfaces)
    info: '#82B1FF',      // Lighter blue for readable text/icons
    success: '#81C784',   // Softer green to reduce visual harshness
    warning: '#FFD54F',   // Lightened amber/yellow for 7:1+ contrast ratio

    // Text & Overlays (High-Contrast W3C Compliant)
    'on-background': '#d4dcd6', // Soft off-white (Passes AAA: >11:1 ratio)
    'on-surface': '#d4dcd6',
    'on-primary': '#001E16',    // Dark text on primary button fills

    // Structural Depth Palette (Dark Surface Inversion: Darker -> Lighter)
    'depth-0': '#272929', // Main ground surface
    'depth-1': '#323535', // Elevated cards / container fill
    'depth-2': '#4A4E4E', // Distinct section boundaries / active states
  },
};

export default createVuetify({
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
      darkTheme,
    },
  },
  defaults: {
    global: {
      // Sets rounded corners globally for all Vuetify components (cards, buttons, sheets, etc.)
      rounded: 'lg', // Options: 'sm', 'md', 'lg', 'xl' (lg maps to ~0.5rem / 8px)
      elevation: 0,  // Flat, modern aesthetic relying on depth colors rather than heavy drop shadows
    },
    VCard: {
      color: 'depth-0', // Cards automatically use depth-0
      variant: 'flat',
    },
    VList: {
      color: 'transparent',
    },
    VBtn: {
      variant: 'flat',
      color: 'on-surface'
    },
    VIconBtn: {
      variant: 'text',
      'icon-size': '28px'
    },
    VSheet: {
      color: 'depth-1', // Generic containers default to depth-1
    },
  }
});
