import React, { useState, useMemo } from 'react';
import { Page, BlockStack, Card, Text, Badge, DataTable, InlineStack, TextField, Select, Button, Icon } from '@shopify/polaris';
import { SearchIcon, XIcon } from '@shopify/polaris-icons';
import AppLayout from '../Layouts/AppLayout';

export default function Submissions({ feedbacks = [] }) {
    const list = Array.isArray(feedbacks) ? feedbacks : (feedbacks.data || []);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReasonFilter, setSelectedReasonFilter] = useState('all');

    // Filter choices options
    const reasonOptions = [
        { label: 'All Reasons', value: 'all' },
        { label: 'Price is higher than expected', value: 'price' },
        { label: 'Unsure about size / fit', value: 'size' },
        { label: 'Shipping fee too high', value: 'shipping' },
        { label: 'Product info missing', value: 'info' },
        { label: 'Other reason', value: 'other' },
    ];

    // Real-time Search and Filter logic
    const filteredList = useMemo(() => {
        return list.filter((item) => {
            const query = searchQuery.toLowerCase().trim();

            const matchesQuery = !query || (
                (item.product_title && item.product_title.toLowerCase().includes(query)) ||
                (item.reason && item.reason.toLowerCase().includes(query)) ||
                (item.custom_comment && item.custom_comment.toLowerCase().includes(query)) ||
                (item.customer_email && item.customer_email.toLowerCase().includes(query))
            );

            const reasonLower = (item.reason || '').toLowerCase();
            let matchesReason = true;

            if (selectedReasonFilter === 'price') matchesReason = reasonLower.includes('price');
            else if (selectedReasonFilter === 'size') matchesReason = reasonLower.includes('size') || reasonLower.includes('fit');
            else if (selectedReasonFilter === 'shipping') matchesReason = reasonLower.includes('shipping') || reasonLower.includes('delivery');
            else if (selectedReasonFilter === 'info') matchesReason = reasonLower.includes('info') || reasonLower.includes('review');
            else if (selectedReasonFilter === 'other') matchesReason = reasonLower.includes('other');

            return matchesQuery && matchesReason;
        });
    }, [list, searchQuery, selectedReasonFilter]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedReasonFilter('all');
    };

    const tableRows = filteredList.map((item) => [
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

    const isFiltered = searchQuery !== '' || selectedReasonFilter !== 'all';

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

                        {/* Search and Filter Header Bar */}
                        <div style={{
                            border: '1px solid #e1e3e5',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f9fafb'
                        }}>
                            <InlineStack gap="300" align="space-between" blockAlign="center">
                                <div style={{ flexGrow: 1, maxWidth: '480px' }}>
                                    <TextField
                                        label="Search feedback"
                                        labelHidden
                                        prefix={<Icon source={SearchIcon} tone="subdued" />}
                                        placeholder="Search by product, reason, email or note..."
                                        value={searchQuery}
                                        onChange={(val) => setSearchQuery(val)}
                                        clearButton
                                        onClearButtonClick={() => setSearchQuery('')}
                                        autoComplete="off"
                                    />
                                </div>

                                <InlineStack gap="200" blockAlign="center">
                                    <Select
                                        label="Filter by reason"
                                        labelHidden
                                        options={reasonOptions}
                                        value={selectedReasonFilter}
                                        onChange={(val) => setSelectedReasonFilter(val)}
                                    />

                                    {isFiltered && (
                                        <Button
                                            variant="tertiary"
                                            icon={XIcon}
                                            onClick={handleClearFilters}
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </InlineStack>
                            </InlineStack>
                        </div>

                        {/* Data Table or Empty Filter State */}
                        {filteredList.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <Text tone="subdued" alignment="center">
                                    {isFiltered ? 'No submissions match your search filters.' : 'No feedback submissions recorded yet.'}
                                </Text>
                                {isFiltered && (
                                    <div style={{ marginTop: '12px' }}>
                                        <Button onClick={handleClearFilters}>Reset Search & Filters</Button>
                                    </div>
                                )}
                            </div>
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
