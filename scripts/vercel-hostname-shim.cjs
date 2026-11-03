/**
 * Windows PCs with non-ASCII hostnames (e.g. Hebrew) break Vercel CLI:
 * "Cannot convert argument to a ByteString... value of 1504"
 * Patch os.hostname before any Vercel code runs.
 */
const os = require("os");
os.hostname = () => "SECRETCLUB-PC";
