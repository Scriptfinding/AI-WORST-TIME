// ================================
// BREAKPOINT MODE - DEBUG FUNCTIONS
// ================================

const $enableBreakpoint = $json.$context.enable_breakpoint || process.env.ENABLE_BREAKPOINT === 'true';
const $breakpoint = async function(label, context = {}) {
  __emitAction('breakpoint', label || '');
  if (!$enableBreakpoint) {
    console.debug('Breakpoint requested but disabled:', label || 'no label');
    return;
  }
  
  console.debug('\n' + '='.repeat(60));
  console.debug('🔍 EVAL BREAKPOINT:', label);
  console.debug('='.repeat(60));
  console.debug('Available variables in context:');
  console.debug('- $page (Puppeteer page object)');
  console.debug('- $browser (Puppeteer browser object)'); 
  console.debug('- $input (Input data)');
  console.debug('- All utility functions ($sleep, $fillInput, $gotoUrl, $gotoTab, etc.)');
  
  if (Object.keys(context).length > 0) {
    console.debug('- Custom context variables:', Object.keys(context).join(', '));
  }
  
  console.debug('\nCommands:');
  console.debug('- Type JavaScript/Puppeteer code to execute');
  console.debug('- Type "continue" or "c" to continue the run');
  console.debug('- Type "screenshot" or "s" to take a screenshot');
  console.debug('- Type "url" or "u" to see current page URL');
  console.debug('- Type "help" to see this help again');
  console.debug('='.repeat(60) + '\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '🔍 eval> '
  });
  
  const originalGlobals = {};
  const contextVars = {
    $page,
    $browser,
    $input: $json,
    $client,
    $sleep,
    $fillInput,
    $gotoUrl,
    $gotoTab,
    $screenshot,
    $legend,
    $setOutput,
    $generateResponse,
    $generateResponseError, 
    $generateResponseSuccess,
    $selectAtIndex,
    $bridgeEvaluate,
    $injectScriptLibrary,
    $scanDirectory,
    $scanDownloadsDirectory,
    $waitForFile,
    $getDownloadsPathFile,
    $unzipFile,
    $vars,
    ...context
  };
  
  Object.keys(contextVars).forEach(key => {
    if (key in global) {
      originalGlobals[key] = global[key];
    }
    global[key] = contextVars[key];
  });
  
  return new Promise((resolve) => {
    rl.prompt();
    
    rl.on('line', async (input) => {
      const command = input.trim();
      
      if (command === 'continue' || command === 'c') {
        rl.close();
        return;
      }
      
      if (command === 'help') {
        console.debug('\nAvailable commands:');
        console.debug('- continue/c: Continue the run');
        console.debug('- screenshot: Take a screenshot');
        console.debug('- url: Show current page URL');
        console.debug('- help: Show this help');
        console.debug('- Or type any JavaScript/Puppeteer code to execute\n');
        rl.prompt();
        return;
      }
      
      if (command === 'screenshot' || command === 's') {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const screenshotPath = path.join(paths.screenshots, 'debug-' + timestamp + '.png');
          await $page.screenshot({ path: screenshotPath });
          console.debug('📸 Screenshot saved:', screenshotPath);
        } catch (error) {
          console.error('❌ Screenshot error:', error.message);
        }
        rl.prompt();
        return;
      }
      
      if (command === 'url' || command === 'u') {
        try {
          const currentUrl = await $page.url();
          console.debug('🌐 Current URL:', currentUrl);
        } catch (error) {
          console.error('❌ URL error:', error.message);
        }
        rl.prompt();
        return;
      }
      
      if (command === '') {
        rl.prompt();
        return;
      }
      
      try {
        console.debug('⚡ Executing:', command);
        const result = await eval('(async () => { return ' + command + '; })()');
        if (result !== undefined) {
          console.debug('✅ Result:', result);
        }
      } catch (error) {
        try {
          await eval('(async () => { ' + command + '; })()');
          console.debug('✅ Command executed');
        } catch (secondError) {
          console.error('❌ Error:', secondError.message);
        }
      }
      
      rl.prompt();
    });
    
    rl.on('close', () => {
      Object.keys(contextVars).forEach(key => {
        if (key in originalGlobals) {
          global[key] = originalGlobals[key];
        } else {
          delete global[key];
        }
      });
      
      console.debug('🚀 Continuing run...\n');
      resolve();
    });
  });
};
