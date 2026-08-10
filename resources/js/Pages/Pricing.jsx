import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Grid, Button, Badge, List, Box, Banner, InlineStack, Modal } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing({ plan = 'free', monthlyCount = 0, shopDomain = '' }) {
    const isPro = plan === 'pro';
    const [isLoading, setIsLoading] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleConfirmUpgrade = async () => {
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
            setShowUpgradeModal(false);
        }
    };

    return (
        <AppLayout>
            <Page
                title="Price Plans & Subscription"
                subtitle="Select the plan that best fits your store growth and feedback requirements."
            >
                <BlockStack gap="500">
                    {/* Active Plan Status Banner */}
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

                    {/* Standard Polaris Grid Cards */}
                    <Grid>
                        {/* Free Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
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
                                        Essential feedback collection for new and growing Shopify stores.
                                    </Text>

                                    <Box paddingBlockStart="300">
                                        <List type="bullet">
                                            <List.Item>Up to 10 feedback submissions per month</List.Item>
                                            <List.Item>Standard popup themes (Modern / Pills)</List.Item>
                                            <List.Item>Basic customer email collection</List.Item>
                                            <List.Item>Standard merchant support</List.Item>
                                            <List.Item>Weekly AI Report disabled</List.Item>
                                        </List>
                                    </Box>

                                    <Box paddingBlockStart="300">
                                        {!isPro ? (
                                            <Button fullWidth disabled>Active Plan</Button>
                                        ) : (
                                            <Button fullWidth disabled>Free Plan</Button>
                                        )}
                                    </Box>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        {/* Pro Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
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
                                        Unlock full AI analytics engine, unlimited logs, and all popup themes.
                                    </Text>

                                    <Box paddingBlockStart="300">
                                        <List type="bullet">
                                            <List.Item>Unlimited feedback submissions</List.Item>
                                            <List.Item>Weekly AI Report and recommendations</List.Item>
                                            <List.Item>Access to all premium popup themes</List.Item>
                                            <List.Item>Custom discount and reward code engine</List.Item>
                                            <List.Item>Priority 24h merchant support</List.Item>
                                        </List>
                                    </Box>

                                    <Box paddingBlockStart="300">
                                        {isPro ? (
                                            <Button fullWidth disabled variant="primary">Active Plan</Button>
                                        ) : (
                                            <Button
                                                fullWidth
                                                variant="primary"
                                                onClick={() => setShowUpgradeModal(true)}
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

                {/* Shopify Billing Approval Modal */}
                <Modal
                    open={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    title="Confirm Pro Plan Subscription"
                    primaryAction={{
                        content: 'Approve $5/month Charge',
                        onAction: handleConfirmUpgrade,
                        loading: isLoading,
                    }}
                    secondaryActions={[
                        {
                            content: 'Cancel',
                            onAction: () => setShowUpgradeModal(false),
                        },
                    ]}
                >
                    <Modal.Section>
                        <BlockStack gap="300">
                            <Text variant="bodyMd" as="p">
                                You are about to upgrade your store to the <strong>BeforeBuy Pro Plan ($5/month)</strong>.
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                                This charge will be processed recurringly every 30 days through your official Shopify App Billing invoice.
                            </Text>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
            </Page>
        </AppLayout>
    );
}
