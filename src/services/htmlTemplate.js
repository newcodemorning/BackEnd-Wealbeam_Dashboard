import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateWellnessReportHTML(data, qrCodeDataURL) {
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

    // Create school object from available data
    const school = data.school || {
        name: schoolName || meta?.schoolName || 'Educational Institution',
        email: meta?.email || 'N/A',
        phone: meta?.phone || 'N/A',
        address: meta?.address || 'N/A',
        teachersCount: meta?.teachersCount || 0
    };

    // Get statistics and other data with fallbacks
    const statistics = data.statistics || {
        totalStudents: summary?.totalStudents || 0,
        totalClasses: classesOverview?.length || 0,
        statusDistribution: summary?.statusBreakdown || { green: 0, yellow: 0, red: 0, not_answered: 0 },
        statusPercentage: {
            green: summary?.statusBreakdown?.green ? Math.round((summary.statusBreakdown.green / (summary.totalStudents || 1)) * 100) : 0,
            yellow: summary?.statusBreakdown?.yellow ? Math.round((summary.statusBreakdown.yellow / (summary.totalStudents || 1)) * 100) : 0,
            red: summary?.statusBreakdown?.red ? Math.round((summary.statusBreakdown.red / (summary.totalStudents || 1)) * 100) : 0,
            not_answered: summary?.statusBreakdown?.not_answered ? Math.round((summary.statusBreakdown.not_answered / (summary.totalStudents || 1)) * 100) : 0
        }
    };

    const classes = data.classes || classesOverview || [];
    const generatedAt = data.generatedAt || meta?.generatedAt || new Date().toISOString();

    // Helper function to safely get status distribution
    const getClassStatusDistribution = (cls) => {
        return cls.statusDistribution || cls.statusBreakdown || { green: 0, yellow: 0, red: 0, not_answered: 0 };
    };

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
    <title>Student Wellness Report - ${school.name}</title>
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

        /* Class Card */
        .class-card {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 10px;
            margin-bottom: 16px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .class-header {
            background: var(--gray-800);
            color: white;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .class-header .class-name {
            font-size: 13px;
            font-weight: 700;
        }

        .class-header .class-info {
            font-size: 10px;
            opacity: 0.8;
        }

        .class-summary {
            display: flex;
            gap: 6px;
            padding: 8px 14px;
            background: var(--gray-50);
            border-bottom: 1px solid var(--gray-200);
        }

        .class-stat {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
        }

        .class-stat.green {
            background: rgba(16, 185, 129, 0.15);
            color: #059669;
        }

        .class-stat.yellow {
            background: rgba(245, 158, 11, 0.15);
            color: #d97706;
        }

        .class-stat.red {
            background: rgba(239, 68, 68, 0.15);
            color: #dc2626;
        }

        .class-stat.gray {
            background: rgba(107, 114, 128, 0.15);
            color: #4b5563;
        }

        /* Classes Table */
        .classes-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }

        .classes-table th {
            background: var(--gray-800);
            color: white;
            padding: 10px 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }

        .classes-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--gray-100);
            font-size: 11px;
        }

        .classes-table tr:last-child td {
            border-bottom: none;
        }

        .classes-table tr:hover {
            background: var(--gray-50);
        }

        .classes-table .class-name-cell {
            font-weight: 700;
            color: var(--gray-800);
        }

        .classes-table .status-counts {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }

        .status-count {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
        }

        .status-count.green {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
        }

        .status-count.yellow {
            background: rgba(245, 158, 11, 0.1);
            color: #d97706;
        }

        .status-count.red {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        }

        .status-count.gray {
            background: rgba(107, 114, 128, 0.1);
            color: #4b5563;
        }

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
            .container {
                padding: 0;
            }
            .class-card {
                page-break-inside: avoid;
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
                <span class="logo-tagline">Students Status Report - Comprehensive Overview</span>
            </div>
            <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="Report QR Code">
            </div>
        </header>

        <!-- Report Info -->
        <div class="report-info">
            <div class="school-details">
                <h1>${school.name}</h1>
                <div class="subtitle">Students Wellness Status Report</div>
                <div class="info-row">📧 ${school.email || 'N/A'} | 📞 ${school.phone || 'N/A'}</div>
                <div class="info-row">📍 ${school.address || 'N/A'}</div>
            </div>
            <div class="date-details">
                <div class="generated">Generated: ${formatDateTime(generatedAt)}</div>
                <div class="generated">Teachers: ${school.teachersCount || 0}</div>
            </div>
        </div>

        <!-- Summary Section -->
        <section>
            <div class="section-title">
                <div class="icon">📊</div>
                <h2>School Overview</h2>
            </div>
            
            <div class="summary-grid">
                <div class="summary-card highlight">
                    <div class="value">${statistics.totalStudents}</div>
                    <div class="label">Total Students</div>
                </div>
                <div class="summary-card">
                    <div class="value">${statistics.totalClasses}</div>
                    <div class="label">Total Classes</div>
                </div>
                <div class="summary-card">
                    <div class="value">${school.teachersCount || 0}</div>
                    <div class="label">Teachers</div>
                </div>
                <div class="summary-card">
                    <div class="value">${statistics.statusPercentage.green}%</div>
                    <div class="label">Healthy Rate</div>
                </div>
            </div>

            <!-- Status Distribution -->
            <div class="status-distribution">
                <div class="status-box green">
                    <div class="count">${statistics.statusDistribution.green}</div>
                    <div class="percentage">${statistics.statusPercentage.green}%</div>
                    <div class="label">Healthy</div>
                </div>
                <div class="status-box yellow">
                    <div class="count">${statistics.statusDistribution.yellow}</div>
                    <div class="percentage">${statistics.statusPercentage.yellow}%</div>
                    <div class="label">Attention</div>
                </div>
                <div class="status-box red">
                    <div class="count">${statistics.statusDistribution.red}</div>
                    <div class="percentage">${statistics.statusPercentage.red}%</div>
                    <div class="label">At Risk</div>
                </div>
                <div class="status-box gray">
                    <div class="count">${statistics.statusDistribution.not_answered}</div>
                    <div class="percentage">${statistics.statusPercentage.not_answered}%</div>
                    <div class="label">Not Answered</div>
                </div>
            </div>
        </section>

        <!-- Classes Section -->
        <section>
            <div class="section-title">
                <div class="icon">🏫</div>
                <h2>Classes Summary</h2>
            </div>

            <table class="classes-table">
                <thead>
                    <tr>
                        <th>Class Name</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Students</th>
                        <th>Status Distribution</th>
                    </tr>
                </thead>
                <tbody>
                    ${classes.map(cls => {
        const statusDist = getClassStatusDistribution(cls);
        return `
                        <tr>
                            <td class="class-name-cell">${cls.className || cls.name || 'Unknown'}</td>
                            <td>${cls.subject || 'N/A'}</td>
                            <td>${cls.teacher ? (cls.teacher.name || cls.teacher) : 'No Teacher'}</td>
                            <td><strong>${cls.studentsCount || cls.students?.length || 0}</strong></td>
                            <td>
                                <div class="status-counts">
                                    <span class="status-count green">✓ ${statusDist.green || 0}</span>
                                    <span class="status-count yellow">⚠ ${statusDist.yellow || 0}</span>
                                    <span class="status-count red">✗ ${statusDist.red || 0}</span>
                                    <span class="status-count gray">○ ${statusDist.not_answered || 0}</span>
                                </div>
                            </td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
            </table>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <div>This report was automatically generated by the WeAllBeam System</div>
            <div>${new Date().getFullYear()} WeAllBeam - All Rights Reserved</div>
        </footer>
    </div>
</body>
</html>
    `;
}


/**
 * Generate detailed class students status report HTML with questions and answers
 * @param {Object} data - Class status data with school, statistics, questions, and classes
 * @param {string} qrCodeDataURL - QR code data URL
 */
export function generateClassStudentsStatusReportHTML(data, qrCodeDataURL) {
    const { school, statistics, questions, classes, generatedAt } = data;
    const classData = classes[0]; // Single class

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'green': return '#10b981';
            case 'yellow': return '#f59e0b';
            case 'red': return '#ef4444';
            case 'not_answered': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'green': return 'Healthy';
            case 'yellow': return 'Attention';
            case 'red': return 'At Risk';
            case 'not_answered': return 'Not Answered';
            default: return status;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'green': return '✓';
            case 'yellow': return '⚠';
            case 'red': return '✗';
            case 'not_answered': return '○';
            default: return '○';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return '↗️';
            case 'worsening': return '↘️';
            case 'stable': return '→';
            case 'changed': return '↔️';
            default: return '';
        }
    };

    const getQuestionText = (questionText, lang = 'en') => {
        if (typeof questionText === 'object') {
            return questionText[lang] || questionText.en || 'Unknown Question';
        }
        return questionText || 'Unknown Question';
    };

    // Helper function to safely get status distribution
    const getClassStatusDistribution = (cls) => {
        return cls.statusDistribution || cls.statusBreakdown || { green: 0, yellow: 0, red: 0, not_answered: 0 };
    };

    // Generate student cards with detailed answers
    const generateStudentCards = () => {
        if (!classData || !classData.students) return '';

        return classData.students.map(student => {
            const answersHtml = student.answers && student.answers.length > 0
                ? student.answers.map(answer => `
                    <div class="answer-row">
                        <div class="question-text">${getQuestionText(answer.questionText)}</div>
                        <div class="answer-details">
                            <span class="answer-value">${answer.answer || 'N/A'}</span>
                            <span class="answer-status status-badge ${answer.status}">${getStatusIcon(answer.status)} ${getStatusLabel(answer.status)}</span>
                            ${answer.trend ? `<span class="answer-trend">${getTrendIcon(answer.trend)} ${answer.trend}</span>` : ''}
                        </div>
                    </div>
                `).join('')
                : '<div class="no-answers">No responses recorded</div>';

            return `
                <div class="student-card">
                    <div class="student-header ${student.status}">
                        <div class="student-info">
                            <div class="student-avatar">${student.firstName?.charAt(0) || '?'}${student.lastName?.charAt(0) || ''}</div>
                            <div class="student-details">
                                <div class="student-name">${student.name}</div>
                                <div class="student-meta">
                                    ${student.email ? `📧 ${student.email}` : ''}
                                    ${student.gender ? `| ${student.gender === 'male' ? '👦' : '👧'} ${student.gender}` : ''}
                                    ${student.dateOfBirth ? `| 🎂 ${formatDate(student.dateOfBirth)}` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="student-status-badge ${student.status}">
                            ${getStatusIcon(student.status)} ${getStatusLabel(student.status)}
                        </div>
                    </div>
                    <div class="student-body">
                        <div class="response-info">
                            <span class="last-response">Last Response: ${student.lastResponseDate ? formatDateTime(student.lastResponseDate) : 'Never'}</span>
                            <span class="answers-count">${student.answersCount} answers</span>
                        </div>
                        <div class="answers-container">
                            ${answersHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Return the complete HTML with all sections including student cards
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Class Students Status Report - ${classData?.className || 'Unknown Class'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --primary: #1ba927;
            --success: #1ba927;
            --warning: #f59e0b;
            --danger: #ef4444;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: var(--gray-800);
            line-height: 1.6;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .container { max-width: 210mm; margin: 0 auto; padding: 10px; }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 3px solid var(--primary);
            margin-bottom: 12px;
        }

        .logo-section { display: flex; flex-direction: column; gap: 8px; }
        .logo-image { height: auto; width: 170px; }
        .logo-tagline { font-size: 10px; color: var(--gray-600); font-weight: 500; }
        .qr-code img { width: 70px; height: 70px; border-radius: 8px; }

        .report-info {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 18px;
        }

        .report-info-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .school-details h1 { font-size: 18px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
        .school-details .subtitle { font-size: 12px; color: var(--primary); font-weight: 600; }
        .school-details .info-row { font-size: 11px; color: var(--gray-600); margin-top: 4px; }
        .date-details { text-align: right; }
        .date-details .generated { font-size: 11px; color: var(--gray-500); }

        .class-info-box {
            background: var(--gray-800);
            border-radius: 10px;
            padding: 12px 16px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .class-info-box .class-name { font-size: 16px; font-weight: 700; }
        .class-info-box .class-meta { font-size: 11px; opacity: 0.8; margin-top: 4px; }
        .class-info-box .class-teacher { text-align: right; }
        .class-info-box .teacher-label { font-size: 9px; opacity: 0.6; text-transform: uppercase; }
        .class-info-box .teacher-name { font-size: 12px; font-weight: 600; }

        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 20px 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--gray-200);
        }

        .section-title h2 { font-size: 14px; font-weight: 700; color: var(--gray-800); }
        .section-title .icon {
            width: 24px;
            height: 24px;
            background: var(--primary);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 700;
        }

        .student-card {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 10px;
            margin-bottom: 12px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .student-header {
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--gray-200);
        }

        .student-header.green { background: rgba(16, 185, 129, 0.1); }
        .student-header.yellow { background: rgba(245, 158, 11, 0.1); }
        .student-header.red { background: rgba(239, 68, 68, 0.1); }
        .student-header.not_answered { background: var(--gray-50); }

        .student-info { display: flex; gap: 10px; align-items: center; }
        .student-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
        }

        .student-name { font-size: 13px; font-weight: 700; color: var(--gray-900); }
        .student-meta { font-size: 10px; color: var(--gray-600); margin-top: 2px; }

        .student-status-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
        }

        .student-status-badge.green { background: rgba(16, 185, 129, 0.2); color: #059669; }
        .student-status-badge.yellow { background: rgba(245, 158, 11, 0.2); color: #d97706; }
        .student-status-badge.red { background: rgba(239, 68, 68, 0.2); color: #dc2626; }
        .student-status-badge.not_answered { background: rgba(107, 114, 128, 0.2); color: #4b5563; }

        .student-body { padding: 14px; }

        .response-info {
            display: flex;
            justify-content: space-between;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px solid var(--gray-200);
            font-size: 10px;
            color: var(--gray-600);
        }

        .answers-container { display: flex; flex-direction: column; gap: 8px; }

        .answer-row {
            background: var(--gray-50);
            padding: 8px 10px;
            border-radius: 6px;
            border-left: 3px solid var(--primary);
        }

        .question-text {
            font-size: 11px;
            font-weight: 600;
            color: var(--gray-800);
            margin-bottom: 4px;
        }

        .answer-details {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .answer-value {
            font-size: 11px;
            color: var(--gray-700);
            font-weight: 500;
        }

        .answer-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
        }

        .answer-status.green { background: rgba(16, 185, 129, 0.15); color: #059669; }
        .answer-status.yellow { background: rgba(245, 158, 11, 0.15); color: #d97706; }
        .answer-status.red { background: rgba(239, 68, 68, 0.15); color: #dc2626; }

        .answer-trend { font-size: 10px; color: var(--gray-600); }

        .no-answers {
            text-align: center;
            padding: 20px;
            color: var(--gray-500);
            font-style: italic;
            font-size: 11px;
        }

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
            .student-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo-section">
                <img src="https://media.licdn.com/dms/image/v2/D4D0BAQETzgIJ4yyM2g/company-logo_200_200/company-logo_200_200/0/1718096652188/weallbeam_logo?e=2147483647&v=beta&t=4awN6aJv1K9k3mONOmXv3fYVqH7TJUeV_0F0gzZ5XGA" alt="WeAllBeam Logo" class="logo-image">
                <span class="logo-tagline">Class Students Status Report - Detailed View</span>
            </div>
            <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="Report QR Code">
            </div>
        </header>

        <div class="report-info">
            <div class="report-info-header">
                <div class="school-details">
                    <h1>${school.name}</h1>
                    <div class="subtitle">Class Students Status Report</div>
                    <div class="info-row">📧 ${school.email || 'N/A'} | 📞 ${school.phone || 'N/A'}</div>
                    <div class="info-row">📍 ${school.address || 'N/A'}</div>
                </div>
                <div class="date-details">
                    <div class="generated">Generated: ${formatDateTime(generatedAt)}</div>
                </div>
            </div>
            
            <div class="class-info-box">
                <div>
                    <div class="class-name">📚 ${classData?.className || 'Unknown Class'}</div>
                    <div class="class-meta">Subject: ${classData?.subject || 'N/A'} | Created: ${formatDate(classData?.selectDate)}</div>
                </div>
                <div class="class-teacher">
                    <div class="teacher-label">Teacher</div>
                    <div class="teacher-name">${classData?.teacher?.name || 'No Teacher Assigned'}</div>
                </div>
            </div>
        </div>

        <section>
            <div class="section-title">
                <div class="icon">👥</div>
                <h2>Students Details</h2>
            </div>
            
            ${generateStudentCards()}
        </section>

        <footer class="footer">
            <div>This report was automatically generated by the WeAllBeam System</div>
            <div>${new Date().getFullYear()} WeAllBeam - All Rights Reserved</div>
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


/**
 * Generate HTML template for School Students Status Report
 * @param {Object} data - School students status data
 * @param {string} qrCodeDataURL - QR code data URL
 */
export function generateStudentsStatusReportHTML(data, qrCodeDataURL) {
    const { school, statistics, classes, generatedAt } = data;

    // Helper function to safely get status distribution
    const getClassStatusDistribution = (cls) => {
        return cls.statusDistribution || cls.statusBreakdown || { green: 0, yellow: 0, red: 0, not_answered: 0 };
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>School Report - Students Status - ${school?.name || 'School'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        :root {
            --primary: #1ba927;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #ffffff;
            color: var(--gray-800);
            line-height: 1.6;
            font-size: 11px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 10px; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 14px;
            border-bottom: 3px solid var(--primary);
            margin-bottom: 12px;
        }
        .logo-section { display: flex; flex-direction: column; gap: 8px; }
        .logo-image { height: auto; width: 170px; }
        .logo-tagline { font-size: 10px; color: var(--gray-600); font-weight: 500; }
        .qr-code img { width: 70px; height: 70px; border-radius: 8px; }
        .report-info {
            background: var(--gray-50);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 18px;
        }
        .school-details h1 { font-size: 18px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
        .school-details .subtitle { font-size: 12px; color: var(--primary); font-weight: 600; }
        .school-details .info-row { font-size: 11px; color: var(--gray-600); margin-top: 4px; }
        .date-details { text-align: right; }
        .date-details .generated { font-size: 11px; color: var(--gray-500); }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--gray-200);
        }
        .section-title h2 { font-size: 14px; font-weight: 700; color: var(--gray-800); }
        .section-title .icon {
            width: 24px;
            height: 24px;
            background: var(--primary);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 700;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-radius: 10px;
            padding: 12px;
            text-align: center;
        }
        .summary-card.highlight { background: var(--primary); border: none; color: white; }
        .summary-card .value { font-size: 24px; font-weight: 800; color: var(--gray-900); margin-bottom: 2px; }
        .summary-card.highlight .value { color: white; }
        .summary-card .label {
            font-size: 10px;
            color: var(--gray-500);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-card.highlight .label { color: rgba(255, 255, 255, 0.8); }
        .status-distribution { 
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .status-box { 
            padding: 14px;
            border-radius: 8px;
            text-align: center;
        }
        .status-box.green { background: rgba(16, 185, 129, 0.1); border: 2px solid rgba(16, 185, 129, 0.3); }
        .status-box.yellow { background: rgba(245, 158, 11, 0.1); border: 2px solid rgba(245, 158, 11, 0.3); }
        .status-box.red { background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); }
        .status-box.gray { background: rgba(107, 114, 128, 0.1); border: 2px solid rgba(107, 114, 128, 0.3); }
        .status-box .count { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .status-box.green .count { color: #059669; }
        .status-box.yellow .count { color: #d97706; }
        .status-box.red .count { color: #dc2626; }
        .status-box.gray .count { color: #4b5563; }
        .status-box .percentage { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .status-box .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .classes-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        .classes-table th {
            background: var(--gray-800);
            color: white;
            padding: 10px 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }
        .classes-table td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--gray-100);
            font-size: 11px;
        }
        .classes-table tr:last-child td { border-bottom: none; }
        .classes-table tr:hover { background: var(--gray-50); }
        .classes-table .class-name-cell { font-weight: 700; color: var(--gray-800); }
        .classes-table .status-counts { display: flex; gap: 4px; flex-wrap: wrap; }
        .status-count {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 600;
        }
        .status-count.green { background: rgba(16, 185, 129, 0.1); color: #059669; }
        .status-count.yellow { background: rgba(245, 158, 11, 0.1); color: #d97706; }
        .status-count.red { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
        .status-count.gray { background: rgba(107, 114, 128, 0.1); color: #4b5563; }
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
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo-section">
                <img class="logo-image" alt="Logo" src="https://firebasestorage.googleapis.com/v0/b/luxor-uni.firebasestorage.app/o/download.png?alt=media&token=f8545be9-1b48-4bb9-9162-79ccb5854593">
                <span class="logo-tagline">School Report - Students Status Overview</span>
            </div>
            <div class="qr-code">
                <img src="${qrCodeDataURL}" alt="Report QR Code">
            </div>
        </header>

        <div class="report-info">
            <div class="school-details">
                <h1>${school.name}</h1>
                <div class="subtitle">Students Wellness Status Report</div>
                <div class="info-row">Email: ${school.email || 'N/A'} | Phone: ${school.phone || 'N/A'}</div>
                <div class="info-row">Address: ${school.address || 'N/A'}</div>
            </div>
            <div class="date-details">
                <div class="generated">Generated: ${formatDateTime(generatedAt)}</div>
                <div class="generated">Teachers: ${school.teachersCount || 0}</div>
            </div>
        </div>

        <section>
            <div class="section-title">
                <div class="icon">SC</div>
                <h2>School Overview</h2>
            </div>
            
            <div class="summary-grid">
                <div class="summary-card highlight">
                    <div class="value">${statistics.totalStudents}</div>
                    <div class="label">Total Students</div>
                </div>
                <div class="summary-card">
                    <div class="value">${statistics.totalClasses}</div>
                    <div class="label">Total Classes</div>
                </div>
                <div class="summary-card">
                    <div class="value">${school.teachersCount || 0}</div>
                    <div class="label">Teachers</div>
                </div>
                <div class="summary-card">
                    <div class="value">${statistics.statusPercentage.green}%</div>
                    <div class="label">Healthy Rate</div>
                </div>
            </div>

            <div class="section-title">
                <div class="icon">ST</div>
                <h2>Status Distribution</h2>
            </div>

            <div class="status-distribution">
                <div class="status-box green">
                    <div class="count">${statistics.statusDistribution.green}</div>
                    <div class="percentage">${statistics.statusPercentage.green}%</div>
                    <div class="label">Healthy</div>
                </div>
                <div class="status-box yellow">
                    <div class="count">${statistics.statusDistribution.yellow}</div>
                    <div class="percentage">${statistics.statusPercentage.yellow}%</div>
                    <div class="label">Attention</div>
                </div>
                <div class="status-box red">
                    <div class="count">${statistics.statusDistribution.red}</div>
                    <div class="percentage">${statistics.statusPercentage.red}%</div>
                    <div class="label">At Risk</div>
                </div>
                <div class="status-box gray">
                    <div class="count">${statistics.statusDistribution.not_answered}</div>
                    <div class="percentage">${statistics.statusPercentage.not_answered}%</div>
                    <div class="label">Not Answered</div>
                </div>
            </div>
        </section>

        <section>
            <div class="section-title">
                <div class="icon">CL</div>
                <h2>Classes Summary</h2>
            </div>

            <table class="classes-table">
                <thead>
                    <tr>
                        <th>Class Name</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Students</th>
                        <th>Status Distribution</th>
                    </tr>
                </thead>
                <tbody>
                    ${classes.map(cls => {
        const statusDist = getClassStatusDistribution(cls);
        return `
                        <tr>
                            <td class="class-name-cell">${cls.className || cls.name || 'Unknown'}</td>
                            <td>${cls.subject || 'N/A'}</td>
                            <td>${cls.teacher ? (cls.teacher.name || cls.teacher) : 'No Teacher'}</td>
                            <td><strong>${cls.studentsCount || cls.students?.length || 0}</strong></td>
                            <td>
                                <div class="status-counts">
                                    <span class="status-count green">Healthy: ${statusDist.green || 0}</span>
                                    <span class="status-count yellow">Attention: ${statusDist.yellow || 0}</span>
                                    <span class="status-count red">At Risk: ${statusDist.red || 0}</span>
                                    <span class="status-count gray">Not Answered: ${statusDist.not_answered || 0}</span>
                                </div>
                            </td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
            </table>
        </section>

        <footer class="footer">
            <div>This report was automatically generated by the WeAllBeam System</div>
            <div>${new Date().getFullYear()} WeAllBeam - All Rights Reserved</div>
        </footer>
    </div>
</body>
</html>
    `;
}
