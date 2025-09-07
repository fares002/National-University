/*
 * Script: generate-invoices.js
 * Purpose: Convert root-level invoice HTML files (English & Arabic) into PDFs using Puppeteer.
 * Output: PDFs saved to ./invoices/ directory (created if missing): invoice.pdf, invoice-ar.pdf
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function htmlToPdf(inputPath, outputPath, options = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Wider viewport & higher device scale for crisper rendering
  await page.setViewport({ width: 1300, height: 1800, deviceScaleFactor: 2 });

  const fileUrl = "file://" + inputPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0" });

  // Wait for custom fonts (if any) to finish loading
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {}

  // Use screen styles (keeps shadows / gradients) unless explicitly forcing print styles
  if (!process.env.PRINT_MEDIA) {
    await page.emulateMediaType("screen");
  }

  // Optional class hook if you want to target PDF-only tweaks
  await page.evaluate(() => document.body.classList.add("pdf-export"));

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: "18mm", right: "14mm", bottom: "18mm", left: "14mm" },
    ...options,
  });
  await browser.close();
}
async function htmlToFullPagePdf(inputPath, outputPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1800, deviceScaleFactor: 2 });
  const fileUrl = "file://" + inputPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0" });
  try {
    await page.evaluate(() => document.fonts && document.fonts.ready);
  } catch {}
  await page.emulateMediaType("screen");
  const { fullHeight, bodyWidth } = await page.evaluate(() => ({
    fullHeight: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight
    ),
    bodyWidth:
      document.querySelector(".invoice-wrapper")?.offsetWidth ||
      document.body.offsetWidth ||
      960,
  }));
  const heightPx = fullHeight + 40;
  const widthPx = bodyWidth;
  const pxToIn = (px) => px / 96 + "in";
  await page.pdf({
    path: outputPath,
    printBackground: true,
    width: pxToIn(widthPx),
    height: pxToIn(heightPx),
    margin: { top: "0in", right: "0in", bottom: "0in", left: "0in" },
  });
  await browser.close();
}

(async () => {
  try {
    const projectRoot = path.resolve(__dirname, "..", "..");
    const outDir = path.join(projectRoot, "invoices");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const targets = [
      {
        in: path.join(projectRoot, "invoice.html"),
        out: path.join(outDir, "invoice.pdf"),
      },
      {
        in: path.join(projectRoot, "invoice-ar.html"),
        out: path.join(outDir, "invoice-ar.pdf"),
      },
    ];

    for (const t of targets) {
      if (!fs.existsSync(t.in)) {
        console.warn("[skip] Not found:", path.basename(t.in));
        continue;
      }
      console.log("Generating A4 PDF for", path.basename(t.in));
      await htmlToPdf(t.in, t.out);
      console.log(" -> Saved", path.relative(projectRoot, t.out));
      const fullOut = t.out.replace(/\.pdf$/, "-full.pdf");
      console.log("Generating FULL-PAGE PDF for", path.basename(t.in));
      await htmlToFullPagePdf(t.in, fullOut);
      console.log(" -> Saved", path.relative(projectRoot, fullOut));
    }

    console.log("\nAll done.");
  } catch (err) {
    console.error("Failed to generate invoices:", err);
    process.exit(1);
  }
})();
