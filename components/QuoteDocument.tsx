import React from 'react';
import { Plan, Item, AttendeeTier } from '../types';

interface QuoteDocumentProps {
    plan: Plan;
    items: Item[];
    selectedOptions: Set<number>;
    selectedGrades: Map<number, string>;
    attendeeTier: AttendeeTier;
    customAttendeeCount: string;
    freeInputValues: Map<number, number>;
    totalCost: number;
    attendeeLabel: string;
}

const QuoteDocument: React.FC<QuoteDocumentProps> = ({
    plan,
    items,
    selectedOptions,
    selectedGrades,
    attendeeTier,
    customAttendeeCount,
    freeInputValues,
    totalCost,
    attendeeLabel,
}) => {
    const TAX_RATE = 0.10; // 10%
    const totalWithTax = Math.floor(totalCost * (1 + TAX_RATE));
    const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // --- Helpers ---

    // Get all items to display (included + selected options)
    const displayItems = items.filter((item) => {
        if (!item.allowedPlans.includes(plan.id)) return false;

        // Always show free input
        if (item.type === 'free_input') return true;

        // Included items
        if (item.type === 'included') return true;

        // Checkbox / Tier Dependent
        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            return selectedOptions.has(item.id);
        }

        // Dropdown
        if (item.type === 'dropdown') {
            return selectedGrades.has(item.id);
        }
        return false;
    });

    const getItemPrice = (item: Item): number => {
        if (item.type === 'checkbox') return item.basePrice || 0;
        if (item.type === 'dropdown') {
            const gradeId = selectedGrades.get(item.id);
            if (gradeId && item.options) {
                const option = item.options.find((o) => o.id === gradeId);
                return option ? option.price : 0;
            }
            return 0;
        }
        if (item.type === 'tier_dependent' && item.tierPrices) {
            if (attendeeTier === 'D') {
                const unitPrice = item.tierPrices['D'] ?? 0;
                const count = parseInt(customAttendeeCount) || 0;
                return unitPrice * count;
            } else {
                return item.tierPrices[attendeeTier] || 0;
            }
        }
        if (item.type === 'free_input') {
            return freeInputValues.get(item.id) ?? item.basePrice ?? 0;
        }
        return 0;
    };

    const getItemLabel = (item: Item): string => {
        if (item.type === 'dropdown') {
            const gradeId = selectedGrades.get(item.id);
            if (gradeId && item.options) {
                const option = item.options.find(o => o.id === gradeId);
                return option?.name || '';
            }
        }
        if (item.type === 'tier_dependent') {
            if (attendeeTier === 'D') return `(${customAttendeeCount}名)`;
            // Could map tier to label if needed, but keeping it simple
            return '';
        }
        return '-';
    };

    // --- Layout Constants (mm) ---
    // A4: 210 x 297

    return (
        <div
            id="quote-document"
            style={{
                width: '210mm',
                height: '297mm',
                position: 'relative',
                fontFamily: '"Example Font", "Yu Gothic", sans-serif', // Adjust font as needed
                color: '#333'
            }}
        >
            {/* Background Image - Using img tag for better print support */}
            <img
                src="/quote_template.jpg"
                alt=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }}
            />

            {/* Date (Top Right) */}
            <div style={{ position: 'absolute', top: '23mm', left: '138mm', fontSize: '10pt', backgroundColor: 'transparent', zIndex: 1 }}>
                {today}
            </div>

            {/* Plan Name (Bottom Left Green Box) */}
            <div style={{
                position: 'absolute',
                top: '228mm',
                left: '12mm',
                width: '90mm',
                height: '35mm',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                textAlign: 'center',
                zIndex: 1
            }}>
                <h2 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0 }}>{plan.name}</h2>
                <p style={{ fontSize: '12pt', marginTop: '5mm' }}>参列人数: {attendeeLabel}</p>
            </div>

            {/* Items Table (Right Column) */}
            {/* Overlaying the table rows. Assuming fixed row height approx 7.2mm based on manual estimation. */}
            {/* Start Y approx 65mm */}
            <div style={{ position: 'absolute', top: '65mm', left: '106mm', width: '92mm', fontSize: '9pt', zIndex: 1 }}>
                {displayItems.map((item, index) => {
                    // Start rendering from the first row.
                    // Max rows approx 20?
                    if (index > 22) return null; // Prevent overflow

                    const rowHeight = '7.5mm'; // Adjusted based on standard template line height
                    const price = getItemPrice(item);

                    return (
                        <div
                            key={item.id}
                            style={{
                                height: rowHeight,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255,255,255,0.95)', // Semi-opaque to hide pre-printed text if mismatch
                                borderBottom: '1px solid #ddd',
                            }}
                        >
                            {/* Item Name */}
                            <div style={{ width: '42mm', paddingLeft: '2mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {item.name}
                            </div>
                            {/* Option/Detail */}
                            <div style={{ width: '27mm', textAlign: 'center', fontSize: '8pt' }}>
                                {getItemLabel(item)}
                            </div>
                            {/* Price */}
                            <div style={{ width: '23mm', textAlign: 'right', paddingRight: '2mm', fontWeight: 'bold' }}>
                                {price > 0 ? `¥${price.toLocaleString()}` : ''}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals (Bottom Right) */}
            {/* Subtotal */}
            <div style={{ position: 'absolute', top: '249mm', left: '170mm', width: '28mm', textAlign: 'right', fontSize: '11pt', fontWeight: 'bold', zIndex: 1 }}>
                ¥{totalCost.toLocaleString()}
            </div>
            {/* Tax */}
            <div style={{ position: 'absolute', top: '256.5mm', left: '170mm', width: '28mm', textAlign: 'right', fontSize: '11pt', fontWeight: 'bold', zIndex: 1 }}>
                ¥{Math.floor(totalCost * TAX_RATE).toLocaleString()}
            </div>
            {/* Grand Total */}
            <div style={{ position: 'absolute', top: '264mm', left: '170mm', width: '28mm', textAlign: 'right', fontSize: '14pt', fontWeight: 'bold', zIndex: 1 }}>
                ¥{totalWithTax.toLocaleString()}
            </div>
        </div>
    );
};

export default QuoteDocument;
