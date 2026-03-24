import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate the HTML for the School Exam Summary PDF report.
 * @param {Object} data  - result of responseService.getSchoolExamSummary()
 * @param {string} qrCodeDataURL - base64 QR code image
 * @param {string|null} note - optional note from the request body
 */
export function generateSchoolExamSummaryHTML(data, qrCodeDataURL, note = null) {
    const school = data.school || {};
    const statistics = data.statistics || { totalStudents: 0, answeredCount: 0, notAnsweredCount: 0 };
    const questions = data.questions || [];
    const generatedAt = data.generatedAt || new Date().toISOString();

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statusLabel = (s) => {
        if (s === 'green') return 'Good';
        if (s === 'yellow') return 'Moderate';
        return 'At Risk';
    };

    const statusBgColor = (s) => {
        if (s === 'green') return 'rgba(16,185,129,0.12)';
        if (s === 'yellow') return 'rgba(245,158,11,0.12)';
        return 'rgba(239,68,68,0.12)';
    };

    const statusTextColor = (s) => {
        if (s === 'green') return '#059669';
        if (s === 'yellow') return '#d97706';
        return '#dc2626';
    };

    const statusDotColor = (s) => {
        if (s === 'green') return '#10b981';
        if (s === 'yellow') return '#f59e0b';
        return '#ef4444';
    };

    const renderDistribution = (distribution, type) => {
        const entries = Object.entries(distribution);
        if (!entries.length) return '<span style="color:#9ca3af;font-style:italic;">No answers</span>';

        if (type === 'slider') {
            const total = entries.reduce((acc, [, v]) => acc + v, 0);
            return entries.sort((a, b) => Number(a[0]) - Number(b[0])).map(([val, cnt]) => {
                const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                return `<div style="margin-bottom:4px;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
                        <span>Value: <strong>${val}</strong></span><span>${cnt} answers (${pct}%)</span>
                    </div>
                    <div style="background:#e5e7eb;border-radius:4px;height:6px;overflow:hidden;">
                        <div style="width:${pct}%;background:#1ba927;height:100%;border-radius:4px;"></div>
                    </div>
                </div>`;
            }).join('');
        }

        return entries.map(([val, cnt]) =>
            `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;background:#f3f4f6;color:#374151;">${val}: ${cnt}</span>`
        ).join('');
    };

    const questionsHTML = questions.map((q, idx) => {
        const total = statistics.totalStudents;
        const answered = q.answeredCount;
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
        const avs = q.averageStatus || 'green';
        return `
        <div class="question-card">
            <div class="question-header">
                <div class="question-num">Q${idx + 1}</div>
                <div class="question-text">${q.text}</div>
                <div class="question-type">${q.type}</div>
            </div>
            <div class="question-body">
                <div class="answered-row">
                    <div class="answered-stats">
                        <span class="stat-pill blue">${q.answeredCount} total answers</span>
                        <span class="stat-pill green-light">${q.uniqueStudentsCount} unique students</span>
                        <span class="stat-pill gray">${q.notAnsweredCount} not answered</span>
                    </div>
                    <div class="status-badge" style="background:${statusBgColor(avs)};color:${statusTextColor(avs)};">
                        <span class="dot" style="background:${statusDotColor(avs)};"></span>
                        ${statusLabel(avs)}
                    </div>
                </div>
                <div class="progress-wrap">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width:${pct}%;background:${statusDotColor(avs)};"></div>
                    </div>
                    <span class="progress-label">${pct}% response rate</span>
                </div>
                <div class="distribution-section">
                    <div class="distribution-label">Answer Distribution</div>
                    <div class="distribution-body">
                        ${renderDistribution(q.distribution, q.type)}
                    </div>
                </div>
                <div class="status-counts-row">
                    <span class="sc green">🟢 ${q.statusCounts.green} Good</span>
                    <span class="sc yellow">🟡 ${q.statusCounts.yellow} Moderate</span>
                    <span class="sc red">🔴 ${q.statusCounts.red} At Risk</span>
                </div>
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Exam Summary Report - ${school.name || 'School'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root {
            --primary: #1ba927;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-500: #6b7280;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            color: var(--gray-800);
            font-size: 12px;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 12px; }
        .stat-pill.green-light { background:rgba(16,185,129,0.12); color:#059669; }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 3px solid var(--primary);
            margin-bottom: 14px;
        }
        .logo-section { display:flex; flex-direction:column; gap:6px; }
        .logo-image { height: 22px; object-fit: contain; }
        .logo-tagline { font-size:10px; color:var(--gray-500); font-weight:500; }
        .qr-code img { width:60px; height:60px; border-radius:6px; }

        /* Report Info */
        .report-info {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .school-details h1 { font-size:18px; font-weight:800; color:var(--gray-900); margin-bottom:3px; }
        .school-details .subtitle { font-size:12px; color:var(--primary); font-weight:600; margin-bottom:6px; }
        .school-details .info-row { font-size:10px; color:var(--gray-500); margin-top:2px; }
        .date-details { text-align:right; }
        .date-details .generated { font-size:10px; color:var(--gray-500); }

        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 22px;
        }
        .summary-card {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            padding: 14px;
            text-align: center;
        }
        .summary-card.highlight { background: var(--primary); border: none; }
        .summary-card .value { font-size:28px; font-weight:800; color:var(--gray-900); margin-bottom:4px; }
        .summary-card.highlight .value { color:#fff; }
        .summary-card .label { font-size:10px; color:var(--gray-500); font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
        .summary-card.highlight .label { color:rgba(255,255,255,.8); }

        /* Section title */
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--gray-200);
        }
        .section-title h2 { font-size:15px; font-weight:700; color:var(--gray-800); }
        .section-title .icon {
            width:26px; height:26px; background:var(--primary);
            border-radius:8px; display:flex; align-items:center;
            justify-content:center; color:#fff; font-size:13px; font-weight:700;
        }

        /* Question Cards Grid */
        .questions-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:14px; margin-bottom:24px; }
        .question-card {
            background: #fff;
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .question-header {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: var(--gray-800);
            color: #fff;
            padding: 10px 12px;
        }
        .question-num {
            background: var(--primary);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            border-radius: 6px;
            padding: 2px 7px;
            white-space: nowrap;
        }
        .question-text { flex:1; font-size:11px; font-weight:600; line-height:1.4; }
        .question-type {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            background: rgba(255,255,255,.15);
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .question-body { padding: 10px 12px; }

        .answered-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px; }
        .answered-stats { display:flex; gap:6px; flex-wrap:wrap; }
        .stat-pill { font-size:10px; font-weight:600; padding:3px 8px; border-radius:12px; }
        .stat-pill.blue { background:rgba(59,130,246,.12); color:#2563eb; }
        .stat-pill.gray { background:rgba(107,114,128,.12); color:#4b5563; }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
        }
        .dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

        .progress-wrap { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .progress-bar-bg { flex:1; background:var(--gray-200); border-radius:4px; height:7px; overflow:hidden; }
        .progress-bar-fill { height:100%; border-radius:4px; }
        .progress-label { font-size:10px; color:var(--gray-500); white-space:nowrap; }

        .distribution-section { margin-bottom:8px; }
        .distribution-label { font-size:10px; font-weight:600; color:var(--gray-700); margin-bottom:4px; }
        .distribution-body { font-size:10px; }

        .status-counts-row { display:flex; gap:10px; flex-wrap:wrap; }
        .sc { font-size:10px; font-weight:600; }
        .sc.green { color:#059669; }
        .sc.yellow { color:#d97706; }
        .sc.red { color:#dc2626; }

        /* Note Box */
        .note-box {
            background: rgba(27,169,39,.07);
            border-left: 4px solid var(--primary);
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
            font-size: 11px;
            color: var(--gray-700);
        }
        .note-box strong { color: var(--primary); }

        /* Footer */
        .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 2px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: var(--gray-500);
        }

        @media print {
            .container { padding: 0; }
            .question-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
<div class="container">

    <!-- Header -->
    <header class="header">
        <div class="logo-section">
            <img class="logo-image" alt="Logo" src="https://firebasestorage.googleapis.com/v0/b/luxor-uni.firebasestorage.app/o/download.png?alt=media&token=f8545be9-1b48-4bb9-9162-79ccb5854593">
            <div class="logo-tagline">School Exam Summary Report — Questions Overview</div>
        </div>
        ${qrCodeDataURL ? `<div class="qr-code"><img src="${qrCodeDataURL}" alt="QR Code"></div>` : ''}
    </header>

    <!-- School Info -->
    <div class="report-info">
        <div class="school-details">
            <h1>${school.name || 'School'}</h1>
            <div class="subtitle">Exam Summary Report</div>
            <div class="info-row">Email: ${school.email || 'N/A'} &nbsp;|&nbsp; Phone: ${school.phone || 'N/A'}</div>
            <div class="info-row">Address: ${school.address || 'N/A'}</div>
            <div class="info-row">Teachers: ${school.teachersCount || 0}</div>
        </div>
        <div class="date-details">
            <div class="generated">Generated: ${formatDateTime(generatedAt)}</div>
        </div>
    </div>

    ${note ? `<div class="note-box"><strong>Note:</strong> ${note}</div>` : ''}

    <!-- Summary Cards -->
    <div class="summary-grid">
        <div class="summary-card highlight">
            <div class="value">${statistics.totalStudents}</div>
            <div class="label">Total Students</div>
        </div>
        <div class="summary-card">
            <div class="value" style="color:#059669;">${statistics.answeredCount}</div>
            <div class="label">Unique Students</div>
        </div>
        <div class="summary-card">
            <div class="value" style="color:#2563eb;">${statistics.totalExamsTaken || 0}</div>
            <div class="label">Total Exams</div>
        </div>
        <div class="summary-card">
            <div class="value" style="color:#dc2626;">${statistics.notAnsweredCount}</div>
            <div class="label">Not Answered</div>
        </div>
    </div>

    <!-- Questions Section -->
    <div class="section-title">
        <div class="icon">Q</div>
        <h2>Questions Summary (${questions.length} Questions)</h2>
    </div>

    ${questions.length > 0
        ? `<div class="questions-grid">${questionsHTML}</div>`
        : '<p style="color:#9ca3af;font-style:italic;padding:16px;">No questions found.</p>'}

    <!-- Footer -->
    <div class="footer">
        <span>School Exam Summary Report &mdash; ${school.name || 'School'}</span>
        <span>Generated: ${formatDateTime(generatedAt)}</span>
        <span style="color:#ef4444;font-weight:600;">CONFIDENTIAL</span>
    </div>

</div>
</body>
</html>`;
}
