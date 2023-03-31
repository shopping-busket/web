import { createVuetify, ThemeDefinition } from 'vuetify';

const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    primary: '#01916d',
    secondary: '#20A879',
    accent: '#11A697',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  },
};

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: '#007357',
    secondary: '#20A879',
    accent: '#11A697',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
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
});
