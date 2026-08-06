import React from 'react';
import { Page, BlockStack, Card, Text, List, Button, Banner, Box } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Setup() {
    return (
        <AppLayout>
            <Page
                fullWidth
                title="Setup & Activation Guide"
                subtitle="Easily enable the BeforeBuy Feedback widget on your Shopify product pages."
            >
                <BlockStack gap="500">
                    <Banner tone="info" title="Quick 2-Step Installation">
                        <p>No coding required! Simply activate the app block in your Shopify Theme Editor.</p>
                    </Banner>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Step 1: Open Theme Editor</Text>
                            <Text tone="subdued" variant="bodySm">Click the button below to navigate to your live Shopify Online Store Theme Editor.</Text>
                            <Box paddingBlockStart="200">
                                <Button variant="primary" onClick={() => window.open('https://admin.shopify.com', '_blank')}>
                                    Open Shopify Theme Editor ↗
                                </Button>
                            </Box>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Step 2: Add App Block to Product Template</Text>
                            <List type="number">
                                <List.Item>In the Theme Editor dropdown, select <strong>Products → Default product</strong>.</List.Item>
                                <List.Item>In the left sidebar, click <strong>Add block</strong> under Product Information.</List.Item>
                                <List.Item>Select <strong>BeforeBuy Feedback Button</strong> under the Apps tab.</List.Item>
                                <List.Item>Click <strong>Save</strong> in the top right corner.</List.Item>
                            </List>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
