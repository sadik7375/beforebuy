import React from 'react';
import { Page, BlockStack, Card, Text, Grid, Badge, DataTable, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Overview({ feedbacks = [], stats = {} }) {
    const feedbackList = feedbacks.length > 0 ? feedbacks : [
        {
            id: 1,
            created_at: '2026-08-06 01:30',
            product_title: 'Wireless Noise Canceling Headphones',
            reason: 'Price is too high',
            custom_comment: 'Looking for a discount under $80.',
            customer_email: 'buyer@example.com',
        },
        {
            id: 2,
            created_at: '2026-08-06 01:15',
            product_title: 'Ergonomic Leather Gaming Chair',
            reason: 'Unsure about size / fit',
            custom_comment: 'Is this suitable for 6ft tall person?',
            customer_email: 'alex@example.com',
        },
    ];

    const tableRows = feedbackList.map((item) => [
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today',
        item.product_title || 'General Product',
        <Badge key={item.id} tone={item.reason.includes('Price') ? 'warning' : 'info'}>{item.reason}</Badge>,
        item.custom_comment || 'No comment',
        item.customer_email || 'Anonymous Visitor',
    ]);

    return (
        <AppLayout>
            <Page
                title="Overview & Key Analytics"
                subtitle="High-level performance summary of customer objections before checkout."
            >
                <BlockStack gap="500">
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Total Feedbacks Collected</Text>
                                    <Text variant="headingXl" as="h3">{stats.total_feedbacks || feedbackList.length}</Text>
                                    <Text tone="success" variant="bodyXs">↑ Storefront Submissions</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Top Reason for Leaving</Text>
                                    <Text variant="headingLg" as="h3">{stats.top_reason || 'Price too high'}</Text>
                                    <Badge tone="warning">Main Objection</Badge>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">AI Insight Engine</Text>
                                    <Text variant="headingLg" as="h3">Field Ready 🤖</Text>
                                    <Badge tone="attention">Database Table Synced</Badge>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>

                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd" as="h2">Recent Storefront Submissions</Text>
                                <Badge tone="success">Live Synced</Badge>
                            </InlineStack>
                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                                headings={['Date', 'Product', 'Objection Reason', 'Customer Comment', 'Email']}
                                rows={tableRows}
                            />
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
