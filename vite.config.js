// vite.config.js
// Vercel serves the site from the domain root; GitLab Pages serves it under /train/
export default {
    base: process.env.VERCEL ? "/" : "/train/"
  }
