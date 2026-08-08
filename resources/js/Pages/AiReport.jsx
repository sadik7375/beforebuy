import React from 'react';
import { Page, BlockStack, Card, Text, Badge, Grid, InlineStack, DataTable } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function AiReport({ stats = {}, repeatCustomers = [] }) {
    const totalCount = stats.total_feedbacks || 68;
    const estRevenue = stats.estimated_lost_revenue ? `$${stats.estimated_lost_revenue.toLocaleString()}` : '$2,100';

    const repeatList = Array.isArray(repeatCustomers) && repeatCustomers.length > 0
        ? repeatCustomers
        : [
            { customer_email: 'wahidsadik38@gmail.com', count: 4, products: 'The Collection Snowboard: Liquid', intent: 'High Intent (95%)', tone: 'success' },
            { customer_email: 'wahidsadik7375@gmail.com', count: 3, products: 'The Collection Snowboard: Liquid', intent: 'Warm Intent (82%)', tone: 'attention' },
        ];

    const customerRows = repeatList.map((item) => [
        <Text key={item.customer_email} weight="bold">{item.customer_email}</Text>,
        <Badge key={`badge-${item.customer_email}`} tone="warning">{`${item.count || item.count} Submissions`}</Badge>,
        item.products || 'Multiple Products',
        <Badge key={`intent-${item.customer_email}`} tone={item.tone || 'success'}>
            {`🔥 ${item.intent || 'High Intent (90%)'}`}
        </Badge>
    ]);

    return (
        <AppLayout>
            <Page
                backAction={{ content: 'Overview', onAction: () => router.visit('/') }}
                title="Weekly AI Report"
                subtitle="Aug 1 – Aug 7, 2026 · Generated automatically every Monday"
                primaryAction={{
                    content: 'Export PDF 📥',
                    onAction: () => window.print(),
                }}
            >
                <BlockStack gap="500">
                    {/* Executive Summary Blue Banner Box */}
                    <div style={{
                        backgroundColor: '#f0f7ff',
                        border: '1px solid #b6d5fb',
                        borderRadius: '12px',
                        padding: '24px',
                    }}>
                        <BlockStack gap="300">
                            <InlineStack gap="200" blockAlign="center">
                                <span style={{ fontSize: '18px' }}>✨</span>
                                <Text variant="headingMd" as="h2" weight="bold">Executive Summary</Text>
                            </InlineStack>

                            <Text variant="bodyMd" tone="base">
                                This week, <strong>{totalCount} customers</strong> shared feedback before leaving without buying — up 18% from last week. Pricing concerns dominated (42%), concentrated heavily on <strong>Snowboard Liquid</strong>. Sizing issues on <strong>Winter Jacket</strong> also spiked, likely tied to your recent restock without XXL. Two products account for over half of all objections this week — fixing these could recover an estimated <strong>{estRevenue}</strong> in lost sales.
                            </Text>
                        </BlockStack>
                    </div>

                    {/* AI Strategic Analysis Cards */}
                    <Text variant="headingLg" as="h2">🎯 AI Strategic Insights & Analysis</Text>

                    <Grid>
                        {/* Insight 1: Price Sensitivity Analysis */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="300">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="200" blockAlign="center">
                                            <span style={{ fontSize: '20px' }}>🚀</span>
                                            <Text variant="headingSm" as="h3">AI Price Sensitivity Insight</Text>
                                        </InlineStack>
                                        <Badge tone="success">High Opportunity</Badge>
                                    </InlineStack>

                                    <Text variant="bodySm" tone="subdued">
                                        60% of lost buyers cite price as their main barrier on <strong>Snowboard Liquid</strong>. Providing a 10-15% incentive or highlighting flexible COD payment options could convert these high-intent visitors.
                                    </Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Insight 2: Product Content & Size Gap */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="300">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="200" blockAlign="center">
                                            <span style={{ fontSize: '20px' }}>📦</span>
                                            <Text variant="headingSm" as="h3">AI Sizing & Content Gap Analysis</Text>
                                        </InlineStack>
                                        <Badge tone="warning">Content Optimization</Badge>
                                    </InlineStack>

                                    <Text variant="bodySm" tone="subdued">
                                        27% of abandoning customers on <strong>Winter Jacket</strong> left feedback asking about size, fit, and chest dimensions. Adding clear size charts or fit notes can recover lost checkout intent.
                                    </Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>

                    {/* Person / Customer Target Intelligence Card */}
                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <InlineStack gap="200" blockAlign="center">
                                        <span style={{ fontSize: '20px' }}>👤</span>
                                        <Text variant="headingMd" as="h2">High-Intent Lead Intelligence (Repeat Objections)</Text>
                                    </InlineStack>
                                    <Text tone="subdued" variant="bodySm">
                                        Detailed AI analysis of high-intent visitors who submitted multiple feedback entries across products.
                                    </Text>
                                </BlockStack>
                                <Badge tone="info">Behavioral Analytics</Badge>
                            </InlineStack>

                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text']}
                                headings={['Customer Email', 'Total Objections Shared', 'Products Browsed', 'AI Intent Score']}
                                rows={customerRows}
                            />
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
