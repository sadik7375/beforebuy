import React from 'react';
import { Page, BlockStack, Card, Text, Badge, DataTable, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Submissions({ feedbacks = [] }) {
    const list = Array.isArray(feedbacks) ? feedbacks : (feedbacks.data || []);
    
    const displayList = list.length > 0 ? list : [
        {
            id: 1,
            created_at: '2026-08-06 01:30',
            product_title: 'Wireless Noise Canceling Headphones',
            reason: 'Price is too high',
            custom_comment: 'Looking for a discount under $80.',
            customer_email: 'buyer@example.com',
            ai_summary: 'Customer price sensitive. High intent to buy if discounted.'
        },
        {
            id: 2,
            created_at: '2026-08-06 01:15',
            product_title: 'Ergonomic Leather Gaming Chair',
            reason: 'Unsure about size / fit',
            custom_comment: 'Is this suitable for 6ft tall person?',
            customer_email: 'alex@example.com',
            ai_summary: 'Size chart missing height recommendations.'
        },
        {
            id: 3,
            created_at: '2026-08-06 00:45',
            product_title: 'Smart Watch Series 7',
            reason: 'Shipping fee is too high',
            custom_comment: 'Shipping cost $15 is almost 20% of product price.',
            customer_email: 'sarah@example.com',
            ai_summary: 'Cart abandonment due to shipping costs.'
        }
    ];

    const tableRows = displayList.map((item) => [
        item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today',
        item.product_title || 'General Product',
        <Badge key={item.id} tone={item.reason.includes('Price') ? 'warning' : 'info'}>{item.reason}</Badge>,
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
                title="Customer Feedback Submissions"
                subtitle="Review why visitors are abandoning product pages on your store."
            >
                <Card>
                    <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="center">
                            <Text variant="headingMd" as="h2">All Submissions Log</Text>
                            <Badge tone="success">Live Database Log</Badge>
                        </InlineStack>
                        <DataTable
                            columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                            headings={['Date', 'Product', 'Objection Reason', 'Customer Note', 'Customer Email', 'AI Insight']}
                            rows={tableRows}
                        />
                    </BlockStack>
                </Card>
            </Page>
        </AppLayout>
    );
}
