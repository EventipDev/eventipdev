/**
 * Script to install required dependencies for the news editor
 * 
 * Run with: node src/scripts/install-dependencies.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing react-quill and dependencies for rich text editing...');

try {
  execSync('npm install --save react-quill', { stdio: 'inherit' });
  console.log('✅ Successfully installed react-quill');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\nDependencies installed successfully!');
console.log('\nYou can now use the rich text editor in the news post creation and editing pages.');
console.log('Remember to restart your development server if it\'s running.'); 