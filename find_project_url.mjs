import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Go to Supabase dashboard
    await page.goto('https://app.supabase.com', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('=== Page Information ===');
    console.log('Title:', await page.title());
    console.log('URL:', page.url());
    console.log();
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/supabase_debug.png' });
    console.log('Screenshot saved to /tmp/supabase_debug.png');
    
    // Look for project links in various ways
    console.log('\n=== Looking for project links ===');
    
    // Try to find by button/text patterns
    const buttons = await page.$$('button, a, [role="button"][href]');
    for (const button of buttons.slice(0, 20)) {
      const text = await button.textContent();
      if (text && (
        text.toLowerCase().includes('project') ||
        text.toLowerCase().includes('create project') ||
        text.toLowerCase().includes('new project')
      )) {
        const href = await button.getAttribute('href');
        console.log('Potential project button:', text.trim(), '->', href);
      }
    }
    
    // Try to find links containing supabase.co (project URLs)
    const allLinks = await page.$$eval('a', links => 
      links.map(link => {
        const href = link.href;
        const text = link.textContent.trim();
        return { href, text };
      })
    );
    
    const projectUrls = allLinks.filter(link => 
      link.href.includes('supabase.co') && (
        link.text.toLowerCase().includes('project') ||
        link.text.toLowerCase().includes('db') ||
        link.text.toLowerCase().includes('database')
      )
    );
    
    console.log('\n=== Potential Project URLs ===');
    for (const link of projectUrls.slice(0, 10)) {
      console.log('URL:', link.href, '| Text:', link.text);
    }
    
    // Check if we're logged in by looking for logout button or user menu
    const logoutButton = await page.$('button:has-text("Log out")');
    const userMenu = await page.$('button:has-text("Welcome")');
    const signInButton = await page.$('text/Sign in');
    
    console.log('\n=== Login Status ===');
    if (logoutButton) console.log('✓ User appears to be logged in (found logout button)');
    if (userMenu) console.log('✓ User appears to be logged in (found user menu)');
    if (signInButton) console.log('✗ User appears to be logged out (found sign in button)');
    
  } catch (error) {
    console.error('Error during browsing:', error.message);
  } finally {
    await browser.close();
  }
})();
