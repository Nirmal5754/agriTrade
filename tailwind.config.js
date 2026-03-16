export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // Ensure Tailwind utilities always win over other CSS rules.
  important: true,
};
