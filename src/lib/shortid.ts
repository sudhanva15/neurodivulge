export default function shortid(len=6){ return Math.random().toString(36).slice(2, 2+len).toUpperCase(); }
