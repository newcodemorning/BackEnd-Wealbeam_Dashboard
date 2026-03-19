import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
// import { generateMockWellnessData } from './mockData.js';
import { generateWellnessReportHTML as generateDailyReportHTML } from './htmlTemplateForDaily.js';
import { generateWellnessReportHTML, generateStudentsStatusReportHTML } from './htmlTemplate.js';
import { generateClassStudentsStatusReportHTML } from './htmlTemplateClass.js';
import { generateStudentCompareTwoDaysHTML } from './htmlTemplateStudentCompare.js';
import { generateSchoolExamSummaryHTML } from './htmlTemplateExamSummarySchool.js';
import { generateClassExamSummaryHTML } from './htmlTemplateExamSummaryClass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportsDir = path.join(__dirname, '..', '..', 'uploads', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Generate wellness analytics report with PDF output
 * @param {Object} apiData - Optional API data in format { success: true, data: {...} }
 */
export async function generateAnalyticsReport(apiData = null, note = null) {
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

        // Use the daily template for analytics/wellness reports
        const htmlContent = generateDailyReportHTML(wellnessData, qrCodeDataURL, note);

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
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };

    } catch (error) {
        console.error('❌ Error generating wellness report:', error);
        throw error;
    }
}


/**
 * Generate students status report with PDF output
 * @param {Object} apiData - API data in format { success: true, data: {...} }
 */
export async function generateStudentsStatusReport(apiData = null, note = null) {
    try {
        const statusData = apiData?.data;

        if (!statusData) {
            throw new Error('No status data provided for report generation');
        }

        // Generate QR Code
        const reportId = `STUDENTS_STATUS_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200,
            margin: 1,
            color: {
                dark: '#1ba927',
                light: '#FFFFFF'
            }
        });

        // Generate HTML content
        const htmlContent = generateStudentsStatusReportHTML(statusData, qrCodeDataURL, note);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName;
        let isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer for Students Status Report...');
            const puppeteer = await import('puppeteer');

            const pdfFileName = `students_status_report_${dateStr}_${timeStr}.pdf`;
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
            console.log(`✅ Students Status PDF report generated successfully: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            console.log('⚠️ Falling back to HTML format...');

            const htmlFileName = `students_status_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
            isPDF = false;
            console.log(`✅ Students Status HTML report generated: ${htmlFileName}`);
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };

    } catch (error) {
        console.error('❌ Error generating students status report:', error);
        throw error;
    }
}


/**
 * Generate class students status report with detailed questions and answers as PDF output
 * @param {Object} apiData - API data in format { success: true, data: {...} }
 */
export async function generateClassStudentsStatusReport(apiData = null, note = null) {
    try {
        const statusData = apiData?.data;

        if (!statusData) {
            throw new Error('No status data provided for report generation');
        }

        // Generate QR Code
        const reportId = `CLASS_STUDENTS_STATUS_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200,
            margin: 1,
            color: {
                dark: '#1ba927',
                light: '#FFFFFF'
            }
        });

        // Generate HTML content using the new class-specific template
        const htmlContent = generateClassStudentsStatusReportHTML(statusData, qrCodeDataURL, note);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName;
        let isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer for Class Students Status Report...');
            const puppeteer = await import('puppeteer');

            const pdfFileName = `class_students_status_report_${dateStr}_${timeStr}.pdf`;
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
            console.log(`✅ Class Students Status PDF report generated successfully: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            console.log('⚠️ Falling back to HTML format...');

            const htmlFileName = `class_students_status_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
            isPDF = false;
            console.log(`✅ Class Students Status HTML report generated: ${htmlFileName}`);
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };

    } catch (error) {
        console.error('❌ Error generating class students status report:', error);
        throw error;
    }
}


/**
 * Generate a student two-days comparison report as PDF
 * @param {Object} apiData - { success: true, data: { student, questions, day1, day2 } }
 */
