const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  // Set auth token in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('smart_helmet_token', 'mock-token-for-screenshot');
  });

  // Navigate to login first to trigger auth check, then go to data-center
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });

  // Fill login form
  const usernameInput = await page.$('input[placeholder*="用户名"], input[id*="username"], input[type="text"]');
  const passwordInput = await page.$('input[placeholder*="密码"], input[id*="password"], input[type="password"]');
  
  if (usernameInput && passwordInput) {
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    const loginBtn = await page.$('button[type="submit"], button:has-text("登录")');
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(2000);
  }

  // Now navigate to data-center
  await page.goto('http://localhost:5173/data-center', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Take full page screenshot
  await page.screenshot({ 
    path: 'C:/Users/CJ/Desktop/smart-main/smart/smart/datacenter-screenshot.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved to datacenter-screenshot.png');
  console.log('Page URL:', page.url());
  
  await browser.close();
})();
