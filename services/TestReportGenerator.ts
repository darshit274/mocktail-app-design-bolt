import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

interface ReportData {
  user: {
    uuid: string;
    name: string;
    email?: string;
  };
  testHistory: Array<{
    testName: string;
    category: string;
    score: number;
    percentage: number;
    rank?: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unanswered: number;
    timeTaken: number;
    completionDate: string;
    difficulty: string;
  }>;
  overallStats: {
    totalTests: number;
    avgScore: number;
    avgPercentage: number;
    bestScore: number;
    worstScore: number;
    avgRank: number;
    bestRank: number;
    totalTimeSpent: number;
    strongSubjects: string[];
    weakSubjects: string[];
  };
  categoryPerformance: Array<{
    category: string;
    testsAttempted: number;
    avgScore: number;
    avgPercentage: number;
    improvement: number;
  }>;
  recentTrends: {
    last7Days: {
      testsAttempted: number;
      avgScore: number;
      improvement: number;
    };
    last30Days: {
      testsAttempted: number;
      avgScore: number;
      improvement: number;
    };
  };
}

export class TestReportGenerator {
  
  /**
   * Generate comprehensive HTML report
   */
  static async generateHTMLReport(data: ReportData): Promise<string> {
    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Performance Report - ${data.user.name}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f8f9fa;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 1.1em;
                opacity: 0.9;
            }
            
