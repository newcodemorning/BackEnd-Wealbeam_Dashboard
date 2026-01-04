import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
// import { generateMockWellnessData } from './mockData.js';
import { generateWellnessReportHTML } from './htmlTemplate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate wellness analytics report with PDF output
 * @param {Object} apiData - Optional API data in format { success: true, data: {...} }
 */
export async function generateAnalyticsReport(apiData = null) {
    try {
        // Extract data from API response or use mock data
        const wellnessData = apiData?.data; //|| generateMockWellnessData();

        // Generate QR Code
        const reportId = `WELLNESS_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200,
            margin: 1,
            color: {
                dark: '#1ba927',
                light: '#FFFFFF'
            }
        });

        // Generate HTML content
        const htmlContent = generateWellnessReportHTML(wellnessData, qrCodeDataURL);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName;
        let isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer...');
            const puppeteer = await import('puppeteer');

            const pdfFileName = `wellness_report_${dateStr}_${timeStr}.pdf`;
            const pdfFilePath = path.join(reportsDir, pdfFileName);

            console.log('🚀 Launching Chromium browser...');
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });

            console.log('📄 Creating PDF page...');
            const page = await browser.newPage();

            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            console.log('💾 Generating PDF file...');
            await page.pdf({
                path: pdfFilePath,
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: false,
                margin: {
                    top: '6mm',
                    right: '6mm',
                    bottom: '6mm',
                    left: '6mm'
                }
            });

            await browser.close();
            console.log('✅ Browser closed successfully');

            finalFilePath = pdfFilePath;
            finalFileName = pdfFileName;
            isPDF = true;
            console.log(`✅ PDF report generated successfully: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            console.log('⚠️ Falling back to HTML format...');

            const htmlFileName = `wellness_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
            isPDF = false;
            console.log(`✅ HTML report generated: ${htmlFileName}`);
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            // data: wellnessData,
            // htmlContent: htmlContent
        };

    } catch (error) {
        console.error('❌ Error generating wellness report:', error);
        throw error;
    }
}
