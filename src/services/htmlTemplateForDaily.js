import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateWellnessReportHTML(data, qrCodeDataURL, note = null) {
    const { meta, summary, dailyOverview, questionsTrend, classesOverview, riskAlerts, schoolName } = data;

    // Provide fallbacks for optional data
    const studentsTimeline = data.studentsTimeline || [];
    const insights = data.insights || [
        'Low response rate detected - investigation recommended',
        'Most classes showing zero engagement',
        'Limited data available for comprehensive analysis'
    ];
    const recommendations = data.recommendations || [
        'Improve daily check-in participation rates',
        'Engage with class coordinators to boost response rates',
        'Schedule follow-up sessions for low-engagement classes',
        'Consider reviewing check-in notification system'
    ];

    // School name fallback
    // const schoolName = meta.schoolName || 'Educational Institution';

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'green': return '#10b981';
            case 'yellow': return '#f59e0b';
            case 'red': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return '^';
            case 'worsening': return 'v';
            case 'stable': return '-';
            case 'missing': return '!';
            default: return '-';
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'improving': return '#10b981';
            case 'worsening': return '#ef4444';
            case 'stable': return '#10b981';
            case 'missing': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Wellness Report - ${schoolName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --primary: #1ba927;
            --primary-light: #9dff51;
            --primary-dark: #059669;
            --success: #1ba927;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: var(--gray-800);
            line-height: 1.6;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 10px;
        }

        /* Header */
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

        .logo {
            height: 20px;
            background: var(--primary);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 28px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .qr-code img {
            width: 70px;
            height: 70px;
            border-radius: 8px;
        }

        /* Report Info Section */
        .report-info {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 10px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .report-info .school-details h1 {
            font-size: 20px;
            font-weight: 800;
            color: var(--gray-900);
            margin-bottom: 4px;
        }

        .report-info .school-details .subtitle {
            font-size: 13px;
            color: var(--primary);
            font-weight: 600;
        }

        .report-info .date-details {
            text-align: right;
        }

        .report-info .date-range {
            font-size: 14px;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 4px;
        }

        .report-info .generated {
            font-size: 11px;
            color: var(--gray-500);
        }

        /* Section Titles */
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--gray-200);
        }

        .section-title h2 {
            font-size: 16px;
            font-weight: 700;
            color: var(--gray-800);
        }

        .section-title .icon {
            width: 28px;
            height: 28px;
            background: var(--primary);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: 700;
        }

        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .summary-card {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }

        .summary-card.highlight {
            background: var(--primary);
            border: none;
            color: white;
        }

        .summary-card .value {
            font-size: 28px;
            font-weight: 800;
            color: var(--gray-900);
            margin-bottom: 4px;
        }

        .summary-card.highlight .value {
            color: white;
        }

        .summary-card .label {
            font-size: 11px;
            color: var(--gray-500);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-card.highlight .label {
            color: rgba(255, 255, 255, 0.8);
        }

        /* Risk Distribution */
        .risk-distribution {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .risk-badge {
            flex: 1;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 12px;
        }

        .risk-badge.green {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .risk-badge.yellow {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }

        .risk-badge.red {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .data-table th {
            background: var(--gray-800);
            color: white;
            padding: 12px 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }

        .data-table td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--gray-100);
            font-size: 12px;
        }

        .data-table tr:last-child td {
            border-bottom: none;
        }

        .data-table tr:hover {
            background: var(--gray-50);
        }

        /* Status Badges */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .status-badge.green {
            background: rgba(16, 185, 129, 0.15);
            color: #059669;
        }

        .status-badge.yellow {
            background: rgba(245, 158, 11, 0.15);
            color: #d97706;
        }

        .status-badge.red {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
        }

        /* Alert Cards */
        .alerts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .alert-card {
            padding: 14px;
            border-radius: 10px;
            border-left: 4px solid;
        }

        .alert-card.high {
            background: rgba(239, 68, 68, 0.08);
            border-color: var(--danger);
        }

        .alert-card.medium {
            background: rgba(245, 158, 11, 0.08);
            border-color: var(--warning);
        }

        .alert-card .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }

        .alert-card .student-name {
            font-weight: 700;
            font-size: 13px;
            color: var(--gray-800);
        }

        .alert-card .alert-level {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
        }

        .alert-card.high .alert-level {
            background: var(--danger);
            color: white;
        }

        .alert-card.medium .alert-level {
            background: var(--warning);
            color: white;
        }

        .alert-card .alert-reason {
            font-size: 11px;
            color: var(--gray-600);
        }

        /* Insights & Recommendations */
        .insights-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
        }

        .insight-box {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 16px;
        }

        .insight-box h3 {
            font-size: 13px;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .insight-box ul {
            list-style: none;
        }

        .insight-box li {
            padding: 8px 0;
            border-bottom: 1px solid var(--gray-200);
            font-size: 11px;
            color: var(--gray-700);
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .insight-box li:last-child {
            border-bottom: none;
        }

        .insight-box li::before {
            content: '*';
            color: var(--primary);
            font-weight: bold;
            font-size: 16px;
            line-height: 1;
        }

        .insight-box.recommendations li::before {
            content: '>';
            color: var(--success);
        }

        /* Daily Chart */
        .daily-chart {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            height: 100px;
            padding: 16px;
            background: var(--gray-50);
            border-radius: 12px;
            margin-bottom: 24px;
        }

        .chart-bar {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .chart-bar .bar {
            width: 100%;
            background: var(--primary);
            border-radius: 4px 4px 0 0;
            min-height: 10px;
        }

        .chart-bar .date {
            font-size: 9px;
            color: var(--gray-500);
            font-weight: 500;
        }

        .chart-bar .value {
            font-size: 10px;
            font-weight: 700;
            color: var(--gray-700);
        }

        /* Trend Indicator */
        .trend {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-weight: 700;
            font-size: 12px;
        }

        /* Questions Section */
        .questions-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .question-card {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 10px;
            padding: 14px;
        }

        .question-card .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            gap: 8px;
        }

        .question-card .question-text {
            font-size: 12px;
            font-weight: 600;
            color: var(--gray-800);
            flex: 1;
        }

        .question-card .question-type {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
            background: var(--primary);
            color: white;
            white-space: nowrap;
        }

        .question-card .question-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .question-card .avg-value {
            font-size: 20px;
            font-weight: 800;
            color: var(--primary);
        }

        /* Progress Bar */
        .progress-bar {
            display: flex;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            background: var(--gray-200);
        }

        .progress-bar .segment {
            height: 100%;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 2px solid var(--gray-200);
            text-align: center;
            color: var(--gray-500);
            font-size: 10px;
        }

        .footer .confidential {
            font-weight: 600;
            color: var(--danger);
            margin-bottom: 4px;
        }

        /* Page Break */
        .page-break {
            page-break-before: always;
        }

        @media print {
            .container {
                padding: 10px;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="header">
            <div class="logo-section">
                <img class="logo-image" alt="Logo" src="https://firebasestorage.googleapis.com/v0/b/luxor-uni.firebasestorage.app/o/download.png?alt=media&token=f8545be9-1b48-4bb9-9162-79ccb5854593">
                <div class="logo-tagline">
                    Empowering Mental Wellbeing<br>
                    for Schools and Organisations
                </div>
            </div>
            ${qrCodeDataURL ? `<div class="qr-code"><img src="${qrCodeDataURL}" alt="QR Code"></div>` : ''}
        </header>

        <!-- Report Information -->
        <section class="report-info">
            <div class="school-details">
                <h1>${schoolName}</h1>
                <div class="subtitle">Student Wellness Analytics Report</div>
            </div>
            <div class="date-details">
                <div class="date-range">${formatDate(meta.dateRange.from)} - ${formatDate(meta.dateRange.to)}</div>
                <div class="generated">Generated: ${formatDateTime(meta.generatedAt)}</div>
            </div>
        </section>

        <!-- Executive Summary -->
        <section>
            <div class="section-title">
                <h2>Executive Summary</h2>
            </div>
            <div class="summary-grid">
                <div class="summary-card highlight">
                    <div class="value">${summary.studentsCount}</div>
                    <div class="label">Total Students</div>
                </div>
                <div class="summary-card">
                    <div class="value">${summary.attendanceRate.toFixed(2)}%</div>
                    <div class="label">Response Rate</div>
                </div>
                <div class="summary-card">
                    <div class="value">${summary.overallAverage > 0 ? summary.overallAverage.toFixed(2) : 'N/A'}</div>
                    <div class="label">Avg. Wellness</div>
                </div>
                <div class="summary-card">
                    <div class="value">${summary.actualResponses}</div>
                    <div class="label">Total Responses</div>
                </div>
            </div>
            <div class="risk-distribution">
                <div class="risk-badge green">[OK] Healthy: ${summary.riskRate.green.toFixed(2)}%</div>
                <div class="risk-badge yellow">[!] At Risk: ${summary.riskRate.yellow.toFixed(2)}%</div>
                <div class="risk-badge red">[X] Critical: ${summary.riskRate.red.toFixed(2)}%</div>
                ${summary.riskRate.absent ? `<div class="risk-badge" style="background: rgba(107, 114, 128, 0.1); color: var(--gray-600);">[?] Absent: ${summary.riskRate.absent.toFixed(2)}%</div>` : ''}
            </div>
        </section>

        <!-- Daily Overview Chart -->
        <section style="margin-top: 18px;">
            <div class="section-title">
                <h2>Daily Wellness Trend</h2>
            </div>
            <div class="daily-chart">
                ${dailyOverview.map(day => {
        const maxHeight = 60;
        const height = day.average > 0 ? (day.average / 10) * maxHeight : 5;
        return `
                    <div class="chart-bar">
                        <div class="value">${day.average > 0 ? day.average.toFixed(1) : '-'}</div>
                        <div class="bar" style="height: ${height}px; ${day.average === 0 ? 'background: var(--gray-300);' : ''}"></div>
                        <div class="date">${formatDate(day.date).split(',')[0]}</div>
                    </div>
                `;
    }).join('')}
            </div>
        </section>

       

        <!-- Questions Analysis -->
        <section>
            <div class="section-title">
                <h2>Questions Analysis</h2>
            </div>
            <div class="questions-grid">
                ${questionsTrend.map((q, index) => {
        let distributionHTML = '';

        if (q.type === 'slider') {
            const entries = Object.entries(q.distribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
            const total = Object.values(q.distribution).reduce((sum, val) => sum + val, 0);
            distributionHTML = `
                            <div class="avg-value">${q.overallAverage.toFixed(2)}/10</div>
                            <div style="font-size: 9px; color: var(--gray-500); margin-top: 4px;">
                                ${entries.map(([val, count]) => `${val}: ${count}`).join(', ')}
                            </div>
                        `;
        } else if (q.type === 'yesno') {
            const total = q.distribution.yes + q.distribution.no;
            const yesPercent = total > 0 ? (q.distribution.yes / total * 100) : 50;
            const noPercent = total > 0 ? (q.distribution.no / total * 100) : 50;
            distributionHTML = `
                            <div class="progress-bar" style="width: 120px;">
                                <div class="segment" style="width: ${yesPercent}%; background: var(--success);"></div>
                                <div class="segment" style="width: ${noPercent}%; background: var(--danger);"></div>
                            </div>
                            <div style="font-size: 9px; color: var(--gray-500); margin-top: 4px;">
                                Yes: ${q.distribution.yes} | No: ${q.distribution.no}
                            </div>
                        `;
        } else if (q.type === 'dropdown') {
            const entries = Object.entries(q.distribution);
            distributionHTML = `
                            <div style="font-size: 10px; color: var(--gray-700);">
                                ${entries.map(([option, count]) => `<div>${option}: ${count}</div>`).join('')}
                            </div>
                        `;
        }

        const questionText = q.text?.en || `Question ${index + 1}`;

        return `
                    <div class="question-card">
                        <div class="question-header">
                            <div class="question-text">${questionText}</div>
                            <div class="question-type">${q.type}</div>
                        </div>
                        <div class="question-stats" style="display: block;">
                            ${distributionHTML}
                        </div>
                    </div>
                `;
    }).join('')}
            </div>
        </section>


         <!-- Classes Overview -->
        <section>
            <div class="section-title">
                 <h2>Classes Performance Overview</h2>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Class Name</th>
                        <th>Students</th>
                        <th>Avg. Score</th>
                        <th>Risk Count</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${classesOverview.sort((a, b) => b.average - a.average).map(cls => `
                        <tr>
                            <td><strong>${cls.className || cls.classId.substring(cls.classId.length - 8)}</strong></td>
                            <td>${cls.studentsCount}</td>
                            <td>${cls.average > 0 ? cls.average.toFixed(2) : '0'}</td>
                            <td>${cls.riskRate}</td>
                            <td><span class="status-badge ${cls.status}">${cls.status.toUpperCase()}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>

        <!-- Risk Alerts -->
        ${riskAlerts && riskAlerts.length > 0 ? `
        <section>
            <div class="section-title">
                <h2>Priority Risk Alerts</h2>
            </div>
            <div class="alerts-grid">
                ${riskAlerts.slice(0, 6).map(alert => `
                    <div class="alert-card ${alert.level}">
                        <div class="alert-header">
                            <span class="student-name">${alert.studentName}</span>
                            <span class="alert-level">${alert.level}</span>
                        </div>
                        <div class="alert-reason">${alert.reason}</div>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : `
        <section>
            <div class="section-title">
                <h2>Risk Alerts</h2>
            </div>
            <div style="padding: 20px; text-align: center; color: var(--gray-500); background: var(--gray-50); border-radius: 12px;">
                No risk alerts detected in the current period
            </div>
        </section>
        `}

        <!-- Insights & Recommendations -->
        <section class="insights-section">
            <div class="insight-box">
                <h3>Key Insights</h3>
                <ul>
                    ${insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
            <div class="insight-box recommendations">
                <h3>Recommendations</h3>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </section>

        ${studentsTimeline.length > 0 ? `
        <!-- Page Break for Students -->
        <div class="page-break"></div>

        <!-- Students Timeline -->
        <section>
            <div class="section-title">
                <div class="icon">U</div>
                <h2>Student Wellness Timeline</h2>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Attendance</th>
                        <th>Trend</th>
                        <th>Risk Flags</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsTimeline.slice(0, 20).map(student => `
                        <tr>
                            <td><strong>${student.name}</strong></td>
                            <td>${student.class}</td>
                            <td>${student.attendanceRate}%</td>
                            <td>
                                <span class="trend" style="color: ${getTrendColor(student.trend)};">
                                    ${getTrendIcon(student.trend)} ${student.trend}
                                </span>
                            </td>
                            <td>
                                ${student.riskFlags.length > 0
            ? student.riskFlags.map(flag => `<span class="status-badge red">${flag}</span>`).join(' ')
            : '<span class="status-badge green">None</span>'
        }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
        ` : ''}

        <!-- Note Section -->
        ${note ? `
        <section style="margin-top: 24px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--gray-200);">
                <h2 style="font-size: 16px; font-weight: 700; color: var(--gray-800);">&#x1F4DD; Note</h2>
            </div>
            <div style="background: var(--gray-50); border-left: 4px solid var(--primary); border-radius: 8px; padding: 16px; font-size: 13px; color: var(--gray-800); line-height: 1.7; white-space: pre-wrap;">${note}</div>
        </section>
        ` : ''}

        <!-- Footer -->
        <footer class="footer">
            <div>This report was automatically generated by the System</div>
            <div>${new Date().getFullYear()} weallbeam - All Rights Reserved</div>
        </footer>
    </div>
</body>
</html>
    `;
}

// Keep backward compatibility
export function generateAnalyticsReportHTML(analyticsData, qrCodeDataURL) {
    return generateWellnessReportHTML(analyticsData, qrCodeDataURL);
}