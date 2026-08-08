import React from 'react';
import { Page, BlockStack, Card, Text, Grid, Badge, Button, InlineStack } from '@shopify/polaris';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Overview({ feedbacks = [], stats = {} }) {
    const feedbackList = Array.isArray(feedbacks) ? feedbacks : [];
    const totalCount = stats.total_feedbacks || feedbackList.length;

    return (
        <AppLayout>
            <Page
                title="Overview & Key Analytics"
                subtitle="High-level performance summary of customer objections before checkout."
                primaryAction={{
                    content: 'View All Submissions',
                    onAction: () => router.visit('/submissions'),
                }}
            >
                <BlockStack gap="500">
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Total Feedbacks Collected</Text>
                                    <Text variant="headingXl" as="h3">{totalCount}</Text>
                                    <Text tone="success" variant="bodyXs">↑ Storefront Submissions</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Top Reason for Leaving</Text>
                                    <Text variant="headingLg" as="h3">{stats.top_reason || 'Price is higher than expected'}</Text>
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
                        <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <Text variant="headingMd" as="h2">Feedback Log Center</Text>
                                    <Text tone="subdued" variant="bodySm">
                                        Access and search all pre-purchase feedback entries in the dedicated Submissions tab.
                                    </Text>
                                </BlockStack>
                                <Button variant="primary" onClick={() => router.visit('/submissions')}>
                                    Go to Submissions Table
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
