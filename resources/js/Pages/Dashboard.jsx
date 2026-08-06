import React, { useState, useCallback } from 'react';
import {
    Page,
    Layout,
    Card,
    Text,
    BlockStack,
    InlineStack,
    Badge,
    Banner,
    Button,
    Grid,
    DataTable,
    Tabs,
    Divider,
    TextField,
    FormLayout,
    Box
} from '@shopify/polaris';

export default function Dashboard({ feedbacks = [], stats = {} }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [toastMessage, setToastMessage] = useState('');

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelectedTab(selectedTabIndex),
        []
    );

    const tabs = [
        { id: 'feedback-logs', content: 'Customer Feedback Logs', panelID: 'feedback-content' },
        { id: 'analytics', content: 'Lost Sales Analytics', panelID: 'analytics-content' },
        { id: 'settings', content: 'App Settings & Reasons', panelID: 'settings-content' },
    ];

    // Real database items or initial structured feedback items
    const feedbackList = feedbacks.length > 0 ? feedbacks : [
        {
            id: 1,
            created_at: '2026-08-06 01:30',
            product_title: 'Wireless Noise Canceling Headphones',
            reason: 'Price is too high',
            custom_comment: 'Looking for a discount under $80.',
            customer_email: 'buyer@example.com',
            ai_summary: 'Customer price sensitive. High intent to buy if discounted.',
            ai_sentiment: 'neutral'
        },
        {
            id: 2,
            created_at: '2026-08-06 01:15',
            product_title: 'Ergonomic Leather Gaming Chair',
            reason: 'Unsure about size / fit',
            custom_comment: 'Is this suitable for 6ft tall person?',
            customer_email: 'alex@example.com',
            ai_summary: 'Size chart missing height recommendations.',
            ai_sentiment: 'negative'
        },
        {
            id: 3,
            created_at: '2026-08-06 00:45',
            product_title: 'Smart Watch Series 7',
            reason: 'Shipping fee is too high',
            custom_comment: 'Shipping cost $15 is almost 20% of product price.',
            customer_email: 'sarah@example.com',
            ai_summary: 'Cart abandonment due to shipping costs.',
            ai_sentiment: 'negative'
        },
    ];

    // Format rows for Polaris DataTable
    const tableRows = feedbackList.map((item) => [
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today',
        item.product_title || 'General Product',
        <Badge tone={item.reason.includes('Price') ? 'warning' : 'info'}>{item.reason}</Badge>,
        item.custom_comment || 'No comment added',
        item.customer_email || 'Anonymous Visitor',
        // AI Summary Column (Field Ready)
        item.ai_summary ? (
            <BlockStack gap="100">
                <Badge tone="success">🤖 AI Summary</Badge>
                <Text variant="bodyXs" tone="subdued">{item.ai_summary}</Text>
            </BlockStack>
        ) : (
            <Badge tone="attention">🤖 AI Field Ready</Badge>
        )
    ]);

    return (
        <Page
            title="BeforeBuy - Lost Sales Feedback Dashboard"
            subtitle="Merchant Admin Panel: Review why customers leave product pages without buying."
        >
            <BlockStack gap="500">
                {toastMessage && (
                    <Banner tone="success" onDismiss={() => setToastMessage('')}>
                        <p>{toastMessage}</p>
                    </Banner>
                )}

                {/* Quick Merchant Stats Grid */}
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
                                <Text variant="headingLg" as="h3">{stats.top_reason || 'Price is too high'}</Text>
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

                {/* Navigation Tabs */}
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
                </Card>

                {/* TAB 0: CUSTOMER FEEDBACK LOGS TABLE */}
                {selectedTab === 0 && (
                    <Card>
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd" as="h2">Customer Feedback Submissions</Text>
                                <Badge tone="success">Live Database Log</Badge>
                            </InlineStack>
                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                headings={['Date', 'Product', 'Lost Reason', 'Customer Note', 'Customer Email', 'AI Summary (Field Ready 🤖)']}
                                rows={tableRows}
                            />
                        </BlockStack>
                    </Card>
                )}

                {/* TAB 1: LOST SALES ANALYTICS */}
                {selectedTab === 1 && (
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Lost Sales Reason Breakdown</Text>
                            <Text tone="subdued" variant="bodySm">Summary of objections recorded from store visitors.</Text>
                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                headings={['Date', 'Product', 'Lost Reason', 'Customer Note', 'Customer Email', 'AI Summary (Field Ready 🤖)']}
                                rows={tableRows}
                            />
                        </BlockStack>
                    </Card>
                )}

                {/* TAB 2: SETTINGS & REASONS */}
                {selectedTab === 2 && (
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Pre-Defined Feedback Reasons</Text>
                            <Text tone="subdued" variant="bodySm">Customize the choices shown to customers when they click the feedback button on storefront.</Text>

                            <FormLayout>
                                <TextField label="Reason Option 1" value="Price is higher than expected" autoComplete="off" />
                                <TextField label="Reason Option 2" value="Unsure about size / fit / dimensions" autoComplete="off" />
                                <TextField label="Reason Option 3" value="Shipping fee is too high" autoComplete="off" />
                                <TextField label="Reason Option 4" value="Product information or reviews missing" autoComplete="off" />
                                <Button variant="primary">Save Reason Options</Button>
                            </FormLayout>
                        </BlockStack>
                    </Card>
                )}
            </BlockStack>
        </Page>
    );
}
