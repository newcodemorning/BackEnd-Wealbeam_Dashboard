import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate HTML for the student two-days comparison report
 * @param {Object} data - The comparison data from responseService.getStudentStatusCompareTwoDays()
 * @param {string} qrCodeDataURL - QR code image data URL
 */
export function generateStudentCompareTwoDaysHTML(data, qrCodeDataURL) {
    const { student, questions, day1, day2 } = data;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'green': return '#10b981';
            case 'yellow': return '#f59e0b';
            case 'red': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'green': return 'rgba(16,185,129,0.12)';
            case 'yellow': return 'rgba(245,158,11,0.12)';
            case 'red': return 'rgba(239,68,68,0.12)';
            default: return 'rgba(156,163,175,0.12)';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'green': return '● Safe';
            case 'yellow': return '● Caution';
            case 'red': return '● At Risk';
            default: return '— N/A';
        }
    };

    // Build a lookup: questionId → answer info, for each day
    const buildAnswerMap = (dayData) => {
        if (!dayData.response) return {};
        const map = {};
        for (const a of dayData.response.answers) {
            map[a.question.id.toString()] = a;
        }
        return map;
    };

    const map1 = buildAnswerMap(day1);
    const map2 = buildAnswerMap(day2);

    // Helper: render a single answer cell
    const renderAnswer = (answer) => {
        if (!answer) return `<span style="color:#9ca3af;font-style:italic;">No answer</span>`;
        const color = getStatusColor(answer.status);
        const bg = getStatusBg(answer.status);
        return `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <span style="font-weight:700;font-size:13px;color:#1f2937;">${answer.answer}</span>
                <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;
                    background:${bg};color:${color};">${getStatusLabel(answer.status)}</span>
                ${answer.trend ? `<span style="font-size:10px;color:#6b7280;">Trend: ${answer.trend}</span>` : ''}
            </div>
        `;
    };

    // Overall status for each day (worst answer wins)
    const getOverallStatus = (dayData) => {
        if (!dayData.response) return null;
        const statuses = dayData.response.answers.map(a => a.status);
        if (statuses.includes('red')) return 'red';
        if (statuses.includes('yellow')) return 'yellow';
        if (statuses.includes('green')) return 'green';
        return null;
    };

    const status1 = getOverallStatus(day1);
    const status2 = getOverallStatus(day2);

    const generatedAt = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const schoolLogo = "https://firebasestorage.googleapis.com/v0/b/luxor-uni.firebasestorage.app/o/download.png?alt=media&token=f8545be9-1b48-4bb9-9162-79ccb5854593";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Comparison Report — ${student.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
            --primary: #1ba927;
            --primary-light: #9dff51;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #fff;
            color: var(--gray-800);
            line-height: 1.5;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container { max-width: 210mm; margin: 0 auto; padding: 12px; }

        /* ── Header ── */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 3px solid var(--primary);
            margin-bottom: 12px;
        }

        .logo-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .logo-image {
            height: 20px;
            object-fit: contain;
            border-radius: 8px;
        }

        .logo-tagline {
            font-size: 10px;
            color: var(--gray-600);
            font-weight: 500;
            line-height: 1.4;
            max-width: 250px;
        }

        .qr-code img { width: 64px; height: 64px; border-radius: 6px; }

        /* ── Report Info Section ── */
        .report-info {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid var(--gray-200);
        }
        .report-info .student-details h1 {
            font-size: 20px;
            font-weight: 800;
            color: var(--gray-900);
            margin-bottom: 4px;
        }
        .report-info .student-details .subtitle {
            font-size: 13px;
            color: var(--primary);
            font-weight: 600;
        }
        .report-info .student-details .meta {
            font-size: 11px;
            color: var(--gray-500);
            margin-top: 4px;
        }
        .report-info .date-details {
            text-align: right;
        }
        .report-info .date-details .report-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 4px;
        }
        .report-info .date-details .gen-at {
            font-size: 11px;
            color: var(--gray-500);
        }

        /* ── Day Status Cards ── */
        .days-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 22px;
        }
        .day-summary-card {
            border-radius: 12px;
            padding: 16px;
            border: 2px solid var(--gray-200);
        }
        .day-summary-card.responded {
            border-color: var(--primary);
            background: rgba(27,169,39,0.04);
        }
        .day-summary-card.not-responded {
            border-color: var(--gray-300);
            background: var(--gray-50);
        }
        .day-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--gray-500);
            margin-bottom: 6px;
        }
        .day-date {
            font-size: 14px;
            font-weight: 700;
            color: var(--gray-900);
            margin-bottom: 10px;
        }
        .day-status-badge {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .day-status-badge.green { background: rgba(16,185,129,0.15); color: #059669; }
        .day-status-badge.yellow { background: rgba(245,158,11,0.15); color: #d97706; }
        .day-status-badge.red { background: rgba(239,68,68,0.15); color: #dc2626; }
        .day-status-badge.none { background: var(--gray-100); color: var(--gray-500); }
        .day-time { font-size: 10px; color: var(--gray-500); }

        /* ── Comparison Table ── */
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--gray-200);
        }
        .section-title .icon {
            width: 26px; height: 26px;
            background: var(--primary);
            border-radius: 7px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 12px; font-weight: 700;
        }
        .section-title h2 { font-size: 15px; font-weight: 700; color: var(--gray-800); }

        .compare-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .compare-table th {
            padding: 12px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
        }
        .compare-table th:first-child {
            background: var(--gray-800);
            color: white;
        }
        .compare-table th.day1-header {
            background: #0f5132;
            color: white;
        }
        .compare-table th.day2-header {
            background: #084298;
            color: white;
        }
        .compare-table td {
            padding: 11px 14px;
            border-bottom: 1px solid var(--gray-100);
            vertical-align: top;
        }
        .compare-table tr:last-child td { border-bottom: none; }
        .compare-table tr:hover { background: var(--gray-50); }
        .compare-table .question-cell {
            font-weight: 600;
            color: var(--gray-800);
            font-size: 12px;
            word-wrap: break-word;
            min-width: 180px;
        }
        .compare-table .question-type-tag {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
            background: var(--gray-100);
            color: var(--gray-600);
            margin-top: 4px;
        }

        /* ── No-Answer Banner ── */
        .no-answer-banner {
            background: var(--gray-50);
            border: 1px dashed var(--gray-300);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            color: var(--gray-500);
            font-size: 12px;
            font-style: italic;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 2px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: var(--gray-500);
        }
        .footer .confidential { font-weight: 700; color: var(--danger); }
    </style>
</head>
<body>
<div class="container">

    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            <img class="logo-image" alt="Logo" src="${schoolLogo}">
            <div class="logo-tagline">
                Empowering Mental Wellbeing<br>
                for Schools and Organisations
            </div>
        </div>
        ${qrCodeDataURL ? `<div class="qr-code"><img src="${qrCodeDataURL}" alt="QR Code" /></div>` : ''}
    </div>

    <!-- Student Information -->
    <section class="report-info">
        <div class="student-details">
            <h1>${student.name}</h1>
            <div class="subtitle">Student Comparison Report</div>
            <div class="meta">Subject: ${student.subject} &nbsp;|&nbsp; ID: ${student.id}</div>
        </div>
        <div class="date-details">
            <div class="report-title">Two-Day Comparison</div>
            <div class="gen-at">Generated: ${generatedAt}</div>
        </div>
    </section>

    <!-- Day Summary Cards -->
    <div class="days-summary">
        <!-- Day 1 -->
        <div class="day-summary-card ${day1.responded ? 'responded' : 'not-responded'}">
            <div class="day-label">Day 1</div>
            <div class="day-date">${formatDate(day1.date)}</div>
            ${day1.responded
            ? `<div class="day-status-badge ${status1 || 'none'}">${getStatusLabel(status1)}</div>
                   <div class="day-time">Submitted at: ${formatTime(day1.response?.timestamp)}</div>`
            : `<div class="day-status-badge none">Not Responded</div>
                   <div class="day-time">No submission on this day</div>`
        }
        </div>
        <!-- Day 2 -->
        <div class="day-summary-card ${day2.responded ? 'responded' : 'not-responded'}">
            <div class="day-label">Day 2</div>
            <div class="day-date">${formatDate(day2.date)}</div>
            ${day2.responded
            ? `<div class="day-status-badge ${status2 || 'none'}">${getStatusLabel(status2)}</div>
                   <div class="day-time">Submitted at: ${formatTime(day2.response?.timestamp)}</div>`
            : `<div class="day-status-badge none">Not Responded</div>
                   <div class="day-time">No submission on this day</div>`
        }
        </div>
    </div>

    <!-- Answer Comparison Table -->
    <div class="section-title">
        <div class="icon">Q</div>
        <h2>Answer Comparison</h2>
    </div>

    ${(!day1.responded && !day2.responded)
            ? `<div class="no-answer-banner">No responses found for either day. Nothing to compare.</div>`
            : `
    <table class="compare-table">
        <thead>
            <tr>
                <th>Question</th>
                <th class="day1-header">${day1.date} (Day 1)</th>
                <th class="day2-header">${day2.date} (Day 2)</th>
            </tr>
        </thead>
        <tbody>
            ${(() => {
            const allQuestionsMap = {}; 
            
                const getSafeText = (val) => {
                    if (!val) return 'N/A';
                    if (typeof val === 'string') return val;
                    if (typeof val === 'object') {
                        if (val.en || val.ar) return val.en || val.ar;
                        const str = String(val);
                        return (str && str !== '[object Object]') ? str : 'N/A';
                    }
                    return String(val);
                };

                const getQuestionKey = (qId, qText) => {
                    if (qText && qText !== 'N/A') return qText.toLowerCase().trim();
                    return qId;
                };

                // Seed from questions array
                for (const q of questions) {
                    const qId = String(q.id || q._id || '');
                    const qText = getSafeText(q.text);
                    const qType = q.type || '';
                    if (qId) {
                        const key = getQuestionKey(qId, qText);
                        if (!allQuestionsMap[key]) {
                            allQuestionsMap[key] = { id: qId, text: qText, type: qType, ids: [qId] };
                        } else {
                            if (!allQuestionsMap[key].ids.includes(qId)) allQuestionsMap[key].ids.push(qId);
                        }
                    }
                }

                // Override/add from answers
                for (const src of [day1, day2]) {
                    if (src.response) {
                        for (const a of src.response.answers) {
                            const qId = String(a.question?.id || '');
                            const qText = getSafeText(a.question?.text);
                            const qType = a.question?.type || '';
                            if (qId) {
                                const key = getQuestionKey(qId, qText);
                                if (!allQuestionsMap[key]) {
                                    allQuestionsMap[key] = { id: qId, text: qText, type: qType, ids: [qId] };
                                } else {
                                    if (qText !== 'N/A') allQuestionsMap[key].text = qText;
                                    if (qType) allQuestionsMap[key].type = qType;
                                    if (!allQuestionsMap[key].ids.includes(qId)) allQuestionsMap[key].ids.push(qId);
                                }
                            }
                        }
                    }
                }

                return Object.values(allQuestionsMap).map((q, idx) => {
                    const a1 = q.ids.reduce((found, id) => found || map1[id], null);
                    const a2 = q.ids.reduce((found, id) => found || map2[id], null);
                    const rowBg = idx % 2 === 0 ? '#fff' : '#f9fafb';
                    return `
                    <tr style="background:${rowBg};">
                        <td class="question-cell">
                            <span style="font-size:10px;color:#9ca3af;font-weight:500;">#${idx + 1}</span><br/>
                            <strong>${q.text}</strong>
                            <div style="margin-top:4px;"><span class="question-type-tag">${q.type}</span></div>
                        </td>
                        <td>${renderAnswer(a1)}</td>
                        <td>${renderAnswer(a2)}</td>
                    </tr>`;
                }).join('');
            })()}
        </tbody>
    </table>`
        }

    <!-- Footer -->
    <div class="footer">
        <div><span class="confidential">CONFIDENTIAL</span> — For authorized personnel only</div>
        <div>WeAllBeam Wellness Platform &nbsp;|&nbsp; ${generatedAt}</div>
    </div>

</div>
</body>
</html>`;
}
