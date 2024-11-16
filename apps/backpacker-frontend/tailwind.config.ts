import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'dark-gradient': 'linear-gradient(170deg, #4F5B7A -20%, #2E3547 -20%, #181B24 30%, #0D0F14 70%)',
        'ground-gradient': 'linear-gradient(to bottom, #414C6F 0%, #0D0F14 100%)',
        'orange-gradient': 'linear-gradient(to bottom right, #F29738 0%, #F16641 100%)',
        'purple-gradient': 'linear-gradient(to bottom right, #B364FC 0%, #40007B 100%)',
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        web: {
          white: '#FFFFFF',
          gray: '#99A5C1',
          background: '#0D0F14',
          section: 'rgba(0,0,0,0.3)',
          glassShine: 'rgba(242, 151, 56, 0.5)',
          button: '#232735',
          buttonShine: '#2D3141',
          textBox: "#2C2E39",
          textBoxShine: "#343744",
          cards: "#1E202A",
          cardsShine: "#232735",
          accent: {
            yellow: '#F29738',
            orange: '#F16641',
            red: '#EF4260',
            purple: '#B364FC',
            blue: {
              1: '#3BBDE9',
              2: '#22A2FC'
            },
            green: '#7BDB97',
            black: '#000000'
          }
        }
      },
    },
  },
  plugins: [],
};
export default config;
