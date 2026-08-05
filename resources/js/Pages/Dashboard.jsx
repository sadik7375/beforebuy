import React from 'react';
import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, Banner, Button } from '@shopify/polaris';

export default function Dashboard() {
    return (
        <Page title="BeforeBuy - Private Customer Feedback">
            <BlockStack gap="500">
                <Banner title="App Setup Completed Successfully!" tone="success">
                    <p>
                        Your Laravel + Inertia.js + Shopify Polaris stack is connected and ready to develop features step by step.
                    </p>
                </Banner>

                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack gap="400">
                                <InlineStack align="space-between" blockAlign="center">
                                    <Text variant="headingMd" as="h2">
                                        Project Overview
                                    </Text>
                                    <Badge tone="info">Step 1: Setup</Badge>
                                </InlineStack>

                                <Text as="p" tone="subdued">
                                    Project Name: <strong>BeforeBuy private customer feedback</strong>
                                </Text>
                                <Text as="p" tone="subdued">
                                    Tech Stack: <strong>Laravel 11 + Inertia.js + React + Shopify Polaris</strong>
                                </Text>

                                <InlineStack gap="300">
                                    <Button variant="primary">Configure Shopify Partner Credentials</Button>
                                    <Button>View Docs</Button>
                                </InlineStack>
                            </BlockStack>
                        </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneThird">
                        <Card>
                            <BlockStack gap="300">
                                <Text variant="headingSm" as="h3">
                                    Quick Stats
                                </Text>
                                <Text as="p" tone="subdued">
                                    Status: Ready for Partner Connection
                                </Text>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
