import React, { useState } from 'react';
import {
    Page,
    Grid,
    Card,
    BlockStack,
    InlineStack,
    Text,
    Badge,
    Button,
    ProgressBar,
    Banner,
    Box,
    Divider,
    List
} from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing({ plan = 'free', monthlyCount = 0, shopDomain = '' }) {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(urlParams.get('error') || '');
    const isPro = plan === 'pro';
    const freeLimit = 10;
    const usagePercent = Math.min(Math.round((monthlyCount / freeLimit) * 100), 100);
    const isLimitReached = !isPro && monthlyCount >= freeLimit;

    // Check if coming back from upgrade confirmation in URL
    const upgraded = urlParams.get('upgraded') === '1';

    const handleUpgrade = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const domain = shopDomain || urlParams.get('shop') || '';
            const res = await fetch(`/billing/subscribe?shop=${encodeURIComponent(domain)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await res.json();
            if (data.confirmationUrl) {
                if (window.top && window.top !== window.self) {
                    window.top.location.href = data.confirmationUrl;
                } else {
                    window.location.href = data.confirmationUrl;
                }
                return;
            }

            if (data.message) {
                setErrorMessage(data.message);
                setLoading(false);
                return;
            }

            window.location.href = `/billing/subscribe?shop=${encodeURIComponent(domain)}`;
        } catch (err) {
            console.error('Upgrade request error:', err);
            const domain = shopDomain || urlParams.get('shop') || '';
            window.location.href = `/billing/subscribe?shop=${encodeURIComponent(domain)}`;
        }
    };

    return (
        <AppLayout>
            <Page
                title="Plans & Pricing"
                subtitle="Choose the best plan for your Shopify store. Upgrade anytime for unlimited customer feedback."
            >
                <BlockStack gap="500">
                    {errorMessage && (
                        <Banner title="Upgrade failed" tone="critical" onDismiss={() => setErrorMessage('')}>
                            <p>{errorMessage}</p>
                        </Banner>
                    )}

                    {upgraded && (
                        <Banner title="Congratulations! You are now on BeforeBuy Pro Plan" tone="success">
                            <p>All premium features, unlimited feedback submissions, all popup themes, and AI analytics reports are now unlocked for your store.</p>
                        </Banner>
                    )}

                    {!isPro && isLimitReached && (
                        <Banner
                            title="Monthly Free Submission Limit Reached (10/10)"
                            tone="warning"
                        >
                            <p>
                                Your store has collected <strong>10 out of 10 free feedback submissions</strong> this month. Customer feedback collection is currently paused. Upgrade to <strong>BeforeBuy Pro Plan ($5/mo)</strong> for unlimited feedback submissions!
                            </p>
                        </Banner>
                    )}

                    {/* Monthly Usage Tracker Card for Free Plan Stores */}
                    {!isPro && (
                        <Card padding="500">
                            <BlockStack gap="300">
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="headingSm" as="h3">
                                        Monthly Free Submission Usage
                                    </Text>
                                    <Badge tone={isLimitReached ? 'critical' : monthlyCount >= 8 ? 'warning' : 'info'}>
                                        {monthlyCount} / {freeLimit} Submissions Used
                                    </Badge>
                                </InlineStack>
                                <ProgressBar
                                    progress={usagePercent}
                                    tone={isLimitReached ? 'critical' : monthlyCount >= 8 ? 'highlight' : 'primary'}
                                />
                                <Text variant="bodySm" as="p" tone="subdued">
                                    {isLimitReached
                                        ? 'Quota full for this month. Upgrade to Pro for unlimited submissions.'
                                        : `${freeLimit - monthlyCount} feedback submissions remaining in your free quota this month.`}
                                </Text>
                            </BlockStack>
                        </Card>
                    )}

                    {/* 2-Column Side-by-Side Pricing Plan Cards */}
                    <Grid>
                        {/* Free Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card padding="600">
                                <BlockStack gap="400">
                                    <InlineStack align="space-between" blockAlign="center">
                                        <Text variant="headingLg" as="h2">
                                            Free Plan
                                        </Text>
                                        {!isPro && <Badge tone="info">Current Active Plan</Badge>}
                                    </InlineStack>

                                    <Text variant="bodyMd" as="p" tone="subdued">
                                        Essential feedback collection for growing Shopify stores.
                                    </Text>

                                    <Box paddingBlock="200">
                                        <InlineStack gap="100" blockAlign="baseline">
                                            <Text variant="heading2xl" as="span" fontWeight="bold">
                                                $0
                                            </Text>
                                            <Text variant="bodyLg" as="span" tone="subdued">
                                                / month
                                            </Text>
                                        </InlineStack>
                                    </Box>

                                    <Button
                                        disabled={!isPro}
                                        fullWidth
                                        size="large"
                                    >
                                        {!isPro ? 'Current Plan' : 'Standard Free Tier'}
                                    </Button>

                                    <Divider />

                                    <BlockStack gap="200">
                                        <Text variant="headingSm" as="h4">What's included:</Text>
                                        <List type="bullet">
                                            <List.Item>Up to <strong>10 feedback submissions</strong> / month</List.Item>
                                            <List.Item>Basic Popup Theme (<strong>Modern</strong>)</List.Item>
                                            <List.Item>Customer Email Collection</List.Item>
                                            <List.Item>Basic Overview Dashboard</List.Item>
                                            <List.Item>Standard Support</List.Item>
                                        </List>
                                    </BlockStack>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Pro Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                borderRadius: '12px',
                                border: '2px solid #008060',
                                height: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <Card padding="600">
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingLg" as="h2">
                                                Pro Plan
                                            </Text>
                                            {isPro ? (
                                                <Badge tone="success">Current Active Plan</Badge>
                                            ) : (
                                                <Badge tone="attention">RECOMMENDED</Badge>
                                            )}
                                        </InlineStack>

                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Unlimited customer feedback, all popup themes & AI analytics.
                                        </Text>

                                        <Box paddingBlock="200">
                                            <InlineStack gap="100" blockAlign="baseline">
                                                <Text variant="heading2xl" as="span" fontWeight="bold">
                                                    $5.00
                                                </Text>
                                                <Text variant="bodyLg" as="span" tone="subdued">
                                                    / month
                                                </Text>
                                            </InlineStack>
                                        </Box>

                                        {isPro ? (
                                            <Button disabled fullWidth size="large">
                                                Active Plan
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                size="large"
                                                loading={loading}
                                                onClick={handleUpgrade}
                                            >
                                                Upgrade to Pro ($5/mo)
                                            </Button>
                                        )}
                                        {isPro && (
                                            <Box textAlign="center" paddingBlockStart="200">
                                                <a
                                                    href={`/reset-plan?shop=${encodeURIComponent(shopDomain || 'canny-apps.myshopify.com')}`}
                                                    style={{ color: '#2c6ecb', fontSize: '13px', textDecoration: 'underline' }}
                                                >
                                                    Reset to Free Plan (For Testing)
                                                </a>
                                            </Box>
                                        )}

                                        <Divider />

                                        <BlockStack gap="200">
                                            <Text variant="headingSm" as="h4">Everything in Free, plus:</Text>
                                            <List type="bullet">
                                                <List.Item><strong>UNLIMITED</strong> feedback submissions</List.Item>
                                                <List.Item>Full access to <strong>ALL 7 Popup Themes</strong></List.Item>
                                                <List.Item><strong>Weekly AI Analytics & Insight Reports</strong></List.Item>
                                                <List.Item>Repeat Customer Analysis & Email Export</List.Item>
                                                <List.Item>Priority Merchant Support</List.Item>
                                            </List>
                                        </BlockStack>
                                    </BlockStack>
                                </Card>
                            </div>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
