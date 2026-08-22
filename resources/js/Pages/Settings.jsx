import React, { useState, useEffect } from 'react';
import { Page, BlockStack, Card, Text, TextField, Button, Banner, InlineStack, Checkbox, Divider, Box, Badge, RadioButton } from '@shopify/polaris';
import { DeleteIcon, PlusIcon, SearchIcon } from '@shopify/polaris-icons';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

function ProductSearchSelector({ label, helpText, selectedItems, onUpdateItems }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const performSearch = (queryVal) => {
        setSearching(true);
        fetch(`/api/products/search?q=${encodeURIComponent(queryVal)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.products) {
                    setSearchResults(data.products);
                    setShowDropdown(true);
                }
            })
            .catch(err => console.error('Product search error:', err))
            .finally(() => setSearching(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (showDropdown || searchQuery.trim().length > 0) {
                performSearch(searchQuery);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFocus = () => {
        setShowDropdown(true);
        if (searchResults.length === 0) {
            performSearch(searchQuery);
        }
    };

    const handleAddProduct = (product) => {
        const handle = typeof product === 'string' ? product.trim() : (product.handle || product.id);
        if (!handle) return;

        const exists = selectedItems.some(item => {
            const h = typeof item === 'string' ? item : (item.handle || item.id);
            return h.toLowerCase() === handle.toLowerCase();
        });

        if (!exists) {
            onUpdateItems([...selectedItems, product]);
        }
        setSearchQuery('');
        setShowDropdown(false);
    };

    const handleRemoveProduct = (indexToRemove) => {
        onUpdateItems(selectedItems.filter((_, idx) => idx !== indexToRemove));
    };

    const handleManualAdd = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchQuery.trim()) {
                handleAddProduct(searchQuery.trim());
            }
        }
    };

    return (
        <BlockStack gap="200">
            <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
            
            <div style={{ position: 'relative' }}>
                <InlineStack gap="200" align="space-between">
                    <div style={{ flexGrow: 1 }}>
                        <TextField
                            placeholder="Search product name, handle, or ID..."
                            value={searchQuery}
                            onChange={(val) => {
                                setSearchQuery(val);
                                setShowDropdown(true);
                            }}
                            onFocus={handleFocus}
                            onKeyDown={handleManualAdd}
                            autoComplete="off"
                            helpText={helpText}
                        />
                    </div>
                    {searchQuery.trim() && (
                        <Button onClick={() => handleAddProduct(searchQuery.trim())}>
                            + Add Custom
                        </Button>
                    )}
                </InlineStack>

                {showDropdown && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        border: '1px solid #c9cccf',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        marginTop: '4px',
                        padding: '6px 0',
                    }}>
                        {searching && (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                🔍 Searching store products...
                            </div>
                        )}

                        {!searching && searchResults.length === 0 && (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
                                No products found. Type product handle directly or press "+ Add Custom".
                            </div>
                        )}

                        {!searching && searchResults.map((prod) => {
                            const isSelected = selectedItems.some(item => {
                                const h = typeof item === 'string' ? item : (item.handle || item.id);
                                return h.toLowerCase() === prod.handle.toLowerCase() || h === prod.id;
                            });

                            return (
                                <div
                                    key={prod.id || prod.handle}
                                    onClick={() => !isSelected && handleAddProduct(prod)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 14px',
                                        cursor: isSelected ? 'default' : 'pointer',
                                        backgroundColor: isSelected ? '#f1f5f9' : '#ffffff',
                                        opacity: isSelected ? 0.6 : 1,
                                        borderBottom: '1px solid #f8fafc',
                                    }}
                                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f0f7ff'; }}
                                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                                >
                                    {prod.image ? (
                                        <img src={prod.image} alt={prod.title} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                    ) : (
                                        <div style={{ width: '38px', height: '38px', borderRadius: '4px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                                    )}

                                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {prod.title}
                                        </div>
                                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                            Handle: <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{prod.handle}</span> {prod.id ? `| ID: ${prod.id}` : ''}
                                        </div>
                                    </div>

                                    <Button size="micro" variant={isSelected ? 'tertiary' : 'primary'} disabled={isSelected}>
                                        {isSelected ? 'Added' : '+ Add'}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '8px' }}>
                <Text tone="subdued" variant="bodySm">
                    Selected Products ({selectedItems.length}):
                </Text>
                
                {selectedItems.length === 0 ? (
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1', marginTop: '6px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                        No products added yet. Use the search bar above to search and select products.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {selectedItems.map((item, index) => {
                            const title = typeof item === 'string' ? item : (item.title || item.handle || item.id);
                            const handle = typeof item === 'string' ? item : (item.handle || item.id);
                            const img = typeof item === 'object' ? item.image : null;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '20px',
                                        fontSize: '12.5px',
                                        color: '#1e40af',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    {img ? (
                                        <img src={img} alt={title} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '12px' }}>🏷️</span>
                                    )}

                                    <span style={{ fontWeight: '600' }}>{title}</span>
                                    {handle && handle !== title && (
                                        <span style={{ fontSize: '11px', opacity: 0.75 }}>({handle})</span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveProduct(index)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            fontWeight: 'bold',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            lineHeight: 1,
                                            padding: '0 2px',
                                            marginLeft: '2px',
                                            borderRadius: '50%',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        title="Remove product"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </BlockStack>
    );
}

export default function Settings({ reasons = [], enable_email = true, require_email = false, enable_phone = false, require_phone = false, enable_whatsapp = false, whatsapp_number = '', whatsapp_button_text = 'I have a question', whatsapp_message_template = 'Hi! I have a question about {product_title}: {product_url}', enable_messenger = false, messenger_username = '', messenger_button_text = 'Chat on Messenger', popup_theme = 'modern', product_targeting_mode = 'all', excluded_products = [], included_products = [], plan = 'free', currentPlan = 'free', shopDomain = '' }) {
    const isPro = (currentPlan === 'pro' || plan === 'pro');

    const defaultReasons = [
        'Price is higher than expected',
        'Unsure about size / fit / dimensions',
        'Shipping fee or delivery time is too high',
        'Product information or reviews missing',
        'Other reason',
    ];

    const [reasonList, setReasonList] = useState(reasons.length > 0 ? reasons : defaultReasons);
    const [collectEmail, setCollectEmail] = useState(enable_email);
    const [isEmailRequired, setIsEmailRequired] = useState(require_email);
    const [collectPhone, setCollectPhone] = useState(enable_phone);
    const [isPhoneRequired, setIsPhoneRequired] = useState(require_phone);
    
    // WhatsApp Inquiry state
    const [enableWhatsapp, setEnableWhatsapp] = useState(enable_whatsapp);
    const [whatsappNumber, setWhatsappNumber] = useState(whatsapp_number);
    const [whatsappButtonText, setWhatsappButtonText] = useState(whatsapp_button_text);
    const [whatsappMsgTemplate, setWhatsappMsgTemplate] = useState(whatsapp_message_template);

    // Facebook Messenger Inquiry state
    const [enableMessenger, setEnableMessenger] = useState(enable_messenger);
    const [messengerUsername, setMessengerUsername] = useState(messenger_username);
    const [messengerButtonText, setMessengerButtonText] = useState(messenger_button_text);

    const [selectedTheme, setSelectedTheme] = useState(popup_theme || 'modern');

    // Product Targeting / Display Rules state
    const [targetingMode, setTargetingMode] = useState(product_targeting_mode || 'all');
    const [excludedItems, setExcludedItems] = useState(excluded_products || []);
    const [includedItems, setIncludedItems] = useState(included_products || []);

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const [previewSelectedBadge, setPreviewSelectedBadge] = useState('A');

    const themePresets = [
        {
            id: 'modern',
            name: 'Standard Card List',
            description: 'Classic vertical list with radio buttons and clean borders.',
            type: 'modern',
            proOnly: false,
        },
        {
            id: 'dropdown',
            name: 'Dropdown Select Box',
            description: 'Clean dropdown selection menu where customers select a reason from a dropdown list.',
            type: 'dropdown',
            proOnly: false,
        },
        {
            id: 'chips_grid',
            name: 'Horizontal Tag Chips',
            description: 'Compact side-by-side tags with checkmarks on active items.',
            type: 'chips',
            proOnly: false,
        },
        {
            id: 'dark',
            name: 'Sleek Dark Mode',
            description: 'Dark mode modal layout with glowing active selection.',
            type: 'dark',
            proOnly: false,
        },
    ];

    const handleReasonChange = (index, newValue) => {
        const updated = [...reasonList];
        updated[index] = newValue;
        setReasonList(updated);
    };

    const handleAddReason = () => {
        setReasonList([...reasonList, '']);
    };

    const handleRemoveReason = (indexToRemove) => {
        if (reasonList.length <= 1) {
            alert('You must keep at least one feedback reason option.');
            return;
        }
        setReasonList(reasonList.filter((_, index) => index !== indexToRemove));
    };

    const handleThemeSelect = (preset) => {
        setSelectedTheme(preset.id);
    };

    const extractHandles = (items) => {
        return (items || []).map(item => {
            if (typeof item === 'string') return item.trim();
            return item.handle || item.id || item.title;
        }).filter(Boolean);
    };

    const handleSave = () => {
        setSaving(true);
        const filteredReasons = reasonList.filter(r => r.trim() !== '');

        router.post('/settings/save', {
            reasons: filteredReasons,
            enable_email: collectEmail,
            require_email: isEmailRequired,
            enable_phone: collectPhone,
            require_phone: isPhoneRequired,
            enable_whatsapp: enableWhatsapp,
            whatsapp_number: whatsappNumber,
            whatsapp_button_text: whatsappButtonText,
            whatsapp_message_template: whatsappMsgTemplate,
            enable_messenger: enableMessenger,
            messenger_username: messengerUsername,
            messenger_button_text: messengerButtonText,
            popup_theme: selectedTheme,
            product_targeting_mode: targetingMode,
            excluded_products: extractHandles(excludedItems),
            included_products: extractHandles(includedItems),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            },
            onError: (errors) => {
                console.error('Settings save error:', errors);
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            },
            onFinish: () => setSaving(false)
        });
    };

    return (
        <AppLayout>
            <Page
                title="App Settings & Reasons"
                subtitle="Customize options, email & phone collection rules, and storefront popup design presets."
            >
                <BlockStack gap="500">
                    {saved && (
                        <Banner tone="success" onDismiss={() => setSaved(false)}>
                            <p>App settings saved successfully! Storefront popup will now reflect these options.</p>
                        </Banner>
                    )}

                    {/* 1. Pre-Defined Feedback Reasons Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Pre-Defined Feedback Reasons</Text>
                            <Text tone="subdued" variant="bodySm">
                                Dynamically add or remove reason options shown in the storefront feedback popup.
                            </Text>

                            <BlockStack gap="300">
                                {reasonList.map((reason, index) => (
                                    <InlineStack key={index} align="space-between" blockAlign="center" gap="300">
                                        <div style={{ flexGrow: 1 }}>
                                            <TextField
                                                label={`Reason Option ${index + 1}`}
                                                labelHidden
                                                placeholder={`Reason Option ${index + 1}`}
                                                value={reason}
                                                onChange={(val) => handleReasonChange(index, val)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <Button
                                            tone="critical"
                                            variant="tertiary"
                                            icon={DeleteIcon}
                                            accessibilityLabel="Remove reason"
                                            onClick={() => handleRemoveReason(index)}
                                        />
                                    </InlineStack>
                                ))}
                            </BlockStack>

                            <InlineStack align="space-between" blockAlign="center">
                                <Button icon={PlusIcon} onClick={handleAddReason}>
                                    Add New Reason Option
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>

                    {/* 2. Customer Contact & Email / Phone Collection Settings Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Customer Contact Collection (Email & Phone)</Text>
                            <Text tone="subdued" variant="bodySm">
                                Control whether email address and/or phone number fields are displayed in the feedback popup and if they are mandatory.
                            </Text>

                            <BlockStack gap="400">
                                {/* Email Collection Settings */}
                                <BlockStack gap="200">
                                    <Checkbox
                                        label="Collect customer email address in feedback popup"
                                        checked={collectEmail}
                                        onChange={(newVal) => {
                                            setCollectEmail(newVal);
                                            if (!newVal) setIsEmailRequired(false);
                                        }}
                                        helpText="Adds an email input field to the feedback popup so customers can leave their contact info."
                                    />

                                    {collectEmail && (
                                        <div style={{ paddingLeft: '24px' }}>
                                            <Checkbox
                                                label="Make Email Address Required / Mandatory"
                                                checked={isEmailRequired}
                                                onChange={(newVal) => setIsEmailRequired(newVal)}
                                                helpText="If checked, customers must provide a valid email before submitting feedback."
                                            />
                                        </div>
                                    )}
                                </BlockStack>

                                <Divider />

                                {/* Phone Collection Settings */}
                                <BlockStack gap="200">
                                    <Checkbox
                                        label="Collect customer phone number in feedback popup"
                                        checked={collectPhone}
                                        onChange={(newVal) => {
                                            setCollectPhone(newVal);
                                            if (!newVal) setIsPhoneRequired(false);
                                        }}
                                        helpText="Adds a phone number input field to the feedback popup so customers can leave their phone number."
                                    />

                                    {collectPhone && (
                                        <div style={{ paddingLeft: '24px' }}>
                                            <Checkbox
                                                label="Make Phone Number Required / Mandatory"
                                                checked={isPhoneRequired}
                                                onChange={(newVal) => setIsPhoneRequired(newVal)}
                                                helpText="If checked, customers must provide a valid phone number before submitting feedback."
                                            />
                                        </div>
                                    )}
                                </BlockStack>
                            </BlockStack>
                        </BlockStack>
                    </Card>

                    {/* WhatsApp Inquiry & Direct Chat Settings Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">WhatsApp Instant Inquiry Chat</Text>
                            <Text tone="subdued" variant="bodySm">
                                Allow store visitors to ask pre-purchase questions directly on WhatsApp with prefilled product title & website link.
                            </Text>

                            <BlockStack gap="400">
                                <Checkbox
                                    label="Enable WhatsApp Inquiry option on storefront widget"
                                    checked={enableWhatsapp}
                                    onChange={(newVal) => setEnableWhatsapp(newVal)}
                                    helpText="When enabled, a WhatsApp chat button will appear alongside or within the feedback widget."
                                />

                                {enableWhatsapp && (
                                    <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <TextField
                                            label="Merchant WhatsApp Phone Number"
                                            placeholder="e.g. +8801700000000 or 15551234567"
                                            value={whatsappNumber}
                                            onChange={(val) => setWhatsappNumber(val)}
                                            autoComplete="off"
                                            helpText="Include country code (e.g. +880 for BD, +1 for US). Do not include spaces or hyphens."
                                        />

                                        <TextField
                                            label="WhatsApp Button Label"
                                            placeholder="e.g. Chat on WhatsApp"
                                            value={whatsappButtonText}
                                            onChange={(val) => setWhatsappButtonText(val)}
                                            autoComplete="off"
                                            helpText="Text shown on the WhatsApp inquiry button."
                                        />

                                        <TextField
                                            label="Default Prefilled WhatsApp Message"
                                            placeholder="Hi! I have a question about {product_title}: {product_url}"
                                            value={whatsappMsgTemplate}
                                            onChange={(val) => setWhatsappMsgTemplate(val)}
                                            multiline={2}
                                            autoComplete="off"
                                            helpText="Placeholders available: {product_title} and {product_url}"
                                        />
                                    </div>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Card>

                    {/* Facebook Messenger Inquiry & Direct Chat Settings Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Facebook Messenger Instant Chat</Text>
                            <Text tone="subdued" variant="bodySm">
                                Allow store visitors to send direct messages to your Facebook Business Page on Messenger via m.me link.
                            </Text>

                            <BlockStack gap="400">
                                <Checkbox
                                    label="Enable Facebook Messenger Inquiry option on storefront widget"
                                    checked={enableMessenger}
                                    onChange={(newVal) => setEnableMessenger(newVal)}
                                    helpText="When enabled, a Facebook Messenger chat button will appear in the inquiry tab."
                                />

                                {enableMessenger && (
                                    <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <TextField
                                            label="Facebook Page Username or ID"
                                            placeholder="e.g. mybrandpage or 100012345678"
                                            value={messengerUsername}
                                            onChange={(val) => setMessengerUsername(val)}
                                            autoComplete="off"
                                            helpText="Your Facebook Page username or Numeric ID (found in your Facebook Page URL, e.g. facebook.com/mybrandpage)."
                                        />

                                        <TextField
                                            label="Messenger Button Label"
                                            placeholder="e.g. Chat on Messenger"
                                            value={messengerButtonText}
                                            onChange={(val) => setMessengerButtonText(val)}
                                            autoComplete="off"
                                            helpText="Text shown on the Facebook Messenger inquiry button."
                                        />
                                    </div>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Card>

                    {/* 3. Product Targeting & Display Rules Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Product Targeting & Visibility Rules</Text>
                            <Text tone="subdued" variant="bodySm">
                                Control which product pages display the feedback button. Choose to show on all products, or target/exclude specific products.
                            </Text>

                            <BlockStack gap="300">
                                <RadioButton
                                    label="Show on ALL Products"
                                    helpText="Default option. The feedback button will appear on all product pages."
                                    checked={targetingMode === 'all'}
                                    id="targeting_all"
                                    name="targeting_mode"
                                    onChange={() => setTargetingMode('all')}
                                />

                                <RadioButton
                                    label="Show on ALL Products EXCEPT Specific Products (Exclude Mode)"
                                    helpText="Hide the feedback button on selected products (e.g. out of 10 products, hide on 4 specific products)."
                                    checked={targetingMode === 'exclude'}
                                    id="targeting_exclude"
                                    name="targeting_mode"
                                    onChange={() => setTargetingMode('exclude')}
                                />

                                {targetingMode === 'exclude' && (
                                    <div style={{ paddingLeft: '28px', marginTop: '4px' }}>
                                        <ProductSearchSelector
                                            label="Select Excluded Products (Hide Feedback Button)"
                                            helpText="Search and select products to hide feedback button on, or type custom handle and press Enter."
                                            selectedItems={excludedItems}
                                            onUpdateItems={setExcludedItems}
                                        />
                                    </div>
                                )}

                                <RadioButton
                                    label="Show ONLY on Specific Products (Include Mode)"
                                    helpText="Display the feedback button only on selected product pages."
                                    checked={targetingMode === 'include'}
                                    id="targeting_include"
                                    name="targeting_mode"
                                    onChange={() => setTargetingMode('include')}
                                />

                                {targetingMode === 'include' && (
                                    <div style={{ paddingLeft: '28px', marginTop: '4px' }}>
                                        <ProductSearchSelector
                                            label="Select Included Products (Show Feedback Button Only Here)"
                                            helpText="Search and select products to show feedback button on, or type custom handle and press Enter."
                                            selectedItems={includedItems}
                                            onUpdateItems={setIncludedItems}
                                        />
                                    </div>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Card>

                    {/* 4. Popup Design Presets Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Storefront Popup Option Design Layouts</Text>
                            <Text tone="subdued" variant="bodySm">
                                Choose how feedback options are formatted inside the storefront popup window.
                            </Text>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: '16px',
                                marginTop: '8px'
                            }}>
                                {themePresets.map((preset) => {
                                    const isSelected = selectedTheme === preset.id;
                                    const isLocked = preset.proOnly && !isPro;

                                    return (
                                        <div
                                            key={preset.id}
                                            onClick={() => handleThemeSelect(preset)}
                                            style={{
                                                border: `2px solid ${isSelected ? '#2c6ecb' : '#e1e3e5'}`,
                                                borderRadius: '12px',
                                                padding: '16px',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                                                transition: 'all 0.2s ease-in-out',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div>
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text variant="headingSm" as="h3">{preset.name}</Text>
                                                    <input
                                                        type="radio"
                                                        name="popup_theme_preset"
                                                        checked={isSelected}
                                                        onChange={() => handleThemeSelect(preset)}
                                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    />
                                                </InlineStack>

                                                <Box paddingBlockStart="100">
                                                    <Text tone="subdued" variant="bodySm">{preset.description}</Text>
                                                </Box>
                                            </div>

                                            {/* Real E-commerce UI Mini Mock Preview */}
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                backgroundColor: preset.type === 'dark' ? '#0f172a' : '#f8fafc',
                                                border: `1px solid ${preset.type === 'dark' ? '#334155' : '#e2e8f0'}`,
                                            }}>
                                                {preset.type === 'modern' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', fontSize: '11px', color: '#1d4ed8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> High Price
                                                        </div>
                                                        <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #cbd5e1' }}></span> Unsure Size
                                                        </div>
                                                    </div>
                                                )}

                                                {(preset.type === 'dropdown' || preset.type === 'badge') && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '10px',
                                                            border: '1.5px solid #6366f1',
                                                            background: '#ffffff',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            color: '#0f172a',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.08)',
                                                        }}>
                                                            <span>Price is higher than expected</span>
                                                            <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 'bold' }}>∨</span>
                                                        </div>
                                                        <div style={{
                                                            borderRadius: '10px',
                                                            border: '1px solid #e2e8f0',
                                                            background: '#ffffff',
                                                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                        }}>
                                                            <div style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b' }}>Select reason...</div>
                                                            <div style={{ padding: '6px 10px', fontSize: '10.5px', color: '#4338ca', fontWeight: '700', background: '#e0e7ff', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Price is higher than expected</span>
                                                                <span>✓</span>
                                                            </div>
                                                            <div style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b' }}>Unsure about size / fit</div>
                                                            <div style={{ padding: '6px 10px', fontSize: '10.5px', color: '#64748b' }}>Shipping fee is too high</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {preset.type === 'chips' && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #22c55e', background: '#f0fdf4', fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                                                            ✓ High Price
                                                        </div>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', color: '#64748b' }}>
                                                            Shipping Fee
                                                        </div>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', color: '#64748b' }}>
                                                            Unsure Size
                                                        </div>
                                                    </div>
                                                )}

                                                {preset.type === 'dark' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #6366f1', background: 'rgba(99, 102, 241, 0.2)', fontSize: '11px', color: '#a5b4fc', fontWeight: '600' }}>
                                                            • High Price
                                                        </div>
                                                        <div style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', fontSize: '11px', color: '#94a3b8' }}>
                                                            • Unsure Size
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Divider />

                            <InlineStack align="end">
                                <Button variant="primary" loading={saving} onClick={handleSave}>
                                    Save Settings
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
