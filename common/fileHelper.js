// common/fileHelper.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Safely reads a JSON file, returning a fallback value if it doesn't exist or fails to parse.
 * @param {string} filePath The path to the JSON file.
 * @param {*} fallback The value to return on failure.
 * @returns {Promise<object | any>} The parsed JSON object or the fallback value.
 */
async function readJSON(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, which is a normal case, so return fallback without logging error.
      return fallback;
    }
    console.error(`❌ Failed to read or parse JSON file: ${filePath}`, err);
    return fallback; // Return fallback on other errors like parse errors.
  }
}

/**
 * Safely writes a JavaScript object to a JSON file.
 * Creates the directory if it does not exist.
 * @param {string} filePath The path to the JSON file.
 * @param {object} data The JavaScript object to write.
 * @returns {Promise<void>}
 */
async function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`❌ Failed to write JSON file: ${filePath}`, err);
    throw err; // Re-throw to allow the caller to handle the failure.
  }
}

module.exports = {
  readJSON,
  writeJSON,
};