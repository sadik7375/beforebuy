import React, { useState, useMemo } from 'react';
import { Page, BlockStack, Card, Text, Grid, Badge, DataTable, InlineStack, TextField, Select, Button, Icon, Modal } from '@shopify/polaris';
import { SearchIcon, XIcon } from '@shopify/polaris-icons';
import AppLayout from '../Layouts/AppLayout';

export default function Overview({ feedbacks = [], stats = {}, reasons = [] }) {
    const feedbackList = Array.isArray(feedbacks) ? feedbacks : [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReasonFilter, setSelectedReasonFilter] = useState('all');

    // Modal state for viewing full customer note
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenNoteModal = (item) => {
        setSelectedFeedback(item);
        setIsModalOpen(true);
    };

    const handleCloseNoteModal = () => {
        setIsModalOpen(false);
        setSelectedFeedback(null);
    };

    // Build dynamic reason options from Merchant Settings + Actual Submissions
    const reasonOptions = useMemo(() => {
        const uniqueSet = new Set();
        (reasons || []).forEach(r => uniqueSet.add(r));
        feedbackList.forEach(item => {
            if (item.reason) uniqueSet.add(item.reason);
        });

        const options = [{ label: 'All Reasons', value: 'all' }];
        uniqueSet.forEach(reason => {
            options.push({ label: reason, value: reason });
        });
        return options;
    }, [reasons, feedbackList]);

    const filteredList = useMemo(() => {
        return feedbackList.filter((item) => {
            const query = searchQuery.toLowerCase().trim();

            const matchesQuery = !query || (
                (item.product_title && item.product_title.toLowerCase().includes(query)) ||
                (item.reason && item.reason.toLowerCase().includes(query)) ||
                (item.custom_comment && item.custom_comment.toLowerCase().includes(query)) ||
                (item.customer_email && item.customer_email.toLowerCase().includes(query))
            );

            const matchesReason = selectedReasonFilter === 'all' ||
                (item.reason && item.reason.toLowerCase().trim() === selectedReasonFilter.toLowerCase().trim());

            return matchesQuery && matchesReason;
        });
    }, [feedbackList, searchQuery, selectedReasonFilter]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedReasonFilter('all');
    };

    const tableRows = filteredList.map((item) => {
        const comment = item.custom_comment || 'No comment';
        const isLongText = comment.length > 35;
        const shortText = isLongText ? comment.substring(0, 35) + '...' : comment;

        return [
            item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today',
            item.product_title || 'General Product',
            <Badge key={item.id} tone={item.reason && item.reason.includes('Price') ? 'warning' : 'info'}>{item.reason}</Badge>,
            isLongText ? (
                <InlineStack key={`note-${item.id}`} gap="100" blockAlign="center">
                    <Text variant="bodySm" as="span">{shortText}</Text>
                    <Button variant="tertiary" size="micro" onClick={() => handleOpenNoteModal(item)}>
                        Read more
                    </Button>
                </InlineStack>
            ) : (
                comment
            ),
            item.customer_email || 'Anonymous Visitor',
        ];
    });

    const isFiltered = searchQuery !== '' || selectedReasonFilter !== 'all';

    return (
        <AppLayout>
            <Page
                title="Overview & Key Analytics"
                subtitle="High-level performance summary of customer objections before checkout."
            >
                <BlockStack gap="500">
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Total Feedbacks Collected</Text>
                                    <Text variant="headingXl" as="h3">{stats.total_feedbacks || feedbackList.length}</Text>
                                    <Text tone="success" variant="bodyXs">↑ Storefront Submissions</Text>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card>
                                <BlockStack gap="200">
                                    <Text tone="subdued" variant="bodySm">Top Reason for Leaving</Text>
                                    <Text variant="headingLg" as="h3">{stats.top_reason || 'Price too high'}</Text>
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
                        <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                                <Text variant="headingMd" as="h2">Recent Storefront Submissions</Text>
                                <Badge tone="success">Live Synced</Badge>
                            </InlineStack>

                            {/* Search and Dynamic Filter Header Bar */}
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

                            {filteredList.length === 0 ? (
                                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                                    <Text tone="subdued" alignment="center">
                                        {isFiltered ? 'No submissions match your search filters.' : 'No feedback submissions recorded yet.'}
                                    </Text>
                                </div>
                            ) : (
                                <DataTable
                                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                                    headings={['Date', 'Product', 'Objection Reason', 'Customer Comment', 'Email']}
                                    rows={tableRows}
                                />
                            )}
                        </BlockStack>
                    </Card>

                    {/* Polaris Modal for Viewing Full Customer Note */}
                    <Modal
                        open={isModalOpen}
                        onClose={handleCloseNoteModal}
                        title="Full Customer Feedback Note"
                        primaryAction={{
                            content: 'Close',
                            onAction: handleCloseNoteModal,
                        }}
                    >
                        <Modal.Section>
                            {selectedFeedback && (
                                <BlockStack gap="400">
                                    <div>
                                        <Text variant="headingSm" as="h4">Product</Text>
                                        <Text tone="subdued">{selectedFeedback.product_title || 'General Product'}</Text>
                                    </div>

                                    <div>
                                        <Text variant="headingSm" as="h4">Objection Reason</Text>
                                        <Badge tone="warning">{selectedFeedback.reason}</Badge>
                                    </div>

                                    <div>
                                        <Text variant="headingSm" as="h4">Customer Email</Text>
                                        <Text tone="subdued">{selectedFeedback.customer_email || 'Anonymous Visitor'}</Text>
                                    </div>

                                    <div>
                                        <Text variant="headingSm" as="h4">Full Note / Comment</Text>
                                        <div style={{
                                            backgroundColor: '#f6f6f7',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            marginTop: '4px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #e1e3e5'
                                        }}>
                                            <Text variant="bodyMd">{selectedFeedback.custom_comment}</Text>
                                        </div>
                                    </div>

                                    <div>
                                        <Text variant="bodyXs" tone="subdued">
                                            Submitted on: {selectedFeedback.created_at || 'Recently'}
                                        </Text>
                                    </div>
                                </BlockStack>
                            )}
                        </Modal.Section>
                    </Modal>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
