import React from 'react';
import { Page, BlockStack, Card, Text, Badge, List, Box, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing() {
    return (
        <AppLayout>
            <Page
                title="App Plan & Features"
                subtitle="All premium features, AI analytics, and feedback tools are completely free and unlocked for your store."
            >
                <BlockStack gap="500">
                    <Card padding="500">
                        <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                                <Box
                                    padding="200"
                                    borderRadius="200"
                                    background="bg-fill-success-secondary"
                                >
                                    <Text variant="bodyMd" as="span" tone="success">✓</Text>
                                </Box>
                                <Text variant="bodyMd" as="span" fontWeight="medium">
                                    Your store is operating on the <strong>Unlimited Free Plan ($0/mo)</strong>.
                                </Text>
                            </InlineStack>
                            <Badge tone="success">All Features Active</Badge>
                        </InlineStack>
                    </Card>

                    <Card padding="600">
                        <BlockStack gap="400">
                            <Text variant="headingLg" as="h2">Included Features</Text>
                            <List type="bullet">
                                <List.Item>Unlimited pre-purchase feedback submissions</List.Item>
                                <List.Item>Automated Weekly AI Analytics & Executive Summaries</List.Item>
                                <List.Item>Full access to all storefront popup themes (Modern, Pills, etc.)</List.Item>
                                <List.Item>Customer Email Collection & Export capabilities</List.Item>
                                <List.Item>Full support and integration</List.Item>
                            </List>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
