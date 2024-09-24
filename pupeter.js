const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Replace with the URL of your HackMD document
  await page.goto('https://hackmd.io/YOUR_DOCUMENT_URL');

  // Wait for the content to be fully rendered
  await page.waitForSelector('body'); // Adjust the selector based on the element that signals the page has loaded

  // Extract the HTML
  const html = await page.evaluate(() => document.documentElement.outerHTML);

  // Save the HTML to a file or output it
  const fs = require('fs');
  fs.writeFileSync('protocol.html', html);

  await browser.close();
})();