export async function generateStudentCompareTwoDaysReport(apiData = null) {
    try {
        const compareData = apiData?.data;

        if (!compareData) {
            throw new Error('No comparison data provided for report generation');
        }

        // Generate QR Code
        const reportId = `STUDENT_COMPARE_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200,
            margin: 1,
            color: { dark: '#1ba927', light: '#FFFFFF' }
        });

        const htmlContent = generateStudentCompareTwoDaysHTML(compareData, qrCodeDataURL);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName;
        let isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer for Student Compare Report...');
            const puppeteer = await import('puppeteer');

            const pdfFileName = `student_compare_report_${dateStr}_${timeStr}.pdf`;
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

            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });

            await page.pdf({
                path: pdfFilePath,
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: false,
                margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' }
            });

            await browser.close();
            finalFilePath = pdfFilePath;
            finalFileName = pdfFileName;
            isPDF = true;
            console.log(`✅ Student Compare PDF report generated: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            console.log('⚠️ Falling back to HTML format...');

            const htmlFileName = `student_compare_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');

            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
            isPDF = false;
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };

    } catch (error) {
        console.error('❌ Error generating student compare report:', error);
        throw error;
    }
}


/**
 * Generate a school exam summary report as PDF
 * @param {Object} apiData - { success: true, data: { school, statistics, questions } }
 * @param {string|null} note
 */
export async function generateSchoolExamSummaryReport(apiData = null, note = null) {
    try {
        const summaryData = apiData?.data;
        if (!summaryData) throw new Error('No summary data provided for school exam summary report');

        const reportId = `SCHOOL_EXAM_SUMMARY_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200, margin: 1, color: { dark: '#1ba927', light: '#FFFFFF' }
        });

        const htmlContent = generateSchoolExamSummaryHTML(summaryData, qrCodeDataURL, note);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName, isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer for School Exam Summary Report...');
            const puppeteer = await import('puppeteer');
            const pdfFileName = `school_exam_summary_report_${dateStr}_${timeStr}.pdf`;
            const pdfFilePath = path.join(reportsDir, pdfFileName);

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.pdf({
                path: pdfFilePath, format: 'A4', printBackground: true,
                preferCSSPageSize: false,
                margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' }
            });
            await browser.close();

            finalFilePath = pdfFilePath;
            finalFileName = pdfFileName;
            isPDF = true;
            console.log(`✅ School Exam Summary PDF generated: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            const htmlFileName = `school_exam_summary_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };
    } catch (error) {
        console.error('❌ Error generating school exam summary report:', error);
        throw error;
    }
}


/**
 * Generate a class exam summary report as PDF
 * @param {Object} apiData - { success: true, data: { school, class, statistics, questions } }
 * @param {string|null} note
 */
export async function generateClassExamSummaryReport(apiData = null, note = null) {
    try {
        const summaryData = apiData?.data;
        if (!summaryData) throw new Error('No summary data provided for class exam summary report');

        const reportId = `CLASS_EXAM_SUMMARY_${Date.now()}`;
        const qrCodeDataURL = await QRCode.toDataURL(reportId, {
            width: 200, margin: 1, color: { dark: '#1ba927', light: '#FFFFFF' }
        });

        const htmlContent = generateClassExamSummaryHTML(summaryData, qrCodeDataURL, note);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].split('.')[0];

        let finalFilePath, finalFileName, isPDF = false;

        try {
            console.log('🔍 Attempting to load Puppeteer for Class Exam Summary Report...');
            const puppeteer = await import('puppeteer');
            const pdfFileName = `class_exam_summary_report_${dateStr}_${timeStr}.pdf`;
            const pdfFilePath = path.join(reportsDir, pdfFileName);

            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.pdf({
                path: pdfFilePath, format: 'A4', printBackground: true,
                preferCSSPageSize: false,
                margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' }
            });
            await browser.close();

            finalFilePath = pdfFilePath;
            finalFileName = pdfFileName;
            isPDF = true;
            console.log(`✅ Class Exam Summary PDF generated: ${pdfFileName}`);
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError.message);
            const htmlFileName = `class_exam_summary_report_${dateStr}_${timeStr}.html`;
            const htmlFilePath = path.join(reportsDir, htmlFileName);
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
            finalFilePath = htmlFilePath;
            finalFileName = htmlFileName;
        }

        return {
            filePath: finalFilePath,
            fileName: finalFileName,
            relativePath: path.relative(process.cwd(), finalFilePath),
            isPDF,
            fileType: isPDF ? 'PDF' : 'HTML',
            downloadUrl: `${process.env.ENVIRONMENT === 'production' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL}/reports/${finalFileName}`
        };
    } catch (error) {
        console.error('❌ Error generating class exam summary report:', error);
        throw error;
    }
}