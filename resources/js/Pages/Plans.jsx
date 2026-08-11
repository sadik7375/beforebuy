import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Grid, Badge, InlineStack, Banner, Button, List, Box } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Plans({ shopDomain = '', currentPlan = 'free', subscriptionDetails = {}, monthlyCount = 0, freeSubmissionLimit = 15 }) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const isPro = currentPlan === 'pro';

    const handleUpgradePro = async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const host = urlParams.get('host');

            const response = await fetch('/plans/pro/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    shop: shopDomain,
                    host: host,
                }),
            });

            const data = await response.json();

            if (data.success && data.confirmationUrl) {
                // Top level redirect to Shopify Authorization screen
                if (window.top) {
                    window.top.location.href = data.confirmationUrl;
                } else {
                    window.location.href = data.confirmationUrl;
                }
            } else {
                setErrorMessage(data.message || 'Failed to initialize plan upgrade. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred. Please refresh and try again.');
            setLoading(false);
        }
    };

    const handleCancelPro = async () => {
        if (!confirm('Are you sure you want to downgrade to the Free plan? Your monthly submissions will be limited to 15.')) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            router.post('/plans/cancel', {
                shop: shopDomain,
            }, {
                onFinish: () => setLoading(false),
            });
        } catch (err) {
            setErrorMessage('Failed to downgrade plan.');
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Page fullWidth>
                <BlockStack gap="600">
                    {/* Header */}
                    <BlockStack gap="100">
                        <Text variant="headingXl" as="h1">Pricing Plans & Subscriptions</Text>
                        <Text tone="subdued" variant="bodyMd">
                            Select the ideal plan for your store to capture customer objections before purchase.
                        </Text>
                    </BlockStack>

                    {/* Error Banner */}
                    {errorMessage && (
                        <Banner tone="critical" onDismiss={() => setErrorMessage(null)}>
                            <p>{errorMessage}</p>
                        </Banner>
                    )}

                    {/* Active Plan Status Banner */}
                    {isPro ? (
                        <Banner tone="success" title="You are currently on the Pro Plan ($5/month)">
                            <p>You have access to unlimited feedback submissions, full popup customization, and AI summary insights.</p>
                        </Banner>
                    ) : (
                        <Banner tone="info" title="You are currently on the Free Plan">
                            <p>
                                Monthly submissions used: <strong>{monthlyCount} / {freeSubmissionLimit}</strong>. 
                                {monthlyCount >= freeSubmissionLimit && (
                                    <span style={{ color: '#d9381e', fontWeight: 'bold', marginLeft: '6px' }}>
                                        Limit reached for this month! Upgrade to Pro for unlimited submissions.
                                    </span>
                                )}
                            </p>
                        </Banner>
                    )}

                    {/* Pricing Cards Grid */}
                    <Grid>
                        {/* Free Plan Card */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                height: '100%',
                                border: !isPro ? '2px solid #008060' : '1px solid #e1e3e5',
                                borderRadius: '12px',
                                background: '#ffffff',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ padding: '24px' }}>
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingLg" as="h2" weight="bold">Free Plan</Text>
                                            {!isPro && <Badge tone="success">Active Plan</Badge>}
                                        </InlineStack>

                                        <div>
                                            <Text variant="heading2xl" as="p" weight="bold">$0</Text>
                                            <Text tone="subdued" variant="bodySm">Forever free for small stores</Text>
                                        </div>

                                        <Box paddingBlockStart="300" paddingBlockEnd="300">
                                            <BlockStack gap="200">
                                                <Text weight="semibold" variant="bodyMd">Included Features:</Text>
                                                <List type="bullet">
                                                    <List.Item>Up to <strong>15 Feedback Submissions</strong> / month</List.Item>
                                                    <List.Item>Standard Storefront Popup Theme</List.Item>
                                                    <List.Item>Basic Customer Objections Analytics</List.Item>
                                                    <List.Item>Standard Merchant Support</List.Item>
                                                </List>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </div>

                                <div style={{ padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e1e3e5' }}>
                                    {!isPro ? (
                                        <Button fullWidth disabled>Currently Active</Button>
                                    ) : (
                                        <Button fullWidth onClick={handleCancelPro} loading={loading}>
                                            Downgrade to Free
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Grid.Cell>

                        {/* Pro Plan Card ($5/month) */}
                        <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                            <div style={{
                                height: '100%',
                                border: isPro ? '2px solid #008060' : '2px solid #2c6ecb',
                                borderRadius: '12px',
                                background: '#ffffff',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 4px 12px rgba(44, 110, 203, 0.12)'
                            }}>
                                <div style={{ padding: '24px' }}>
                                    <BlockStack gap="400">
                                        <InlineStack align="space-between" blockAlign="center">
                                            <Text variant="headingLg" as="h2" weight="bold">Pro Plan</Text>
                                            {isPro ? (
                                                <Badge tone="success">Active Plan</Badge>
                                            ) : (
                                                <Badge tone="attention">Recommended</Badge>
                                            )}
                                        </InlineStack>

                                        <div>
                                            <InlineStack blockAlign="baseline" gap="100">
                                                <Text variant="heading2xl" as="p" weight="bold">$5</Text>
                                                <Text tone="subdued" variant="bodyMd">/ month</Text>
                                            </InlineStack>
                                            <Text tone="subdued" variant="bodySm">Recurring 30-day billing via Shopify</Text>
                                        </div>

                                        <Box paddingBlockStart="300" paddingBlockEnd="300">
                                            <BlockStack gap="200">
                                                <Text weight="semibold" variant="bodyMd">Everything in Free, plus:</Text>
                                                <List type="bullet">
                                                    <List.Item><strong>Unlimited Feedback Submissions</strong></List.Item>
                                                    <List.Item>All Storefront Popup Themes & Custom Colors</List.Item>
                                                    <List.Item>Complete <strong>AI Insights & Weekly Reports</strong></List.Item>
                                                    <List.Item>Optional & Mandatory Customer Email Collection</List.Item>
                                                    <List.Item><strong>Priority 24/7 Merchant Support</strong></List.Item>
                                                </List>
                                            </BlockStack>
                                        </Box>
                                    </BlockStack>
                                </div>

                                <div style={{ padding: '16px 24px', backgroundColor: isPro ? '#f9fafb' : '#f0f7ff', borderTop: '1px solid #e1e3e5' }}>
                                    {isPro ? (
                                        <Button fullWidth disabled>Currently Active</Button>
                                    ) : (
                                        <button
                                            onClick={handleUpgradePro}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: '#008060',
                                                color: '#ffffff',
                                                padding: '12px 20px',
                                                borderRadius: '8px',
                                                fontWeight: 700,
                                                border: 'none',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                width: '100%',
                                                fontSize: '15px',
                                                boxShadow: '0 2px 6px rgba(0,128,96,0.3)'
                                            }}
                                        >
                                            {loading ? 'Redirecting to Shopify...' : 'Upgrade to Pro ($5/mo)'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
