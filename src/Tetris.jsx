import React, { useState, useEffect, useCallback } from "react";

const ROWS = 20;
const COLS = 10;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  L: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  J: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const COLORS = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  L: "orange",
  J: "blue",
  S: "green",
  Z: "red",
};

function randomShape() {
  const keys = Object.keys(SHAPES);
  const rand = keys[Math.floor(Math.random() * keys.length)];
  return { shape: SHAPES[rand], color: COLORS[rand] };
}

const Tetris = () => {
  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [piece, setPiece] = useState(randomShape());
  const [pos, setPos] = useState({ row: 0, col: 3 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [blockSize, setBlockSize] = useState(
    Math.min(window.innerWidth / 15, 25) // responsive block size
  );

  // update block size on resize (for mobile rotation, etc.)
  useEffect(() => {
    const handleResize = () => {
      setBlockSize(Math.min(window.innerWidth / 15, 25));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mergePiece = useCallback(
    (gridCopy, piece, row, col) => {
      piece.shape.forEach((r, i) =>
        r.forEach((val, j) => {
          if (val && row + i >= 0) {
            gridCopy[row + i][col + j] = piece.color;
          }
        })
      );
      return gridCopy;
    },
    []
  );

  const isValidMove = useCallback(
    (piece, row, col) => {
      return piece.shape.every((r, i) =>
        r.every((val, j) => {
          if (!val) return true;
          const newRow = row + i;
          const newCol = col + j;
          return (
            newRow >= 0 &&
            newRow < ROWS &&
            newCol >= 0 &&
            newCol < COLS &&
            !grid[newRow][newCol]
          );
        })
      );
    },
    [grid]
  );

  const placePiece = useCallback(() => {
    const newGrid = mergePiece(grid.map((r) => [...r]), piece, pos.row, pos.col);

    // clear full rows
    let cleared = 0;
    const clearedGrid = newGrid.filter((row) => {
      if (row.every((cell) => cell !== null)) {
        cleared++;
        return false;
      }
      return true;
    });

    while (clearedGrid.length < ROWS) {
      clearedGrid.unshift(Array(COLS).fill(null));
    }

    setScore((s) => s + cleared * 100);
    setGrid(clearedGrid);

    // new piece
    const nextPiece = randomShape();
    setPiece(nextPiece);
    setPos({ row: 0, col: 3 });

    if (!isValidMove(nextPiece, 0, 3)) {
      setGameOver(true);
    }
  }, [grid, piece, pos, mergePiece, isValidMove]);

  // game loop
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      if (isValidMove(piece, pos.row + 1, pos.col)) {
        setPos((p) => ({ ...p, row: p.row + 1 }));
      } else {
        placePiece();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [piece, pos, gameOver, isValidMove, placePiece]);

  // controls (keyboard)
  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft" && isValidMove(piece, pos.row, pos.col - 1)) {
        setPos((p) => ({ ...p, col: p.col - 1 }));
      }
      if (e.key === "ArrowRight" && isValidMove(piece, pos.row, pos.col + 1)) {
        setPos((p) => ({ ...p, col: p.col + 1 }));
      }
      if (e.key === "ArrowDown" && isValidMove(piece, pos.row + 1, pos.col)) {
        setPos((p) => ({ ...p, row: p.row + 1 }));
      }
      if (e.key === "ArrowUp") {
        rotatePiece();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [piece, pos, gameOver, isValidMove]);

  // move functions for mobile buttons
  const moveLeft = () => {
    if (!gameOver && isValidMove(piece, pos.row, pos.col - 1)) {
      setPos((p) => ({ ...p, col: p.col - 1 }));
    }
  };

  const moveRight = () => {
    if (!gameOver && isValidMove(piece, pos.row, pos.col + 1)) {
      setPos((p) => ({ ...p, col: p.col + 1 }));
    }
  };

  const moveDown = () => {
    if (!gameOver && isValidMove(piece, pos.row + 1, pos.col)) {
      setPos((p) => ({ ...p, row: p.row + 1 }));
    }
  };

  const rotatePiece = () => {
    if (gameOver) return;
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map((row) => row[i]).reverse()
    );
    if (isValidMove({ ...piece, shape: rotated }, pos.row, pos.col)) {
      setPiece((p) => ({ ...p, shape: rotated }));
    }
  };

  // Restart Game
  const restartGame = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setPiece(randomShape());
    setPos({ row: 0, col: 3 });
    setScore(0);
    setGameOver(false);
  };

  // draw grid with active piece
  const displayGrid = grid.map((row) => [...row]);
  mergePiece(displayGrid, piece, pos.row, pos.col);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>RIALO TETRIS</h1>
      <h2>Score: {score}</h2>
      {gameOver && <h2 style={{ color: "red" }}>Game Over!</h2>}

      <button
        onClick={restartGame}
        style={{
          padding: "10px 20px",
          margin: "10px",
          fontSize: "16px",
          cursor: "pointer",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Restart
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${ROWS}, ${blockSize}px)`,
          gridTemplateColumns: `repeat(${COLS}, ${blockSize}px)`,
          margin: "auto",
          width: COLS * blockSize,
          border: "2px solid black",
          backgroundColor: "#111",
          backgroundImage: "url('/mylogo.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 30%",
          backgroundSize: "190px",
        }}
      >
        {displayGrid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              style={{
                width: blockSize,
                height: blockSize,
                border: "1px solid #333",
                background: cell || "transparent",
              }}
            />
          ))
        )}
      </div>

      {/* ✅ Mobile Controls */}
      <div
        style={{
          display: "none",
          marginTop: "15px",
        }}
        className="mobile-controls"
      >
        <button onClick={moveLeft}>⬅️</button>
        <button onClick={rotatePiece}>🔄</button>
        <button onClick={moveRight}>➡️</button>
        <button onClick={moveDown}>⬇️</button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-controls {
            display: flex !important;
            justify-content: center;
            gap: 10px;
          }
          .mobile-controls button {
            font-size: 24px;
            padding: 15px 20px;
            border: none;
            border-radius: 8px;
            background-color: #333;
            color: white;
            cursor: pointer;
          }
          .mobile-controls button:active {
            background-color: #555;
          }
        }
      `}</style>
    </div>
  );
};

export default Tetris;
