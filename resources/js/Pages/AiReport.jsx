import React from 'react';
import { Page, BlockStack, Card, Text, Badge, Grid, InlineStack, DataTable, Button, Box, Banner } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function AiReport({ stats = {}, repeatCustomers = [], plan = 'free', currentPlan = 'free', shopDomain = '' }) {
    const isPro = (currentPlan === 'pro' || plan === 'pro');

    const totalCount = stats.total_feedbacks || 0;
    const estRevenue = stats.estimated_lost_revenue ? `$${stats.estimated_lost_revenue.toLocaleString()}` : '$0';
    const topReason = stats.top_reason || null;
    const topProducts = stats.top_products || [];
    const topProductName = topProducts.length > 0 ? topProducts[0].product_title : null;

    const repeatList = Array.isArray(repeatCustomers) ? repeatCustomers : [];

    const handleUpgradeRedirect = () => {
        const params = new URLSearchParams(window.location.search);
        const host = params.get('host') || '';
        const shop = shopDomain || params.get('shop') || '';
        router.visit(`/plans?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`);
    };

    const customerRows = repeatList.map((item) => [
        <Text key={item.customer_email} weight="bold">{item.customer_email}</Text>,
        <Badge key={`badge-${item.customer_email}`} tone="warning">{`${item.count} Submissions`}</Badge>,
        item.products || 'Multiple Products',
        <Badge key={`intent-${item.customer_email}`} tone="success">High Intent</Badge>
    ]);

    return (
        <AppLayout>
            <Page
                backAction={{ content: 'Overview', onAction: () => router.visit('/') }}
                title="Weekly AI Report"
                subtitle="Automated AI analytics and actionable product recommendations"
            >
                <div style={{ position: 'relative' }}>
                    {!isPro && (
                        <div style={{
                            position: 'absolute',
                            top: '40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 20,
                            width: '90%',
                            maxWidth: '520px',
                            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                            borderRadius: '12px',
                        }}>
                            <Card padding="600">
                                <BlockStack gap="400" inlineAlign="center">
                                    <div style={{
                                        backgroundColor: '#f0fdf4',
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '32px',
                                        border: '2px solid #008060'
                                    }}>
                                        🔒
                                    </div>
                                    <BlockStack gap="100" inlineAlign="center">
                                        <Text variant="headingLg" as="h2" alignment="center">
                                            AI Executive Report Locked
                                        </Text>
                                        <Text variant="bodyMd" tone="subdued" alignment="center">
                                            You are currently on the <strong>Free Plan</strong>. Upgrade to <strong>Pro ($5/month)</strong> to unlock automated weekly AI reports and high-intent customer recommendations.
                                        </Text>
                                    </BlockStack>

                                    <div style={{ marginTop: '8px', width: '100%', maxWidth: '280px' }}>
                                        <Button
                                            variant="primary"
                                            size="large"
                                            fullWidth
                                            onClick={handleUpgradeRedirect}
                                        >
                                            Upgrade to Pro ($5/mo)
                                        </Button>
                                    </div>
                                </BlockStack>
                            </Card>
                        </div>
                    )}

                    <div style={!isPro ? {
                        filter: 'blur(10px)',
                        opacity: 0.45,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    } : {}}>
                        <BlockStack gap="500">
                            {/* Executive Summary Box */}
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h2" weight="bold">Executive Summary</Text>

                                    {totalCount > 0 ? (
                                        <Text variant="bodyMd" tone="base">
                                            This week, <strong>{totalCount} customers</strong> submitted feedback before leaving without purchasing.
                                            The leading objection reason reported is <strong>"{topReason || 'Price concerns'}"</strong>
                                            {topProductName && <> concentrated on <strong>{topProductName}</strong></>}.
                                            Addressing these top objections could recover an estimated <strong>{estRevenue}</strong> in potential lost revenue.
                                        </Text>
                                    ) : (
                                        <Text variant="bodyMd" tone="subdued">
                                            No customer feedback recorded yet. Once store visitors submit feedback on your product pages, AI will generate weekly executive summaries and actionable recovery recommendations here.
                                        </Text>
                                    )}
                                </BlockStack>
                            </Card>

                            {/* AI Strategic Analysis Cards */}
                            <BlockStack gap="500">
                                <Text variant="headingLg" as="h2">AI Strategic Insights & Analysis</Text>

                                <Grid>
                                    {/* Insight 1: Price & Value Sensitivity */}
                                    <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                        <Card>
                                            <BlockStack gap="300">
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text variant="headingSm" as="h3">AI Price & Value Insight</Text>
                                                    <Badge tone={totalCount > 0 ? 'success' : 'subdued'}>
                                                        {totalCount > 0 ? 'Action Opportunity' : 'Pending Data'}
                                                    </Badge>
                                                </InlineStack>

                                                <Text variant="bodySm" tone="subdued">
                                                    {totalCount > 0
                                                        ? `Primary objection recorded is "${topReason || 'Price concerns'}". Offering targeted discount codes or highlighting deposit / instalment payment options can recover lost checkout intent.`
                                                        : 'No price sensitivity data collected yet. Once feedback is received, AI will pinpoint high-risk items and suggest pricing strategies.'
                                                    }
                                                </Text>
                                            </BlockStack>
                                        </Card>
                                    </Grid.Cell>

                                    {/* Insight 2: Product Content & Specs */}
                                    <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                        <Card>
                                            <BlockStack gap="300">
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text variant="headingSm" as="h3">AI Product Content & Specs Analysis</Text>
                                                    <Badge tone={totalCount > 0 ? 'warning' : 'subdued'}>
                                                        {totalCount > 0 ? 'Content Optimization' : 'Pending Data'}
                                                    </Badge>
                                                </InlineStack>

                                                <Text variant="bodySm" tone="subdued">
                                                    {totalCount > 0
                                                        ? `Customers looking at ${topProductName || 'your products'} frequently ask for size, fit, or additional details. Updating product descriptions and adding clear size charts will reduce pre-purchase hesitation.`
                                                        : 'No content gap data collected yet. AI will identify missing product specifications or sizing concerns as feedback arrives.'
                                                    }
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
                                                <Text variant="headingMd" as="h2">High-Intent Lead Intelligence (Repeat Objections)</Text>
                                                <Text tone="subdued" variant="bodySm">
                                                    Detailed AI analysis of high-intent visitors who submitted multiple feedback entries across products.
                                                </Text>
                                            </BlockStack>
                                            <Badge tone="info">Behavioral Analytics</Badge>
                                        </InlineStack>

                                        {repeatList.length === 0 ? (
                                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                                <Text tone="subdued" alignment="center">
                                                    No repeat feedback leads recorded yet.
                                                </Text>
                                            </div>
                                        ) : (
                                            <DataTable
                                                columnContentTypes={['text', 'text', 'text', 'text']}
                                                headings={['Customer Email', 'Total Objections Shared', 'Products Browsed', 'AI Intent Score']}
                                                rows={customerRows}
                                            />
                                        )}
                                    </BlockStack>
                                </Card>
                            </BlockStack>
                        </BlockStack>
                    </div>
                </div>
            </Page>
        </AppLayout>
    );
}
