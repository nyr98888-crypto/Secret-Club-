/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        toy: ["DynaPuff", "Fredoka", "Baloo 2", "cursive"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(1deg)" },
        },
        "toy-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gem-pop": {
          "0%": { transform: "scale(0.4)" },
          "55%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        "diary-zoom": {
          "0%": { transform: "scale(1) translateY(0)" },
          "100%": { transform: "scale(2.35) translateY(8%)" },
        },
        "burst-fly": {
          "0%": { transform: "translate(0,0) scale(1)", opacity: "1" },
          "100%": {
            transform: "translate(var(--dx), var(--dy)) scale(0.2)",
            opacity: "0",
          },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "toy-bounce": "toy-bounce 1.1s ease-in-out infinite",
        "gem-pop": "gem-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "diary-zoom": "diary-zoom 0.85s ease-in forwards",
        "burst-fly": "burst-fly 0.9s ease-out forwards",
      },
    },
  },
  plugins: [],
};
