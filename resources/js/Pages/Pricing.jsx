import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Grid, Button, Badge, List, Box, Banner, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing({ plan = 'free', monthlyCount = 0, shopDomain = '' }) {
    const isPro = plan === 'pro';
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleConfirmUpgrade = async () => {
        setIsLoading(true);
        setErrorMessage('');
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
                if (window.top) {
                    window.top.location.href = data.confirmationUrl;
                } else {
                    window.location.href = data.confirmationUrl;
                }
            } else {
                setErrorMessage(data.message || 'Could not initiate subscription. Please check store API permissions.');
            }
        } catch (err) {
            setErrorMessage('Network error initiating subscription: ' + err.message);
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
                    {errorMessage && (
                        <Banner title="Subscription Request Issue" tone="critical" onDismiss={() => setErrorMessage('')}>
                            <p>{errorMessage}</p>
                        </Banner>
                    )}

                    {/* Active Plan Status Banner */}
                    <Card padding="400">
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                                <Box
                                    padding="200"
                                    borderRadius="200"
                                    background={isPro ? 'bg-fill-success-secondary' : 'bg-fill-info-secondary'}
                                >
                                    <Text variant="bodyMd" as="span" tone={isPro ? 'success' : 'info'}>
                                        {isPro ? '✓' : 'ⓘ'}
                                    </Text>
                                </Box>
                                <Text variant="bodyMd" as="span" fontWeight="medium">
                                    Your store is currently operating on the{' '}
                                    <strong>{isPro ? 'Pro Plan ($5/mo)' : 'Free Plan ($0/mo)'}</strong>.
                                    {!isPro && ` (${monthlyCount} / 10 monthly submissions used)`}
                                </Text>
                            </InlineStack>
                            <Badge tone={isPro ? 'success' : 'attention'}>
                                {isPro ? 'Pro Active' : 'Free Active'}
                            </Badge>
                        </InlineStack>
                    </Card>

                    {/* Pricing Cards Grid */}
                    <Grid>
                        {/* Free Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card padding="600">
                                <BlockStack gap="500">
                                    <InlineStack align="space-between">
                                        <Text variant="headingLg" as="h2">Free Plan</Text>
                                        {!isPro && <Badge tone="info">Current Plan</Badge>}
                                    </InlineStack>

                                    <InlineStack gap="100" blockAlign="baseline">
                                        <Text variant="heading2xl" as="span" fontWeight="bold">$0</Text>
                                        <Text variant="bodySm" tone="subdued" as="span">/ month</Text>
                                    </InlineStack>

                                    <Text variant="bodyMd" tone="subdued" as="p">
                                        Essential feedback collection for new and growing Shopify stores.
                                    </Text>

                                    <Box paddingBlockStart="200">
                                        <List type="bullet">
                                            <List.Item>Up to 10 feedback submissions per month</List.Item>
                                            <List.Item>Standard popup themes (Modern / Pills)</List.Item>
                                            <List.Item>Basic customer email collection</List.Item>
                                            <List.Item>Standard merchant support</List.Item>
                                            <List.Item>Weekly AI Report disabled</List.Item>
                                        </List>
                                    </Box>

                                    <Box paddingBlockStart="400">
                                        <Button fullWidth disabled={!isPro}>
                                            {!isPro ? 'Active Plan' : 'Downgrade to Free'}
                                        </Button>
                                    </Box>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Pro Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <Card padding="600">
                                <BlockStack gap="500">
                                    <InlineStack align="space-between">
                                        <Text variant="headingLg" as="h2">Pro Plan</Text>
                                        <Badge tone="attention">Most Popular</Badge>
                                    </InlineStack>

                                    <InlineStack gap="100" blockAlign="baseline">
                                        <Text variant="heading2xl" as="span" fontWeight="bold">$5</Text>
                                        <Text variant="bodySm" tone="subdued" as="span">/ month</Text>
                                    </InlineStack>

                                    <Text variant="bodyMd" tone="subdued" as="p">
                                        Unlock full AI analytics engine, unlimited logs, and all popup themes.
                                    </Text>

                                    <Box paddingBlockStart="200">
                                        <List type="bullet">
                                            <List.Item>Unlimited feedback submissions</List.Item>
                                            <List.Item>Weekly AI Report and recommendations</List.Item>
                                            <List.Item>Access to all premium popup themes</List.Item>
                                            <List.Item>Custom discount and reward code engine</List.Item>
                                            <List.Item>Priority 24h merchant support</List.Item>
                                        </List>
                                    </Box>

                                    <Box paddingBlockStart="400">
                                        {isPro ? (
                                            <Button fullWidth disabled>
                                                Active Plan
                                            </Button>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="primary"
                                                onClick={handleConfirmUpgrade}
                                                loading={isLoading}
                                            >
                                                Upgrade to Pro ($5/mo)
                                            </Button>
                                        )}
                                    </Box>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
