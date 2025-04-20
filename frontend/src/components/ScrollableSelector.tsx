import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ScrollableSelectorProps<T> {
    options: T[];
    onSelect: (selected: T) => void;
    initialSelected?: T;
    className?: string;
    itemHeight?: number; // Make item height configurable
    visibleItemCount?: number; // Define how many items are roughly visible
}

const ScrollableSelector = <T extends string | number>({
                                                           options,
                                                           onSelect,
                                                           initialSelected,
                                                           className = '',
                                                           itemHeight = 40, // Default item height
                                                           visibleItemCount = 5, // Default visible items (determines container height)
                                                       }: ScrollableSelectorProps<T>) => {
    const containerHeight = itemHeight * visibleItemCount;

    const getInitialIndex = () => {
        if (initialSelected !== undefined) {
            const index = options.indexOf(initialSelected);
            return index >= 0 ? index : 0;
        }
        return 0;
    };

    const initialIndex = getInitialIndex();
    const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
    const [scrollOffset, setScrollOffset] = useState<number>(-initialIndex * itemHeight); // Initialize offset based on index
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const wheelTimeoutRef = useRef<number | null>(null);
    const isAnimatingRef = useRef(false); // Prevent interference during animation

    // Focus the container on mount to enable keyboard controls
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    // Animate scroll to target position
    const animate = useCallback((from: number, to: number, duration = 300) => {
        if (isAnimatingRef.current) return; // Don't start new animation if one is running
        isAnimatingRef.current = true;

        const startTime = performance.now();

        const animateStep = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out quad function for smooth deceleration
            const easeOutQuad = (t: number) => t * (2 - t);
            const easedProgress = easeOutQuad(progress);

            const currentOffset = from + (to - from) * easedProgress;
            setScrollOffset(currentOffset);

            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                setScrollOffset(to); // Ensure final position is exact
                isAnimatingRef.current = false;
                // Update index and trigger onSelect *after* animation finishes
                const finalIndex = Math.abs(Math.round(to / itemHeight));
                if (finalIndex >= 0 && finalIndex < options.length) {
                    if (finalIndex !== selectedIndex) {
                        setSelectedIndex(finalIndex);
                        onSelect(options[finalIndex]);
                    }
                } else {
                    // Fallback if calculation goes wrong (shouldn't happen with clamping)
                    const fallbackIndex = Math.max(0, Math.min(options.length - 1, finalIndex));
                    if (fallbackIndex !== selectedIndex) {
                        setSelectedIndex(fallbackIndex);
                        onSelect(options[fallbackIndex]);
                    }
                }
            }
        };

        requestAnimationFrame(animateStep);
    }, [itemHeight, options, onSelect, selectedIndex]); // Add dependencies used inside


    // Normalize scroll offset to snap to the closest item and clamp bounds
    const normalizeOffset = useCallback((offset: number): number => {
        const maxOffset = 0; // Top limit
        const minOffset = -(options.length - 1) * itemHeight; // Bottom limit

        let normalizedOffset = Math.round(offset / itemHeight) * itemHeight;

        // Clamp the offset
        normalizedOffset = Math.max(minOffset, Math.min(maxOffset, normalizedOffset));

        return normalizedOffset;
    }, [options.length, itemHeight]);

    // Effect to handle index update when scrollOffset changes *due to dragging/wheeling*
    // Note: We now update the index primarily *after* animation/normalization completes
    // This effect might be redundant if animate handles all index updates, but can serve as a fallback
    // Let's comment it out for now as `animate` handles the final update.
    /*
    useEffect(() => {
      if (!isDragging && !isAnimatingRef.current) { // Only update if not dragging or animating
          const index = Math.abs(Math.round(scrollOffset / itemHeight));
          if (index >= 0 && index < options.length && index !== selectedIndex) {
              setSelectedIndex(index);
              onSelect(options[index]);
          }
      }
    }, [scrollOffset, options, onSelect, selectedIndex, isDragging]);
    */


    // Mouse/Touch event handlers
    const handleStart = (clientY: number) => {
        if (isAnimatingRef.current) return; // Prevent starting drag during animation
        setIsDragging(true);
        setStartY(clientY);
        // Clear any pending wheel timeout
        if (wheelTimeoutRef.current) {
            clearTimeout(wheelTimeoutRef.current);
            wheelTimeoutRef.current = null;
        }
    };

    const handleMove = (clientY: number) => {
        if (!isDragging) return;

        const deltaY = clientY - startY;
        // Update scrollOffset immediately for responsiveness during drag
        setScrollOffset(prev => prev + deltaY);
        setStartY(clientY); // Update startY for the next move calculation
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const normalized = normalizeOffset(scrollOffset);

        // Animate to the nearest snapped position
        if (normalized !== scrollOffset) {
            animate(scrollOffset, normalized);
        } else {
            // If already normalized, ensure index is correct
            const currentIndex = Math.abs(Math.round(scrollOffset / itemHeight));
            if (currentIndex !== selectedIndex && currentIndex >= 0 && currentIndex < options.length) {
                setSelectedIndex(currentIndex);
                onSelect(options[currentIndex]);
            }
        }
    };

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleStart(e.clientY);
        containerRef.current?.focus(); // Ensure focus on click/drag start
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // No preventDefault here, allow text selection etc. outside component
        handleMove(e.clientY);
    };

    const handleMouseUp = () => {
        handleEnd();
    };

    const handleMouseLeave = () => {
        // If dragging, end the drag when mouse leaves container
        if (isDragging) {
            handleEnd();
        }
    };

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        // Don't preventDefault here initially, allow native scroll if needed elsewhere
        handleStart(e.touches[0].clientY);
        containerRef.current?.focus(); // Ensure focus on touch start
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Prevent default page scrolling ONLY when dragging the component
        if (isDragging) {
            e.preventDefault();
            handleMove(e.touches[0].clientY);
        }
    };

    const handleTouchEnd = () => {
        handleEnd();
    };

    // Handle wheel events for scrolling
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Prevent page scrolling
        if (isAnimatingRef.current) return; // Ignore wheel events during animation

        const delta = e.deltaY;
        // Adjust sensitivity if needed
        const newOffsetUnclamped = scrollOffset - delta * 0.5;

        // Clamp immediately to prevent scrolling beyond limits during wheel
        const maxOffset = 0;
        const minOffset = -(options.length - 1) * itemHeight;
        const newOffset = Math.max(minOffset, Math.min(maxOffset, newOffsetUnclamped));

        setScrollOffset(newOffset);

        // Clear any existing timeout
        if (wheelTimeoutRef.current) {
            clearTimeout(wheelTimeoutRef.current);
        }

        // Set a timeout to normalize the position after wheel stops
        wheelTimeoutRef.current = setTimeout(() => {
            if (!isDragging) { // Don't normalize if user started dragging
                const normalized = normalizeOffset(newOffset);
                animate(newOffset, normalized);
            }
            wheelTimeoutRef.current = null;
        }, 150); // Adjust timeout duration as needed
    };

    // Handle keyboard arrow controls (attached directly to the container)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isAnimatingRef.current) return; // Ignore key events during animation

        let newIndex = selectedIndex;
        if (e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent page scrolling
            if (selectedIndex > 0) {
                newIndex = selectedIndex - 1;
            } else {
                return; // Already at the top
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault(); // Prevent page scrolling
            if (selectedIndex < options.length - 1) {
                newIndex = selectedIndex + 1;
            } else {
                return; // Already at the bottom
            }
        } else {
            return; // Ignore other keys
        }

        const newOffset = -newIndex * itemHeight;
        animate(scrollOffset, newOffset);
    };

    // Arrow button click handlers
    const handleArrowClick = (direction: 'up' | 'down') => {
        if (isAnimatingRef.current) return;

        let newIndex = selectedIndex;
        if (direction === 'up' && selectedIndex > 0) {
            newIndex = selectedIndex - 1;
        } else if (direction === 'down' && selectedIndex < options.length - 1) {
            newIndex = selectedIndex + 1;
        } else {
            return; // Cannot scroll further
        }

        const newOffset = -newIndex * itemHeight;
        animate(scrollOffset, newOffset);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (wheelTimeoutRef.current) {
                clearTimeout(wheelTimeoutRef.current);
            }
        };
    }, []);

    // Calculate the translateY for centering
    // We want the center of the selected item to align with the center of the container.
    // Center of container = containerHeight / 2
    // Center of selected item = (selectedIndex * itemHeight) + (itemHeight / 2) relative to the top of the items div
    // Target translateY = containerCenter - selectedItemCenterRelativeToItemsDivTop = containerHeight / 2 - (selectedIndex * itemHeight + itemHeight / 2)
    // Using scrollOffset = -selectedIndex * itemHeight:
    // Target translateY = containerHeight / 2 + scrollOffset - itemHeight / 2
    const transformY = `calc(${containerHeight / 2}px - ${itemHeight / 2}px + ${scrollOffset}px)`;

    const canScrollUp = selectedIndex > 0;
    const canScrollDown = selectedIndex < options.length - 1;

    return (
        <div
            className={`scrollable-selector-container ${className}`}
            ref={containerRef}
            tabIndex={0} // Make div focusable for keyboard events
            style={{
                width: '150px', // Example width
                height: `${containerHeight}px`,
                overflow: 'hidden',
                position: 'relative',
                userSelect: 'none', // Prevent text selection during drag
                cursor: isDragging ? 'grabbing' : 'grab',
                borderRadius: '8px',
                background: 'linear-gradient(180deg, rgba(40,40,40,0.8) 0%, rgba(20,20,20,0.9) 100%)', // Darker background example
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                outline: 'none', // Remove focus outline (consider adding custom focus style for accessibility)
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined} // Only track moves while dragging
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave} // Handle mouse leaving container while dragging
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown} // Use direct handler
        >
            {/* Up Arrow Button */}
            <button
                aria-label="Scroll Up"
                onClick={() => handleArrowClick('up')}
                disabled={!canScrollUp || isAnimatingRef.current}
                style={{
                    position: 'absolute',
                    top: '5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: !canScrollUp || isAnimatingRef.current ? 0.3 : 1, // Dim when disabled
                    pointerEvents: !canScrollUp || isAnimatingRef.current ? 'none' : 'auto', // Disable clicks when disabled
                }}
            >
                ▲
            </button>

            {/* Down Arrow Button */}
            <button
                aria-label="Scroll Down"
                onClick={() => handleArrowClick('down')}
                disabled={!canScrollDown || isAnimatingRef.current}
                style={{
                    position: 'absolute',
                    bottom: '5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 3,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: !canScrollDown || isAnimatingRef.current ? 0.3 : 1, // Dim when disabled
                    pointerEvents: !canScrollDown || isAnimatingRef.current ? 'none' : 'auto', // Disable clicks when disabled
                }}
            >
                ▼
            </button>

            {/* Indicator for selected item */}
            <div
                className="selector-highlight"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: `${itemHeight}px`,
                    top: '50%', // Center vertically
                    transform: 'translateY(-50%)', // Adjust for own height
                    borderTop: '2px solid rgba(83, 156, 252, 0.7)',
                    borderBottom: '2px solid rgba(83, 156, 252, 0.7)',
                    backgroundColor: 'rgba(83, 156, 252, 0.15)',
                    zIndex: 1,
                    pointerEvents: 'none', // Allow clicks/drags through
                }}
            />

            {/* Top fade overlay */}
            <div
                className="scroll-fade top"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: `${containerHeight * 0.3}px`, // Adjust fade height
                    top: 0,
                    background: 'linear-gradient(to bottom, rgba(30,30,30,0.9) 0%, rgba(30,30,30,0) 100%)', // Match background base color
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />

            {/* Bottom fade overlay */}
            <div
                className="scroll-fade bottom"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: `${containerHeight * 0.3}px`, // Adjust fade height
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(30,30,30,0.9) 0%, rgba(30,30,30,0) 100%)', // Match background base color
                    zIndex: 2,
                    pointerEvents: 'none',
                }}
            />

            {/* Scrollable content */}
            <div
                className="selector-items"
                style={{
                    position: 'absolute',
                    width: '100%',
                    left: 0,
                    top: 0, // Position top edge at parent top
                    transform: `translateY(${transformY})`, // Apply dynamic centering transform
                    // NO transition here - handled by animate function
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 0,
                }}
            >
                {options.map((option, index) => {
                    const isSelected = index === selectedIndex;
                    const distance = Math.abs(index - selectedIndex);
                    // Example: Reduce scale/opacity further away items
                    const scale = Math.max(0.6, 1 - distance * 0.15);
                    const opacity = Math.max(0.3, 1 - distance * 0.25);

                    return (
                        <div
                            key={`${option}-${index}`} // Use a stable key if options can change
                            className={`selector-item ${isSelected ? 'selected' : ''}`}
                            style={{
                                height: `${itemHeight}px`,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                fontSize: isSelected ? '18px' : '14px', // Adjusted font sizes
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                                opacity: isSelected ? 1 : opacity,
                                transform: `scale(${isSelected ? 1.1 : scale})`, // Scale selected slightly up
                                transition: 'transform 0.3s ease-out, font-size 0.3s ease-out, color 0.3s ease-out, opacity 0.3s ease-out', // Add transitions for visual changes
                                cursor: 'inherit', // Inherit grab/grabbing cursor
                            }}
                        >
                            {option}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScrollableSelector;

// Usage example:
// <ScrollableSelector
//   options={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']}
//   onSelect={(selected) => console.log(`Selected: ${selected}`)}
//   initialSelected={'Date'}
//   itemHeight={40}      // Optional: customize item height
//   visibleItemCount={5} // Optional: customize number of visible items (controls height)
// />