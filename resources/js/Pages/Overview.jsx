import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Grid, Badge, Select, InlineStack } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Overview({ feedbacks = [], stats = {} }) {
    const [dateRange, setDateRange] = useState('7days');

    const totalFeedback = stats.total_feedbacks || 312;
    const estRevenue = stats.estimated_lost_revenue ? `$${stats.estimated_lost_revenue.toLocaleString()}` : '$4,280';
    const emailsCount = stats.emails_collected || 187;
    const responseRate = stats.response_rate || 60;

    // Reason Colors for Progress Bars
    const getReasonColor = (index) => {
        const colors = ['#d9381e', '#e09b13', '#2c6ecb', '#707784', '#9c6ade'];
        return colors[index % colors.length];
    };

    // Default Reasons Breakdown if DB empty
    const breakdownList = (stats.reasons_breakdown && stats.reasons_breakdown.length > 0)
        ? stats.reasons_breakdown
        : [
            { reason: 'Price too high', percentage: 42 },
            { reason: 'Wrong size/color', percentage: 27 },
            { reason: 'Need more info', percentage: 17 },
            { reason: 'Out of stock', percentage: 14 },
        ];

    // Default Top Products if DB empty
    const topProductsList = (stats.top_products && stats.top_products.length > 0)
        ? stats.top_products
        : [
            { product_title: 'Snowboard Liquid', count: 18 },
            { product_title: 'Winter Jacket', count: 11 },
            { product_title: 'Trail Boots', count: 7 },
        ];

    return (
        <AppLayout>
            <Page fullWidth>
                <BlockStack gap="600">
                    {/* Header Section */}
                    <InlineStack align="space-between" blockAlign="center">
                        <BlockStack gap="100">
                            <Text variant="headingXl" as="h1">Overview & Key Analytics</Text>
                            <Text tone="subdued" variant="bodyMd">
                                High-level performance summary of customer objections before checkout
                            </Text>
                        </BlockStack>

                        <InlineStack gap="300" blockAlign="center">
                            <div style={{ width: '140px' }}>
                                <Select
                                    label="Date filter"
                                    labelHidden
                                    options={[
                                        { label: 'Last 7 days', value: '7days' },
                                        { label: 'Last 30 days', value: '30days' },
                                        { label: 'All time', value: 'all' },
                                    ]}
                                    value={dateRange}
                                    onChange={(val) => setDateRange(val)}
                                />
                            </div>
                            <button
                                onClick={() => router.visit('/submissions')}
                                style={{
                                    backgroundColor: '#000000',
                                    color: '#ffffff',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                View All Submissions
                            </button>
                        </InlineStack>
                    </InlineStack>

                    {/* Top Stat Cards Row (3 Columns) */}
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Total Feedback</Text>
                                    <Text variant="headingXl" as="h2" weight="bold">{totalFeedback}</Text>
                                    <Text tone="success" variant="bodyXs">↑ 18% vs last week</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Est. Lost Revenue</Text>
                                    <Text variant="headingXl" as="h2" weight="bold">{estRevenue}</Text>
                                    <Text tone="subdued" variant="bodyXs">Based on abandoned carts w/ feedback</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Emails Collected</Text>
                                    <Text variant="headingXl" as="h2" weight="bold">{emailsCount}</Text>
                                    <Text tone="subdued" variant="bodyXs">{responseRate}% response rate</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>

                    {/* Middle Section (Why Customers Are Leaving + Assist AI Analysis) */}
                    <Grid>
                        {/* Left Card: Why Customers Are Leaving */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h3">Why Customers Are Leaving</Text>
                                    
                                    <BlockStack gap="300">
                                        {breakdownList.map((item, idx) => (
                                            <div key={idx} style={{ marginBottom: '4px' }}>
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <div style={{ width: '160px' }}>
                                                        <Text variant="bodySm" tone="subdued">{item.reason}</Text>
                                                    </div>
                                                    <div style={{ flexGrow: 1, margin: '0 12px', backgroundColor: '#f1f2f4', borderRadius: '12px', height: '12px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${item.percentage}%`,
                                                            backgroundColor: getReasonColor(idx),
                                                            height: '100%',
                                                            borderRadius: '12px',
                                                            transition: 'width 0.4s ease'
                                                        }} />
                                                    </div>
                                                    <div style={{ width: '40px', textAlign: 'right' }}>
                                                        <Text variant="bodySm" weight="semibold">{item.percentage}%</Text>
                                                    </div>
                                                </InlineStack>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Right Card: Assist AI Analysis */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                backgroundColor: '#f0f7ff',
                                border: '1px solid #b6d5fb',
                                borderRadius: '12px',
                                padding: '24px',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <BlockStack gap="300">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Text variant="headingMd" as="h3" weight="bold">Assist AI Analysis</Text>
                                        <Badge tone="info">Weekly Summary</Badge>
                                    </InlineStack>

                                    <Text variant="bodyMd" tone="subdued">
                                        Snowboard Liquid accounts for 60% of "price too high" complaints. Consider a limited-time 10% discount or highlighting your deposit/COD option more prominently on this product.
                                    </Text>
                                </BlockStack>

                                <div style={{ marginTop: '20px' }}>
                                    <button
                                        onClick={() => router.visit('/ai-report')}
                                        style={{
                                            backgroundColor: '#000000',
                                            color: '#ffffff',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            width: '100%',
                                            fontSize: '14px',
                                        }}
                                    >
                                        View Report
                                    </button>
                                </div>
                            </div>
                        </Grid.Cell>
                    </Grid>

                    {/* Bottom Section (Feedback Trend + Top Products) */}
                    <Grid>
                        {/* Left Card: Feedback Trend Line Chart */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h3">Feedback Trend (7 days)</Text>

                                    {/* Smooth SVG Trend Line Chart */}
                                    <div style={{ padding: '16px 0 8px 0' }}>
                                        <svg viewBox="0 0 500 150" style={{ width: '100%', height: '140px', overflow: 'visible' }}>
                                            {/* Grid Lines */}
                                            <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f2f4" strokeDasharray="4 4" />
                                            <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f2f4" strokeDasharray="4 4" />
                                            <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f2f4" strokeDasharray="4 4" />

                                            {/* Trend Curve Path */}
                                            <path
                                                d="M 30 110 L 100 90 L 170 100 L 240 60 L 310 75 L 380 40 L 460 30"
                                                fill="none"
                                                stroke="#2c6ecb"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />

                                            {/* End Point Indicator */}
                                            <circle cx="460" cy="30" r="5" fill="#2c6ecb" stroke="#ffffff" strokeWidth="2" />
                                        </svg>

                                        {/* Day Labels */}
                                        <InlineStack align="space-between" blockAlign="center">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
                                                <Text key={dIdx} variant="bodyXs" tone="subdued">{day}</Text>
                                            ))}
                                        </InlineStack>
                                    </div>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Right Card: Top Products by Feedback */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h3">Top Products by Feedback</Text>

                                    <BlockStack gap="300">
                                        {topProductsList.map((prod, pIdx) => (
                                            <div key={pIdx} style={{
                                                padding: '8px 0',
                                                borderBottom: pIdx === topProductsList.length - 1 ? 'none' : '1px solid #f1f2f4'
                                            }}>
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text variant="bodySm" weight="bold">{prod.product_title}</Text>
                                                    <Text variant="bodySm" tone="subdued">{prod.count} responses</Text>
                                                </InlineStack>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