            .report-meta {
                text-align: right;
                margin-bottom: 30px;
                color: #666;
                font-size: 0.9em;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            
            .stat-card h3 {
                font-size: 2em;
                margin-bottom: 5px;
                color: #4CAF50;
            }
            
            .stat-card p {
                color: #666;
                font-weight: 500;
            }
            
            .section {
                background: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .section h2 {
                font-size: 1.5em;
                margin-bottom: 20px;
                color: #333;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            
            .test-history-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            
            .test-history-table th,
            .test-history-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            
            .test-history-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #555;
            }
            
            .test-history-table tr:hover {
                background: #f8f9fa;
            }
            
            .score-cell {
                font-weight: 600;
            }
            
            .score-excellent { color: #4CAF50; }
            .score-good { color: #FF9800; }
            .score-poor { color: #F44336; }
            
            .category-performance {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            
            .category-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                background: #fafafa;
            }
            
            .category-card h4 {
                color: #333;
                margin-bottom: 15px;
                font-size: 1.2em;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e0e0e0;
                border-radius: 4px;
                overflow: hidden;
                margin: 10px 0;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                transition: width 0.3s ease;
            }
            
            .insights {
                background: #e8f5e8;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
                margin-top: 20px;
            }
            
            .insights h4 {
                color: #2E7D32;
                margin-bottom: 10px;
            }
            
            .insights ul {
                list-style-type: none;
                padding-left: 0;
            }
            
            .insights li {
                margin-bottom: 8px;
                padding-left: 20px;
                position: relative;
            }
            
            .insights li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #4CAF50;
                font-weight: bold;
            }
            
            .footer {
                text-align: center;
                padding: 30px;
                color: #666;
                border-top: 1px solid #ddd;
                margin-top: 30px;
            }
            
            .logo {
                font-weight: bold;
                color: #667eea;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .category-performance {
                    grid-template-columns: 1fr;
                }
                
                .test-history-table {
                    font-size: 0.9em;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Test Performance Report</h1>
                <p>Comprehensive analysis for ${data.user.name}</p>
            </div>
            
            <div class="report-meta">
                <p>Generated on ${reportDate} at ${reportTime}</p>
                <p>Report Period: ${data.testHistory.length > 0 ? new Date(data.testHistory[data.testHistory.length - 1].completionDate).toLocaleDateString() : 'N/A'} - ${reportDate}</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${data.overallStats.totalTests}</h3>
                    <p>Tests Completed</p>
                </div>
                <div class="stat-card">
                    <h3>${data.overallStats.avgPercentage.toFixed(1)}%</h3>
                    <p>Average Score</p>
                </div>
                <div class="stat-card">
                    <h3>#${data.overallStats.bestRank || 'N/A'}</h3>
                    <p>Best Rank</p>
                </div>
                <div class="stat-card">
                    <h3>${Math.round(data.overallStats.totalTimeSpent / 60)}m</h3>
                    <p>Total Study Time</p>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Performance Overview</h2>
                <p>Your learning journey shows consistent progress across ${data.overallStats.totalTests} tests with an average score of ${data.overallStats.avgPercentage.toFixed(1)}%.</p>
                
                <div class="insights">
                    <h4>Key Insights</h4>
                    <ul>
                        <li>Your best performance was ${data.overallStats.bestScore.toFixed(1)}%, showing your potential</li>
                        <li>Average rank of #${data.overallStats.avgRank.toFixed(0)} demonstrates consistent performance</li>
                        <li>Strong subjects: ${data.overallStats.strongSubjects.join(', ') || 'Building expertise'}</li>
                        <li>Areas for improvement: ${data.overallStats.weakSubjects.join(', ') || 'Well-rounded performance'}</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2>📚 Category Performance</h2>
                <div class="category-performance">
                    ${data.categoryPerformance.map(category => `
                        <div class="category-card">
                            <h4>${category.category}</h4>
                            <p>Tests Attempted: ${category.testsAttempted}</p>
                            <p>Average Score: ${category.avgScore.toFixed(1)}</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${category.avgPercentage}%"></div>
                            </div>
                            <p style="color: ${category.improvement >= 0 ? '#4CAF50' : '#F44336'};">
                                Trend: ${category.improvement >= 0 ? '+' : ''}${category.improvement.toFixed(1)}%
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>🕒 Recent Trends</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h4>Last 7 Days</h4>
                        <p>Tests: ${data.recentTrends.last7Days.testsAttempted}</p>
                        <p>Avg Score: ${data.recentTrends.last7Days.avgScore.toFixed(1)}%</p>
                        <p style="color: ${data.recentTrends.last7Days.improvement >= 0 ? '#4CAF50' : '#F44336'};">
                            Improvement: ${data.recentTrends.last7Days.improvement >= 0 ? '+' : ''}${data.recentTrends.last7Days.improvement.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <h4>Last 30 Days</h4>
                        <p>Tests: ${data.recentTrends.last30Days.testsAttempted}</p>
                        <p>Avg Score: ${data.recentTrends.last30Days.avgScore.toFixed(1)}%</p>
                        <p style="color: ${data.recentTrends.last30Days.improvement >= 0 ? '#4CAF50' : '#F44336'};">
                            Improvement: ${data.recentTrends.last30Days.improvement >= 0 ? '+' : ''}${data.recentTrends.last30Days.improvement.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Test History</h2>
                <table class="test-history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Test Name</th>
                            <th>Category</th>
                            <th>Score</th>
                            <th>Rank</th>
                            <th>Time</th>
                            <th>Difficulty</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.testHistory.slice(-20).reverse().map(test => `
                            <tr>
                                <td>${new Date(test.completionDate).toLocaleDateString()}</td>
                                <td>${test.testName}</td>
                                <td>${test.category}</td>
                                <td class="score-cell ${test.percentage >= 80 ? 'score-excellent' : test.percentage >= 60 ? 'score-good' : 'score-poor'}">
                                    ${test.percentage.toFixed(1)}%
                                </td>
                                <td>#${test.rank || 'N/A'}</td>
                                <td>${Math.floor(test.timeTaken / 60)}:${(test.timeTaken % 60).toString().padStart(2, '0')}</td>
                                <td>${test.difficulty}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p class="logo">📚 Mocktail Academy</p>
                <p>Empowering your learning journey with comprehensive analytics</p>
                <p style="margin-top: 10px; font-size: 0.9em;">
                    This report was automatically generated based on your test performance data.
                    Continue practicing to see your progress improve!
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return html;
  }
  
  /**
   * Generate PDF-style report (HTML for PDF conversion)
   */
  static async generatePDFReport(data: ReportData): Promise<string> {
    const reportDate = new Date().toLocaleDateString();
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Test Performance Report</title>
        <style>
            @page {
                margin: 1in;
                size: A4;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
            }
            
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 24px;
                margin: 0 0 10px 0;
            }
            
            .stats-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            .stats-table th,
            .stats-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            
            .stats-table th {
                background: #f5f5f5;
                font-weight: bold;
            }
            
            .section {
                margin: 30px 0;
                page-break-inside: avoid;
            }
            
            .section h2 {
                font-size: 18px;
                border-bottom: 1px solid #ccc;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            
            .test-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
            }
            
            .test-table th,
            .test-table td {
                border: 1px solid #ddd;
                padding: 6px;
                text-align: left;
            }
            
            .test-table th {
                background: #f5f5f5;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Test Performance Report</h1>
            <p><strong>${data.user.name}</strong></p>
            <p>Generated on ${reportDate}</p>
        </div>
        
        <div class="section">
            <h2>Performance Summary</h2>
            <table class="stats-table">
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Total Tests Completed</td>
                    <td>${data.overallStats.totalTests}</td>
                </tr>
                <tr>
                    <td>Average Score</td>
                    <td>${data.overallStats.avgPercentage.toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Best Score</td>
                    <td>${data.overallStats.bestScore.toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Average Rank</td>
                    <td>#${data.overallStats.avgRank.toFixed(0)}</td>
                </tr>
                <tr>
                    <td>Best Rank</td>
                    <td>#${data.overallStats.bestRank || 'N/A'}</td>
                </tr>
                <tr>
                    <td>Total Study Time</td>
                    <td>${Math.round(data.overallStats.totalTimeSpent / 60)} minutes</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>Category Performance</h2>
            <table class="stats-table">
                <tr>
                    <th>Category</th>
                    <th>Tests</th>
                    <th>Avg Score</th>
                    <th>Trend</th>
                </tr>
                ${data.categoryPerformance.map(cat => `
                    <tr>
                        <td>${cat.category}</td>
                        <td>${cat.testsAttempted}</td>
                        <td>${cat.avgPercentage.toFixed(1)}%</td>
                        <td>${cat.improvement >= 0 ? '+' : ''}${cat.improvement.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        
        <div class="section page-break">
            <h2>Detailed Test History</h2>
            <table class="test-table">
                <tr>
                    <th>Date</th>
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Correct</th>
                    <th>Wrong</th>
                    <th>Rank</th>
                    <th>Time</th>
                </tr>
                ${data.testHistory.slice(-30).reverse().map(test => `
                    <tr>
                        <td>${new Date(test.completionDate).toLocaleDateString()}</td>
                        <td>${test.testName}</td>
                        <td>${test.category}</td>
                        <td>${test.percentage.toFixed(1)}%</td>
                        <td>${test.correctAnswers}</td>
                        <td>${test.wrongAnswers}</td>
                        <td>#${test.rank || 'N/A'}</td>
                        <td>${Math.floor(test.timeTaken / 60)}:${(test.timeTaken % 60).toString().padStart(2, '0')}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        
        <div class="footer">
            <p>Mocktail Academy - Performance Report | ${reportDate}</p>
        </div>
    </body>
    </html>
    `;
    
    return html;
  }
  
  /**
   * Generate CSV report
   */
  static generateCSVReport(data: ReportData): string {
    const csvHeaders = [
      'Date',
      'Test Name', 
      'Category',
      'Score (%)',
      'Total Questions',
      'Correct Answers',
      'Wrong Answers',
      'Unanswered',
      'Rank',
      'Time Taken (seconds)',
      'Difficulty'
    ];
    
    const csvRows = data.testHistory.map(test => [
      test.completionDate,
      `"${test.testName}"`,
      test.category,
      test.percentage.toFixed(1),
      test.totalQuestions,
      test.correctAnswers,
      test.wrongAnswers,
      test.unanswered,
      test.rank || '',
      test.timeTaken,
      test.difficulty
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  /**
   * Save report to file and share
   */
  static async saveAndShareReport(
    data: ReportData,
    format: 'html' | 'pdf' | 'csv' = 'html'
  ): Promise<void> {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;
      
      switch (format) {
        case 'html':
          content = await this.generateHTMLReport(data);
          filename = `test-report-${data.user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
          mimeType = 'text/html';
          break;
        case 'pdf':
          content = await this.generatePDFReport(data);
          filename = `test-report-${data.user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
          mimeType = 'text/html';
          break;
        case 'csv':
          content = this.generateCSVReport(data);
          filename = `test-data-${data.user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Share Test Performance Report',
          UTI: mimeType
        });
      } else {
        Alert.alert(
          'Report Generated',
          `Your report has been saved to: ${filename}`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      Alert.alert(
        'Error',
        'Failed to generate report. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }
  
  /**
   * Generate quick summary for sharing
   */
  static generateQuickSummary(data: ReportData): string {
    const recentTests = data.testHistory.slice(-5);
    const avgRecentScore = recentTests.reduce((sum, test) => sum + test.percentage, 0) / recentTests.length;
    
    return `📊 My Test Performance Summary

🎯 Overall Stats:
• ${data.overallStats.totalTests} tests completed
• ${data.overallStats.avgPercentage.toFixed(1)}% average score
• Best rank: #${data.overallStats.bestRank || 'N/A'}

📈 Recent Performance (Last 5 tests):
• Average: ${avgRecentScore.toFixed(1)}%
• Trend: ${avgRecentScore > data.overallStats.avgPercentage ? '📈 Improving' : '📊 Stable'}

💪 Strong Areas: ${data.overallStats.strongSubjects.slice(0, 2).join(', ') || 'Building expertise'}

Generated by Mocktail Academy 📚`;
  }
  
  /**
   * Generate performance insights
   */
  static generateInsights(data: ReportData): string[] {
    const insights: string[] = [];
    
    // Performance trend insights
    const recentTests = data.testHistory.slice(-10);
    const olderTests = data.testHistory.slice(-20, -10);
    
    if (recentTests.length >= 3 && olderTests.length >= 3) {
      const recentAvg = recentTests.reduce((sum, test) => sum + test.percentage, 0) / recentTests.length;
      const olderAvg = olderTests.reduce((sum, test) => sum + test.percentage, 0) / olderTests.length;
      
      if (recentAvg > olderAvg + 5) {
        insights.push('🚀 You\'re showing great improvement! Your recent scores are significantly higher than before.');
      } else if (recentAvg < olderAvg - 5) {
        insights.push('📚 Consider reviewing your study approach. Recent scores suggest you might need to focus more on preparation.');
      } else {
        insights.push('📊 Your performance is consistent. This stability shows good understanding of the material.');
      }
    }
    
    // Time management insights
    const avgTime = data.testHistory.reduce((sum, test) => sum + test.timeTaken, 0) / data.testHistory.length / 60;
    if (avgTime < 30) {
      insights.push('⚡ You complete tests quickly! Consider spending more time reviewing answers to improve accuracy.');
    } else if (avgTime > 90) {
      insights.push('🤔 You take time to think through questions. Work on time management to complete tests efficiently.');
    }
    
    // Category performance insights
    const strongestCategory = data.categoryPerformance.reduce((prev, current) => 
      prev.avgPercentage > current.avgPercentage ? prev : current
    );
    const weakestCategory = data.categoryPerformance.reduce((prev, current) => 
      prev.avgPercentage < current.avgPercentage ? prev : current
    );
    
    if (data.categoryPerformance.length > 1) {
      insights.push(`🏆 ${strongestCategory.category} is your strongest area with ${strongestCategory.avgPercentage.toFixed(1)}% average.`);
      insights.push(`📖 Focus more on ${weakestCategory.category} to improve from ${weakestCategory.avgPercentage.toFixed(1)}% average.`);
    }
    
    // Achievement insights
    if (data.overallStats.bestRank && data.overallStats.bestRank <= 10) {
      insights.push('🥇 You\'ve achieved top 10 ranking! You have the potential to be among the best performers.');
    }
    
    if (data.overallStats.avgPercentage >= 85) {
      insights.push('⭐ Excellent overall performance! You\'re consistently scoring in the top tier.');
    } else if (data.overallStats.avgPercentage >= 70) {
      insights.push('👍 Good performance overall. With focused practice, you can reach the excellence tier.');
    } else {
      insights.push('💪 Keep practicing! Every test is a step toward improvement. Focus on understanding concepts.');
    }
    
    return insights.slice(0, 6); // Return top 6 insights
  }
}

export default TestReportGenerator;