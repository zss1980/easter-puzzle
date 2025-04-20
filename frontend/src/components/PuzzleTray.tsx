import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useDrag } from 'react-dnd';
import './PuzzleTray.css'; // Make sure this CSS file exists and is imported

// Constants
const ITEM_TYPE = 'PUZZLE_PIECE';

// Types
export interface PuzzlePieceData {
    id: number;
    row: number;
    col: number;
    correctPosition: { row: number; col: number };
    placed: boolean;
}

export interface PuzzleTrayProps {
    pieces: PuzzlePieceData[];
    imagePath: string;
    pieceWidth: number;
    pieceHeight: number;
    imageWidth: number;
    imageHeight: number;
    onDropPiece: (piece: PuzzlePieceData, row: number, col: number) => void; // Kept for parent component usage
}

// --- Individual Puzzle Piece Component ---
interface InternalPuzzlePieceProps {
    piece: PuzzlePieceData;
    imagePath: string;
    pieceWidth: number;
    pieceHeight: number;
    imageWidth: number;
    imageHeight: number;
}

const PuzzlePiece: React.FC<InternalPuzzlePieceProps> = ({
                                                             piece,
                                                             imagePath,
                                                             pieceWidth,
                                                             pieceHeight,
                                                             imageWidth,
                                                             imageHeight,
                                                         }) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ITEM_TYPE,
        item: piece,
        canDrag: !piece.placed,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    // Dynamic styles that depend on props or state
    const pieceStyle: React.CSSProperties = {
        width: `${pieceWidth}px`,
        height: `${pieceHeight}px`,
        backgroundImage: `url(${imagePath})`,
        backgroundSize: `${imageWidth}px ${imageHeight}px`,
        backgroundPosition: `-${piece.correctPosition.col * pieceWidth}px -${piece.correctPosition.row * pieceHeight}px`,
        opacity: isDragging ? 0.4 : 1,
        cursor: piece.placed ? 'default' : 'grab',
    };
drag(elementRef)
    return (
        <div
            ref={elementRef}
            className={`puzzle-piece ${piece.placed ? 'placed' : ''} ${isDragging ? 'dragging' : ''}`}
            style={pieceStyle}
            title={`Piece ${piece.id + 1}`}
        />
    );
};


// --- Main PuzzleTray Component ---
const PuzzleTray: React.FC<PuzzleTrayProps> = ({
                                                   pieces,
                                                   imagePath,
                                                   pieceWidth,
                                                   pieceHeight,
                                                   imageWidth,
                                                   imageHeight,
                                               }) => {
    const trayRef = useRef<HTMLDivElement>(null);
    const [showScrollButtons, setShowScrollButtons] = useState(false);
    const unplacedPieces = pieces.filter(piece => !piece.placed);

    // Function to check and update scroll button visibility
    const updateScrollButtonVisibility = () => {
        if (trayRef.current) {
            const { scrollWidth, clientWidth } = trayRef.current;
            // Add a small buffer (e.g., 1px) to prevent flicker on exact match
            setShowScrollButtons(scrollWidth > clientWidth + 1);
        } else {
            setShowScrollButtons(false);
        }
    };

    // Check initially and when dependencies change
    useLayoutEffect(() => {
        updateScrollButtonVisibility();
    }, [unplacedPieces.length, pieceWidth, pieceHeight]); // Added pieceHeight dependency

    // Add resize listener
    useEffect(() => {
        // Debounced resize handler
        let timeoutId: number | null = null;
        const handleResize = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                updateScrollButtonVisibility();
                timeoutId = null;
            }, 150); // Debounce resize check
        };

        window.addEventListener('resize', handleResize);
        // Call once initially in case the layout takes time
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    // Scroll functions
    const scrollTray = (direction: 'left' | 'right') => {
        if (trayRef.current) {
            // Scroll by slightly less than 3 pieces for better control near ends
            const scrollAmount = (pieceWidth + 10) * 2.8;
            const currentScroll = trayRef.current.scrollLeft;
            const targetScroll = direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

            trayRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    // Handle mouse wheel scrolling horizontally
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (trayRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            trayRef.current.scrollLeft += e.deltaY;
        }
    };

    return (
        <div className="puzzle-tray-container">
            {showScrollButtons && (
                <button
                    className="tray-scroll-button left"
                    onClick={() => scrollTray('left')}
                    aria-label="Scroll tray left"
                    type="button"
                >
                    {'\u003C'} {/* Unicode for < */}
                </button>
            )}

            <div
                ref={trayRef}
                className="puzzle-tray"
                onWheel={handleWheel}
                style={{
                    minHeight: `${pieceHeight + 30}px`, // pieceHeight + vertical padding (15px * 2)
                }}
            >
                {unplacedPieces.length === 0 ? (
                    <div className="empty-tray-message">
                        All pieces placed! 🎉
                    </div>
                ) : (
                    unplacedPieces.map((piece) => (
                        <div key={piece.id} className="tray-slot">
                            <PuzzlePiece
                                piece={piece}
                                imagePath={imagePath}
                                pieceWidth={pieceWidth}
                                pieceHeight={pieceHeight}
                                imageWidth={imageWidth}
                                imageHeight={imageHeight}
                            />
                        </div>
                    ))
                )}
            </div>

            {showScrollButtons && (
                <button
                    className="tray-scroll-button right"
                    onClick={() => scrollTray('right')}
                    aria-label="Scroll tray right"
                    type="button"
                >
                    {'\u003E'} {/* Unicode for > */}
                </button>
            )}
        </div>
    );
};

export default PuzzleTray;