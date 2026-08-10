import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Grid, Button, Badge, List, Box, Banner, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing({ plan = 'free', monthlyCount = 0, shopDomain = '' }) {
    const isPro = plan === 'pro';
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/billing/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ shop: shopDomain }),
            });

            const data = await response.json();
            if (data.confirmationUrl) {
                // Open Shopify Billing approval page inside parent iframe context
                if (window.top) {
                    window.top.location.href = data.confirmationUrl;
                } else {
                    window.location.href = data.confirmationUrl;
                }
            }
        } catch (err) {
            console.error('Upgrade error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDowngrade = async () => {
        if (!confirm('Are you sure you want to downgrade to the Free plan? AI Report and Premium Themes will be locked.')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/billing/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                window.location.reload();
            }
        } catch (err) {
            console.error('Downgrade error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout>
            <Page
                title="Price Plans & Subscription"
                subtitle="Select the plan that best fits your store growth and feedback requirements."
            >
                <BlockStack gap="500">
                    {/* Active Plan Banner */}
                    <Banner tone={isPro ? 'success' : 'info'}>
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="bodyMd" as="p">
                                Your store is currently operating on the <strong>{isPro ? 'Pro Plan ($5/mo)' : 'Free Plan ($0/mo)'}</strong>.
                                {!isPro && ` (${monthlyCount} / 10 monthly submissions used)`}
                            </Text>
                            <Badge tone={isPro ? 'success' : 'attention'}>
                                {isPro ? 'Pro Active' : 'Free Active'}
                            </Badge>
                        </InlineStack>
                    </Banner>

                    {/* Pricing Cards Grid */}
                    <Grid>
                        {/* Free Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                height: '100%',
                                border: !isPro ? '2px solid #008060' : '1px solid #e1e3e5',
                                borderRadius: '12px',
                                background: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                <Card padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingLg" as="h3">Free Plan</Text>
                                            {!isPro && <Badge tone="success">Current Plan</Badge>}
                                        </InlineStack>

                                        <Text variant="heading2xl" as="h2">
                                            $0 <Text as="span" variant="bodySm" tone="subdued">/ month</Text>
                                        </Text>
                                        <Text tone="subdued" variant="bodySm">
                                            Essential feedback collection for new & growing Shopify stores.
                                        </Text>

                                        <Box paddingBlockStart="300">
                                            <List type="bullet">
                                                <List.Item>Up to <strong>10 feedback submissions</strong> / month</List.Item>
                                                <List.Item>Standard popup themes (Modern / Pills)</List.Item>
                                                <List.Item>Basic customer email collection</List.Item>
                                                <List.Item>Standard merchant support</List.Item>
                                                <List.Item><Text tone="subdued">🔒 Weekly AI Report (Locked)</Text></List.Item>
                                            </List>
                                        </Box>

                                        <Box paddingBlockStart="300">
                                            {!isPro ? (
                                                <Button fullWidth disabled>Active Plan</Button>
                                            ) : (
                                                <Button fullWidth onClick={handleDowngrade} loading={isLoading}>
                                                    Downgrade to Free
                                                </Button>
                                            )}
                                        </Box>
                                    </BlockStack>
                                </Card>
                            </div>
                        </Grid.Cell>

                        {/* Pro Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                height: '100%',
                                border: isPro ? '2px solid #008060' : '2px solid #202223',
                                borderRadius: '12px',
                                background: '#ffffff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                <Card padding="500">
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingLg" as="h3">Pro Plan</Text>
                                            {isPro ? (
                                                <Badge tone="success">Current Plan</Badge>
                                            ) : (
                                                <Badge tone="warning">Most Popular</Badge>
                                            )}
                                        </InlineStack>

                                        <Text variant="heading2xl" as="h2">
                                            $5 <Text as="span" variant="bodySm" tone="subdued">/ month</Text>
                                        </Text>
                                        <Text tone="subdued" variant="bodySm">
                                            Unlock full AI analytics engine, unlimited logs & all popup themes.
                                        </Text>

                                        <Box paddingBlockStart="300">
                                            <List type="bullet">
                                                <List.Item><strong>Unlimited feedback submissions</strong> / month</List.Item>
                                                <List.Item>⚡ <strong>Weekly AI Report & Recommendations</strong></List.Item>
                                                <List.Item>✨ <strong>Access to ALL Premium Popup Themes</strong></List.Item>
                                                <List.Item>🎁 Custom discount & reward code engine</List.Item>
                                                <List.Item>💬 Priority 24h merchant support</List.Item>
                                            </List>
                                        </Box>

                                        <Box paddingBlockStart="300">
                                            {isPro ? (
                                                <Button fullWidth disabled variant="primary">Active Plan</Button>
                                            ) : (
                                                <Button
                                                    fullWidth
                                                    variant="primary"
                                                    onClick={handleUpgrade}
                                                    loading={isLoading}
                                                >
                                                    Upgrade to Pro ($5/mo)
                                                </Button>
                                            )}
                                        </Box>
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
