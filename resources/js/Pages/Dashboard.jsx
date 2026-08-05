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
    FormLayout,
    TextField,
    Select,
    Checkbox,
    Tabs,
    Divider,
    ProgressBar,
    Box,
    Tag
} from '@shopify/polaris';

export default function Dashboard() {
    // State for Tabs
    const [selectedTab, setSelectedTab] = useState(0);

    // State for Settings Form
    const [isEnabled, setIsEnabled] = useState(true);
    const [surveyTitle, setSurveyTitle] = useState('Help Us Improve Your Shopping Experience!');
    const [triggerEvent, setTriggerEvent] = useState('cart_exit');
    const [discountAmount, setDiscountAmount] = useState('10');
    const [discountType, setDiscountType] = useState('percentage');
    const [toastMessage, setToastMessage] = useState('');

    const handleTabChange = useCallback(
        (selectedTabIndex) => setSelectedTab(selectedTabIndex),
        []
    );

    const handleSaveSettings = () => {
        setToastMessage('Settings saved successfully!');
        setTimeout(() => setToastMessage(''), 3000);
    };

    const tabs = [
        { id: 'overview', content: 'Overview & Metrics', panelID: 'overview-content' },
        { id: 'feedback', content: 'Customer Feedback Logs', panelID: 'feedback-content' },
        { id: 'settings', content: 'App Settings & Discounts', panelID: 'settings-content' },
    ];

    // Dummy feedback data for DataTable
    const rows = [
        ['#1094', 'John Doe', 'Wireless Headphones', '★★★★★', <Badge tone="success">Positive</Badge>, '10% OFF Issued'],
        ['#1093', 'Sarah Smith', 'Smart Watch Pro', '★★★★☆', <Badge tone="success">Positive</Badge>, '10% OFF Issued'],
        ['#1092', 'Michael Brown', 'Ergonomic Chair', '★★☆☆☆', <Badge tone="critical">Negative</Badge>, 'Feedback Recorded'],
        ['#1091', 'Emma Wilson', 'Leather Backpack', '★★★☆☆', <Badge tone="warning">Neutral</Badge>, '5% OFF Issued'],
        ['#1090', 'Alex Johnson', 'Bluetooth Speaker', '★★★★★', <Badge tone="success">Positive</Badge>, '10% OFF Issued'],
    ];

    return (
        <Page
            title="BeforeBuy - Private Customer Feedback"
            subtitle="Collect pre-purchase insights from visitors before they leave your store."
            primaryAction={{
                content: 'Save Settings',
                onAction: handleSaveSettings,
            }}
            secondaryActions={[
                {
                    content: isEnabled ? 'Pause Campaign' : 'Activate Campaign',
                    destructive: isEnabled,
                    onAction: () => setIsEnabled(!isEnabled),
                },
            ]}
        >
            <BlockStack gap="500">
                {/* Toast / Notification Banner */}
                {toastMessage && (
                    <Banner tone="success" onDismiss={() => setToastMessage('')}>
                        <p>{toastMessage}</p>
                    </Banner>
                )}

                {/* App Status Banner */}
                <Banner
                    title={isEnabled ? "BeforeBuy App is Active & Collecting Feedback" : "BeforeBuy Campaign is Paused"}
                    tone={isEnabled ? "success" : "warning"}
                >
                    <p>
                        {isEnabled
                            ? "Pre-purchase feedback popups are currently active on your storefront cart exit and product pages."
                            : "Pre-purchase feedback popups are currently disabled for store visitors."}
                    </p>
                </Banner>

                {/* Navigation Tabs */}
                <Card padding="0">
                    <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
                </Card>

                {/* TAB 0: OVERVIEW & METRICS */}
                {selectedTab === 0 && (
                    <BlockStack gap="500">
                        {/* Analytics Metric Cards */}
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text tone="subdued" variant="bodySm">Total Popups Shown</Text>
                                        <Text variant="headingXl" as="h3">2,450</Text>
                                        <Text tone="success" variant="bodyXs">↑ 14% vs last week</Text>
                                    </BlockStack>
                                </Card>
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text tone="subdued" variant="bodySm">Feedbacks Collected</Text>
                                        <Text variant="headingXl" as="h3">1,820</Text>
                                        <Text tone="success" variant="bodyXs">↑ 8% vs last week</Text>
                                    </BlockStack>
                                </Card>
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text tone="subdued" variant="bodySm">Response Rate</Text>
                                        <Text variant="headingXl" as="h3">74.3%</Text>
                                        <ProgressBar progress={74} tone="primary" size="small" />
                                    </BlockStack>
                                </Card>
                            </Grid.Cell>

                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <Card>
                                    <BlockStack gap="200">
                                        <Text tone="subdued" variant="bodySm">Discounts Redeemed</Text>
                                        <Text variant="headingXl" as="h3">$1,420</Text>
                                        <Text tone="success" variant="bodyXs">312 Checkout Conversions</Text>
                                    </BlockStack>
                                </Card>
                            </Grid.Cell>
                        </Grid>

                        <Layout>
                            {/* Main Recent Responses Table */}
                            <Layout.Section>
                                <Card>
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingMd" as="h2">Recent Customer Feedbacks</Text>
                                            <Button variant="plain">View All Logs</Button>
                                        </InlineStack>
                                        <DataTable
                                            columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                            headings={['Order/Session', 'Customer', 'Product', 'Rating', 'Sentiment', 'Incentive']}
                                            rows={rows}
                                        />
                                    </BlockStack>
                                </Card>
                            </Layout.Section>

                            {/* Side Live Widget Preview */}
                            <Layout.Section variant="oneThird">
                                <Card>
                                    <BlockStack gap="400">
                                        <Text variant="headingMd" as="h2">Live Storefront Preview</Text>
                                        <Text tone="subdued" variant="bodySm">
                                            This is how the feedback popup looks to potential buyers before checkout:
                                        </Text>

                                        <Box
                                            padding="400"
                                            background="bg-surface-secondary"
                                            borderRadius="200"
                                            borderWidth="025"
                                            borderColor="border-subdued"
                                        >
                                            <BlockStack gap="300">
                                                <Badge tone="attention">BeforeBuy Pop-up</Badge>
                                                <Text variant="headingSm" as="h4">{surveyTitle}</Text>
                                                <Text variant="bodyXs" tone="subdued">
                                                    "What is holding you back from completing your purchase today?"
                                                </Text>
                                                <BlockStack gap="100">
                                                    <Tag>Price is too high</Tag>
                                                    <Tag>Shipping time is too long</Tag>
                                                    <Tag>Just browsing around</Tag>
                                                </BlockStack>
                                                <Divider />
                                                <InlineStack align="end">
                                                    <Button variant="primary" size="micro">Get {discountAmount}% Off Now</Button>
                                                </InlineStack>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>
                        </Layout>
                    </BlockStack>
                )}

                {/* TAB 1: CUSTOMER FEEDBACK LOGS */}
                {selectedTab === 1 && (
                    <Layout>
                        <Layout.Section>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Detailed Customer Feedback Logs</Text>
                                    <DataTable
                                        columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                        headings={['Session ID', 'Customer Name', 'Target Product', 'Rating', 'Sentiment', 'Status']}
                                        rows={rows}
                                    />
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    </Layout>
                )}

                {/* TAB 2: APP SETTINGS & DISCOUNTS */}
                {selectedTab === 2 && (
                    <Layout>
                        <Layout.Section>
                            <Card>
                                <BlockStack gap="400">
                                    <Text variant="headingMd" as="h2">Feedback Campaign Settings</Text>
                                    <FormLayout>
                                        <Checkbox
                                            label="Enable Pre-Purchase Feedback Popup"
                                            checked={isEnabled}
                                            onChange={(newVal) => setIsEnabled(newVal)}
                                            helpText="Show popup when visitor intent to leave or cart exit is detected."
                                        />

                                        <TextField
                                            label="Survey Modal Heading"
                                            value={surveyTitle}
                                            onChange={(val) => setSurveyTitle(val)}
                                            autoComplete="off"
                                        />

                                        <Select
                                            label="Trigger Event"
                                            options={[
                                                { label: 'Cart Exit / Mouse Leave', value: 'cart_exit' },
                                                { label: 'Idle time (After 20 seconds)', value: 'idle_time' },
                                                { label: 'Product Page Scroll (>70%)', value: 'page_scroll' },
                                            ]}
                                            value={triggerEvent}
                                            onChange={(val) => setTriggerEvent(val)}
                                        />

                                        <Divider />

                                        <Text variant="headingSm" as="h3">Discount Reward Incentives</Text>

                                        <FormLayout.Group>
                                            <Select
                                                label="Discount Type"
                                                options={[
                                                    { label: 'Percentage Off (%)', value: 'percentage' },
                                                    { label: 'Fixed Amount Off ($)', value: 'fixed' },
                                                    { label: 'Free Shipping', value: 'free_shipping' },
                                                ]}
                                                value={discountType}
                                                onChange={(val) => setDiscountType(val)}
                                            />
                                            <TextField
                                                label="Discount Value"
                                                value={discountAmount}
                                                onChange={(val) => setDiscountAmount(val)}
                                                autoComplete="off"
                                                suffix={discountType === 'percentage' ? '%' : '$'}
                                            />
                                        </FormLayout.Group>

                                        <Button variant="primary" onClick={handleSaveSettings}>
                                            Save Settings
                                        </Button>
                                    </FormLayout>
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    </Layout>
                )}
            </BlockStack>
        </Page>
    );
}
