import React, {useState, useEffect, useCallback, useRef} from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import PuzzleTray from "./PuzzleTray.tsx";

// Constants
const ITEM_TYPE = 'PUZZLE_PIECE';

// Types
interface PuzzlePiece {
    id: number;
    row: number;
    col: number;
    correctPosition: { row: number; col: number };
    placed: boolean;
}

interface JigsawPuzzleProps {
    imagePath: string;
    hintWord: string;
    rows?: number;
    cols?: number;
    onComplete?: () => void;
}

interface PieceProps {
    piece: PuzzlePiece;
    imagePath: string;
    pieceWidth: number;
    pieceHeight: number;
    imageWidth: number;
    imageHeight: number;
    onDropPiece: (piece: PuzzlePiece, row: number, col: number) => void;
}

// Utility to determine if we should use touch backend
const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0));
};

const getBackend = () => {
    return isTouchDevice() ? TouchBackend : HTML5Backend;
};

// Puzzle Piece Component
const PuzzlePiece: React.FC<PieceProps> = ({
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
    drag(elementRef)

    return (
        <div
            ref={elementRef}
            className={`puzzle-piece ${piece.placed ? 'placed' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                width: `${pieceWidth}px`,
                height: `${pieceHeight}px`,
                backgroundImage: `url(${imagePath})`,
                backgroundSize: `${imageWidth}px ${imageHeight}px`,
                backgroundPosition: `-${piece.correctPosition.col * pieceWidth}px -${piece.correctPosition.row * pieceHeight}px`,
                opacity: isDragging ? 0.5 : 1,
                cursor: piece.placed ? 'default' : 'grab',
            }}
        />
    );
};

// Drop Target Component
const PuzzleDropSlot: React.FC<{
    row: number;
    col: number;
    pieceWidth: number;
    pieceHeight: number;
    onDropPiece: (piece: PuzzlePiece, row: number, col: number) => void;
    children?: React.ReactNode;
}> = ({ row, col, pieceWidth, pieceHeight, onDropPiece, children }) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ITEM_TYPE,
        drop: (item: PuzzlePiece) => {
            onDropPiece(item, row, col);
            return { dropped: true };
        },
        canDrop: (item: PuzzlePiece) => {
            return item.correctPosition.row === row && item.correctPosition.col === col;
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));
drop(elementRef)
    return (
        <div
            ref={elementRef}
            className={`puzzle-slot ${isOver ? 'hover' : ''} ${isOver && canDrop ? 'correct' : ''}`}
            style={{
                width: `${pieceWidth}px`,
                height: `${pieceHeight}px`,
                position: 'absolute',
                left: `${col * pieceWidth}px`,
                top: `${row * pieceHeight}px`,
                border: '1px dashed rgba(0, 0, 0, 0.2)',
                backgroundColor: isOver && canDrop ? 'rgba(0, 255, 0, 0.2)' :
                    isOver && !canDrop ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
                zIndex: 0,
            }}
        >
            {children}
        </div>
    );
};

// Main Jigsaw Puzzle Component
const JigsawPuzzle: React.FC<JigsawPuzzleProps> = ({
                                                       imagePath,
                                                       rows = 3,
                                                       cols = 3,
                                                       onComplete,
                                                       hintWord
                                                   }) => {
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    // Initialize the puzzle pieces
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
            initializePuzzle();
            setIsLoading(false);
        };
        img.src = imagePath;
    }, [imagePath, rows, cols]);

    // Initialize puzzle pieces
    const initializePuzzle = () => {
        const newPieces: PuzzlePiece[] = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                newPieces.push({
                    id: row * cols + col,
                    row: -1, // Initial position in the tray (will be set during shuffle)
                    col: -1,
                    correctPosition: { row, col },
                    placed: false,
                });
            }
        }

        // Shuffle pieces for the tray
        const shuffledPieces = [...newPieces].sort(() => Math.random() - 0.5);

        setPieces(shuffledPieces);
    };

    // Handle dropping a piece
    const handleDropPiece = useCallback((piece: PuzzlePiece) => {
        setPieces(prevPieces =>
            prevPieces.map(p =>
                p.id === piece.id ? { ...p, placed: true } : p
            )
        );
    }, []);

    // Check if puzzle is complete
    useEffect(() => {
        if (pieces.length > 0 && pieces.every(piece => piece.placed)) {
            setIsComplete(true);

        }
    }, [pieces, onComplete]);

    // Reset puzzle
    const resetPuzzle = () => {
        setIsComplete(false);
        initializePuzzle();
        onComplete && onComplete()

    };

    // Inside JigsawPuzzle component, before rendering:
    const pieceWidth = Math.floor(imageSize.width / cols);
    const pieceHeight = Math.floor(imageSize.height / rows);

    // Render drop slots and placed pieces
    const renderPuzzleBoard = () => {
        const slots = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const placedPiece = pieces.find(
                    p => p.correctPosition.row === row &&
                        p.correctPosition.col === col &&
                        p.placed
                );

                slots.push(
                    <PuzzleDropSlot
                        key={`slot-${row}-${col}`}
                        row={row}
                        col={col}
                        pieceWidth={pieceWidth}
                        pieceHeight={pieceHeight}
                        onDropPiece={handleDropPiece}
                    >
                        {placedPiece && (
                            <PuzzlePiece
                                piece={placedPiece}
                                imagePath={imagePath}
                                pieceWidth={pieceWidth}
                                pieceHeight={pieceHeight}
                                imageWidth={imageSize.width}
                                imageHeight={imageSize.height}
                                onDropPiece={handleDropPiece}
                            />
                        )}
                    </PuzzleDropSlot>
                );
            }
        }

        return slots;
    };

    if (isLoading) {
        return <div className="loading">Loading puzzle...</div>;
    }

    return (
        <DndProvider backend={getBackend()}>
            <div className="jigsaw-puzzle-game">
                {!isComplete && <><PuzzleTray
                    pieces={pieces}
                    imagePath={imagePath}
                    pieceWidth={pieceWidth}
                    pieceHeight={pieceHeight}
                    imageWidth={imageSize.width}
                    imageHeight={imageSize.height}
                    onDropPiece={handleDropPiece}
                />

                <div
                    className="puzzle-container"
                    style={{
                        width: `${imageSize.width}px`,
                        height: `${imageSize.height}px`,
                        position: 'relative',
                        border: '2px solid #333',
                        margin: '20px auto',
                        backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px'
                    }}
                >
                    {renderPuzzleBoard()}
                </div></>
                }
                <div className="puzzle-controls" style={{ marginTop: '20px', textAlign: 'center' }}>
                    {isComplete && (
                        <div className="completion-message">
                            <h3>Congratulations! Puzzle completed!</h3>
                            <h2>Your Hint Word is </h2><h1>{hintWord}</h1>
                            <button onClick={resetPuzzle}>Next</button>
                        </div>
                    )}
                </div>
            </div>
        </DndProvider>
    );
};

// CSS styles to add to your stylesheet
/*

*/

export default JigsawPuzzle;