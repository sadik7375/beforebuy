import React from 'react';
import { Page, BlockStack, Card, Text, Badge, Grid, Button, InlineStack, DataTable, Icon } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function AiReport({ stats = {}, repeatCustomers = [] }) {
    const totalCount = stats.total_feedbacks || 68;
    const estRevenue = stats.estimated_lost_revenue ? `$${stats.estimated_lost_revenue.toLocaleString()}` : '$2,100';

    const repeatList = Array.isArray(repeatCustomers) && repeatCustomers.length > 0
        ? repeatCustomers
        : [
            { customer_email: 'wahidsadik7375@gmail.com', count: 3, products: 'Snowboard Liquid, Winter Jacket, Trail Boots' },
            { customer_email: 'customer.test@gmail.com', count: 2, products: 'Winter Jacket, Trail Boots' },
        ];

    const customerRows = repeatList.map((item) => [
        <Text key={item.customer_email} weight="bold">{item.customer_email}</Text>,
        <Badge key={`badge-${item.customer_email}`} tone="attention">{`${item.count} Submissions`}</Badge>,
        item.products,
        <Button key={`btn-${item.customer_email}`} variant="tertiary" size="micro" onClick={() => alert(`Preparing email offer for ${item.customer_email}`)}>
            Send Personal Offer ✉️
        </Button>
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

                    {/* AI Campaign & Action Suggestions */}
                    <Text variant="headingLg" as="h2">🎯 AI Strategic Recommendations</Text>

                    <Grid>
                        {/* Recommendation 1: Targeted Campaign */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="300">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="200" blockAlign="center">
                                            <span style={{ fontSize: '20px' }}>🚀</span>
                                            <Text variant="headingSm" as="h3">Recommended Marketing Campaign</Text>
                                        </InlineStack>
                                        <Badge tone="success">High ROI Opportunity</Badge>
                                    </InlineStack>

                                    <Text variant="bodySm" tone="subdued">
                                        Run a targeted <strong>15% promo discount campaign</strong> on <strong>Snowboard Liquid</strong> for 7 days. 60% of lost buyers cite price as their main barrier.
                                    </Text>

                                    <div style={{ marginTop: '8px' }}>
                                        <Button variant="primary" onClick={() => router.visit('/settings')}>
                                            Configure Campaign Offer
                                        </Button>
                                    </div>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Recommendation 2: Product Content Fix */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card>
                                <BlockStack gap="300">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <InlineStack gap="200" blockAlign="center">
                                            <span style={{ fontSize: '20px' }}>📦</span>
                                            <Text variant="headingSm" as="h3">Product Description & Size Guide Fix</Text>
                                        </InlineStack>
                                        <Badge tone="warning">Content Gap</Badge>
                                    </InlineStack>

                                    <Text variant="bodySm" tone="subdued">
                                        Update the <strong>Winter Jacket</strong> page to add XXL size measurements and chest fit details. 27% of abandoning customers asked about sizing dimensions.
                                    </Text>

                                    <div style={{ marginTop: '8px' }}>
                                        <Button variant="secondary" onClick={() => router.visit('/submissions')}>
                                            Review Sizing Objections
                                        </Button>
                                    </div>
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
                                        <Text variant="headingMd" as="h2">High-Intent Lead Targets (Repeat Objections)</Text>
                                    </InlineStack>
                                    <Text tone="subdued" variant="bodySm">
                                        These high-intent visitors browsed multiple items and gave feedback on 2+ products. Target them with direct email recovery offers!
                                    </Text>
                                </BlockStack>
                                <Badge tone="info">Lead Recovery</Badge>
                            </InlineStack>

                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text']}
                                headings={['Customer Email', 'Objections Shared', 'Products Browsed', 'Action']}
                                rows={customerRows}
                            />
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
