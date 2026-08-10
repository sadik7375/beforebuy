import React from 'react';

export default function AppLayout({ children }) {
    return (
        <>
            <ui-nav-menu style={{ display: 'none' }}>
                <a href="/" rel="home">Overview</a>
                <a href="/submissions">Feedback Submissions</a>
                <a href="/settings">Settings</a>
                <a href="/setup">Support & Setup</a>
                <a href="/pricing">Price Plan</a>
            </ui-nav-menu>
            {children}
        </>
    );
}
