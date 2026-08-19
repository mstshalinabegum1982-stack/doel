import { execSync } from 'child_process';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (error) {
    return null;
  }
}

async function autoCommitAndPush() {
  console.log('🚀 Checking Git status...');

  // 1. Stage all changes
  run('git add .');

  // 2. Get status of staged files
  const statusOutput = run('git status --porcelain');
  if (!statusOutput) {
    console.log('✅ No changes to commit. Everything is up to date!');
    return;
  }

  // Parse modified files for a smart message
  const files = statusOutput
    .split('\n')
    .map(line => line.trim().split(/\s+/).pop())
    .filter(Boolean);

  // Check if custom message was provided via argument
  const customMessage = process.argv.slice(2).join(' ');

  let commitMsg = '';
  if (customMessage) {
    commitMsg = customMessage;
  } else {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const mainFiles = files.slice(0, 3).map(f => f.split('/').pop()).join(', ');
    const extraCount = files.length > 3 ? ` & ${files.length - 3} more` : '';
    
    commitMsg = `auto-update: ${mainFiles}${extraCount} (${timestamp})`;
  }

  console.log(`📝 Commit Message: "${commitMsg}"`);

  // 3. Commit
  const commitResult = run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  if (commitResult) {
    console.log('✅ Commit successful!');
  } else {
    console.log('⚠️ Commit skipped or failed.');
  }

  // 4. Determine current branch
  const branch = run('git rev-parse --abbrev-ref HEAD') || 'main';

  // 5. Push to GitHub
  console.log(`⬆️ Pushing to GitHub (branch: ${branch})...`);
  const pushOutput = run(`git push origin ${branch}`);
  
  console.log('🎉 Push complete!');
}

autoCommitAndPush();
