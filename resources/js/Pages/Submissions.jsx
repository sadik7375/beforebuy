import React from 'react';
import { Page, BlockStack, Card, Text, Badge, DataTable, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Submissions({ feedbacks = [] }) {
    const displayList = Array.isArray(feedbacks) ? feedbacks : (feedbacks.data || []);

    const tableRows = displayList.map((item) => [
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today',
        item.product_title || 'General Product',
        <Badge key={item.id} tone={item.reason && item.reason.includes('Price') ? 'warning' : 'info'}>{item.reason}</Badge>,
        item.custom_comment || 'No comment added',
        item.customer_email || 'Anonymous Visitor',
        item.ai_summary ? (
            <BlockStack key={`ai-${item.id}`} gap="100">
                <Badge tone="success">🤖 AI Summary</Badge>
                <Text variant="bodyXs" tone="subdued">{item.ai_summary}</Text>
            </BlockStack>
        ) : (
            <Badge key={`ai-${item.id}`} tone="attention">🤖 AI Ready</Badge>
        )
    ]);

    return (
        <AppLayout>
            <Page
                fullWidth
                title="Customer Feedback Submissions"
                subtitle="Review why visitors are abandoning product pages on your store."
            >
                <Card>
                    <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="headingMd" as="h2">All Submissions Log</Text>
                            <Badge tone="success">Live Database Log</Badge>
                        </InlineStack>

                        {displayList.length === 0 ? (
                            <Text tone="subdued" alignment="center">No feedback submissions recorded yet.</Text>
                        ) : (
                            <DataTable
                                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                headings={['Date', 'Product', 'Objection Reason', 'Customer Note', 'Customer Email', 'AI Insight']}
                                rows={tableRows}
                            />
                        )}
                    </BlockStack>
                </Card>
            </Page>
        </AppLayout>
    );
}
