/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'jb-midnight': '#0B0F1A', // Midnight Slate (Background) [cite: 61]
                'jb-steel': '#1A2333',    // Steel Blue (Panels/UI) [cite: 62]
                'jb-frost': '#E8EEF6',    // Frost White (Text) [cite: 63]
                'jb-green': '#39FF88',    // Luminous Tech Green (Glow) [cite: 65]
                'jb-cyan': '#00D9FF',     // Neon Cyan (Secondary Glow) [cite: 66]
                'jb-violet': '#8B5CFF',   // Pulse Violet (Optional highlight) [cite: 67]
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'], // Primary Font (Headlines) [cite: 49, 50]
                inter: ['Inter', 'sans-serif'],       // Secondary Font (Body Text) [cite: 51, 52]
            },
            borderRadius: {
                'jb-card': '24px', // Standard rounded corners for Brand visuals [cite: 95]
            },
            backgroundImage: {
                'neural-gradient': 'linear-gradient(to right, #39FF88, #00D9FF)', // 
                'core-glow': 'linear-gradient(to bottom, rgba(57,255,136,0.35), rgba(57,255,136,0))', // [cite: 75]
            }
        },
    },
    plugins: [],
}
