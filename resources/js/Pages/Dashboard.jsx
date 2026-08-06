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
    Modal,
    TextField,
    RadioButton,
    ChoiceList,
    Tabs,
    Divider,
    Box,
    Tag,
    Icon,
    FormLayout,
    CalloutCard
} from '@shopify/polaris';

export default function Dashboard({ feedbacks = [], stats = {} }) {
    const [selectedTab, setSelectedTab] = useState(0);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState('price_high');
    const [customNote, setCustomNote] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelectedTab(selectedTabIndex),
        []
    );

    const handleDemoSubmit = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setIsDemoModalOpen(false);
            setCustomNote('');
            setToastMessage('Demo feedback submitted successfully!');
            setTimeout(() => setToastMessage(''), 3000);
        }, 2000);
    };

    const tabs = [
        { id: 'overview', content: 'Overview & Storefront Preview', panelID: 'overview-content' },
        { id: 'feedback-logs', content: 'Customer Feedback Logs', panelID: 'feedback-content' },
        { id: 'settings', content: 'Widget & Reason Settings', panelID: 'settings-content' },
    ];

    // Dummy / Initial data merged with database props
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
            title="BeforeBuy - Lost Sales Feedback Tracker"
            subtitle="Understand why customers leave your product page without buying."
            secondaryActions={[
                {
                    content: 'Run DB Migration 🚀',
                    onAction: () => window.open('/run-migrate', '_blank'),
                },
                {
                    content: 'Clear Cache 🧹',
                    onAction: () => window.open('/clear-cache', '_blank'),
                },
            ]}
        >
            <BlockStack gap="500">
                {toastMessage && (
                    <Banner tone="success" onDismiss={() => setToastMessage('')}>
                        <p>{toastMessage}</p>
                    </Banner>
                )}

                {/* Banner explaining app status */}
                <Banner title="Product Page Lost Sales Tracker Active" tone="success">
                    <p>
                        Your feedback button is configured to display right below the <strong>Add to Cart</strong> button on product pages.
                    </p>
                </Banner>

                {/* Tabs */}
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
                </Card>

                {/* TAB 0: OVERVIEW & STOREFRONT POPUP PREVIEW */}
                {selectedTab === 0 && (
                    <BlockStack gap="500">
                        {/* Quick Stats Grid */}
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text tone="subdued" variant="bodySm">Total Feedbacks Collected</Text>
                                        <Text variant="headingXl" as="h3">{stats.total_feedbacks || feedbackList.length}</Text>
                                        <Text tone="success" variant="bodyXs">↑ Lost Sales Reasons Tracked</Text>
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

                        <Layout>
                            {/* Product Page Storefront Preview Section */}
                            <Layout.Section variant="oneHalf">
                                <Card>
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between">
                                            <Text variant="headingMd" as="h2">Product Page Button Preview</Text>
                                            <Badge tone="info">Storefront View</Badge>
                                        </InlineStack>
                                        <Text tone="subdued" variant="bodySm">
                                            This is how the Feedback trigger button appears below your <strong>Add to Cart</strong> button:
                                        </Text>

                                        {/* Simulated Product Page Card */}
                                        <Box
                                            padding="500"
                                            background="bg-surface-secondary"
                                            borderRadius="300"
                                            borderWidth="025"
                                            borderColor="border-subdued"
                                        >
                                            <BlockStack gap="400">
                                                <Text variant="headingLg" as="h3">Wireless Noise Canceling Headphones</Text>
                                                <Text variant="headingMd" as="h4" tone="success">$99.00 USD</Text>
                                                <Divider />

                                                {/* Standard Add to Cart Button */}
                                                <Button size="large" fullWidth variant="primary">
                                                    Add to Cart
                                                </Button>

                                                {/* THE CUSTOMER FEEDBACK TRIGGER BUTTON */}
                                                <Box paddingBlockStart="200">
                                                    <Button
                                                        size="medium"
                                                        fullWidth
                                                        variant="secondary"
                                                        onClick={() => setIsDemoModalOpen(true)}
                                                    >
                                                        💬 Why aren't you buying today? (Give Feedback)
                                                    </Button>
                                                </Box>

                                                <Text variant="bodyXs" alignment="center" tone="subdued">
                                                    ↑ Clicking this button opens the quick feedback popup modal.
                                                </Text>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>

                            {/* Popup Design Preview / Trigger Demo */}
                            <Layout.Section variant="oneHalf">
                                <Card>
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between">
                                            <Text variant="headingMd" as="h2">Feedback Popup Design</Text>
                                            <Button variant="plain" onClick={() => setIsDemoModalOpen(true)}>Test Modal Popup</Button>
                                        </InlineStack>

                                        <Text tone="subdued" variant="bodySm">
                                            Customer opens this non-intrusive popup and selects why they are leaving without buying:
                                        </Text>

                                        {/* Simulated Static Popup Box */}
                                        <Box
                                            padding="500"
                                            background="bg-surface"
                                            borderRadius="300"
                                            borderWidth="050"
                                            borderColor="border"
                                            shadow="200"
                                        >
                                            <BlockStack gap="400">
                                                <InlineStack align="space-between">
                                                    <Text variant="headingSm" as="h4">What is holding you back from buying?</Text>
                                                    <Badge tone="attention">Quick 5-Sec Survey</Badge>
                                                </InlineStack>

                                                <BlockStack gap="200">
                                                    <Tag>🏷️ Price is higher than expected</Tag>
                                                    <Tag>📏 Unsure about size / dimensions</Tag>
                                                    <Tag>🚚 Shipping cost / delivery time</Tag>
                                                    <Tag>❓ Product details are missing</Tag>
                                                    <Tag>💬 Other reason</Tag>
                                                </BlockStack>

                                                <TextField
                                                    label="Add optional comment:"
                                                    placeholder="Tell us what would help you make a decision..."
                                                    multiline={2}
                                                    autoComplete="off"
                                                />

                                                <Button variant="primary" fullWidth onClick={() => setIsDemoModalOpen(true)}>
                                                    Open Interactive Demo Modal
                                                </Button>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>
                        </Layout>

                        {/* Recent Feedback Table */}
                        <Card>
                            <BlockStack gap="400">
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="headingMd" as="h2">Customer Feedback Submissions</Text>
                                    <Badge tone="success">Database Live Synced</Badge>
                                </InlineStack>
                                <DataTable
                                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                    headings={['Date', 'Product', 'Lost Reason', 'Customer Note', 'Customer Email', 'AI Summary (Field Ready 🤖)']}
                                    rows={tableRows}
                                />
                            </BlockStack>
                        </Card>
                    </BlockStack>
                )}

                {/* TAB 1: CUSTOMER FEEDBACK LOGS TABLE */}
                {selectedTab === 1 && (
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">All Customer Feedback Entries</Text>
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
                            <Text tone="subdued" variant="bodySm">Customize the choices shown to customers when they click the feedback button.</Text>

                            <FormLayout>
                                <TextField label="Reason 1" value="Price is higher than expected" autoComplete="off" />
                                <TextField label="Reason 2" value="Unsure about size / fit / dimensions" autoComplete="off" />
                                <TextField label="Reason 3" value="Shipping fee is too high" autoComplete="off" />
                                <TextField label="Reason 4" value="Product information or reviews missing" autoComplete="off" />
                                <Button variant="primary">Save Reason Options</Button>
                            </FormLayout>
                        </BlockStack>
                    </Card>
                )}
            </BlockStack>

            {/* INTERACTIVE DEMO POPUP MODAL */}
            <Modal
                open={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
                title="Help Us Improve! Why aren't you buying today?"
                primaryAction={{
                    content: isSubmitted ? 'Submitting...' : 'Submit Feedback',
                    onAction: handleDemoSubmit,
                    disabled: isSubmitted
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsDemoModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    {isSubmitted ? (
                        <BlockStack gap="300" align="center">
                            <Banner tone="success" title="Thank you for your feedback!">
                                <p>We appreciate your input! Here is 10% OFF for your order: <strong>BEFOREBUY10</strong></p>
                            </Banner>
                        </BlockStack>
                    ) : (
                        <BlockStack gap="400">
                            <Text variant="bodyMd">
                                Please tell us what prevented you from completing your purchase for <strong>Wireless Noise Canceling Headphones</strong>:
                            </Text>

                            <ChoiceList
                                title="Select a reason:"
                                choices={[
                                    { label: '🏷️ Price is higher than expected', value: 'price_high' },
                                    { label: '📏 Unsure about size / dimensions', value: 'size_issue' },
                                    { label: '🚚 Shipping fee or delivery time is too high', value: 'shipping_high' },
                                    { label: '❓ Product details or specifications are missing', value: 'missing_info' },
                                    { label: '💬 Other reason', value: 'other' },
                                ]}
                                selected={[selectedReason]}
                                onChange={(val) => setSelectedReason(val[0])}
                            />

                            <TextField
                                label="Additional Note (Optional):"
                                value={customNote}
                                onChange={(val) => setCustomNote(val)}
                                multiline={3}
                                placeholder="e.g. I would buy if there was a 10% discount..."
                                autoComplete="off"
                            />
                        </BlockStack>
                    )}
                </Modal.Section>
            </Modal>
        </Page>
    );
}
