import React, { useState } from "react";
import { Delete } from "lucide-react";

export const CalculatorWidget: React.FC = () => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [shouldReset, setShouldReset] = useState(false);

  const handleNum = (num: string) => {
    if (display === "0" || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimal = () => {
    if (shouldReset) {
      setDisplay("0.");
      setShouldReset(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOp = (op: string) => {
    setEquation(display + " " + op + " ");
    setShouldReset(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setShouldReset(false);
  };

  const handleBackspace = () => {
    if (shouldReset) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleEqual = () => {
    if (!equation) return;
    
    const parts = equation.trim().split(" ");
    if (parts.length < 2) return;

    const num1 = parseFloat(parts[0]);
    const op = parts[1];
    const num2 = parseFloat(display);

    if (isNaN(num1) || isNaN(num2)) return;

    let result = 0;
    switch (op) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
      case "×":
        result = num1 * num2;
        break;
      case "÷":
        if (num2 === 0) {
          setDisplay("Error");
          setEquation("");
          setShouldReset(true);
          return;
        }
        result = num1 / num2;
        break;
      default:
        return;
    }

    // Format result to avoid floats expansion e.g., 0.1+0.2=0.3000000000004
    const rounded = Math.round(result * 100000000) / 100000000;
    
    setDisplay(String(rounded));
    setEquation("");
    setShouldReset(true);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-1 select-none">
      
      {/* Display Screen */}
      <div className="bg-black/40 border border-[var(--color-card-border)] rounded-xl p-3 mb-2 text-right flex flex-col justify-end h-18 overflow-hidden">
        {equation ? (
          <div className="text-sm font-bold text-[var(--color-text-muted)] truncate select-none font-mono">
            {equation}
          </div>
        ) : (
          <div className="text-sm text-transparent select-none font-mono">None</div>
        )}
        <div className="text-3xl font-extrabold text-[var(--color-text-main)] tabular-nums truncate font-mono">
          {display}
        </div>
      </div>

      {/* Grid Buttons */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="bg-red-600/20 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-400 font-extrabold rounded-lg flex items-center justify-center text-lg py-2.5 transition-colors accessible-focus"
          aria-label="Clear calculator"
        >
          C
        </button>
        <button
          onClick={handleBackspace}
          className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-base py-2.5 transition-colors accessible-focus"
          aria-label="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleOp("÷")}
          className="bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-400 font-extrabold rounded-lg flex items-center justify-center text-lg py-2.5 transition-colors accessible-focus"
          aria-label="Divide"
        >
          ÷
        </button>
        <button
          onClick={() => handleOp("×")}
          className="bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-400 font-extrabold rounded-lg flex items-center justify-center text-lg py-2.5 transition-colors accessible-focus"
          aria-label="Multiply"
        >
          ×
        </button>

        {/* Row 2 */}
        {[7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleNum(String(n))}
            className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-xl py-2.5 transition-colors accessible-focus"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleOp("-")}
          className="bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-400 font-extrabold rounded-lg flex items-center justify-center text-lg py-2.5 transition-colors accessible-focus"
          aria-label="Subtract"
        >
          -
        </button>

        {/* Row 3 */}
        {[4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => handleNum(String(n))}
            className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-xl py-2.5 transition-colors accessible-focus"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => handleOp("+")}
          className="bg-blue-500/10 hover:bg-blue-500 hover:text-white border border-blue-500/30 text-blue-400 font-extrabold rounded-lg flex items-center justify-center text-lg py-2.5 transition-colors accessible-focus"
          aria-label="Add"
        >
          +
        </button>

        {/* Row 4 */}
        <div className="col-span-3 grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => handleNum(String(n))}
              className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-xl py-2.5 transition-colors accessible-focus"
            >
              {n}
            </button>
          ))}
          
          <button
            onClick={() => handleNum("0")}
            className="col-span-2 bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-xl py-2.5 transition-colors accessible-focus"
          >
            0
          </button>
          
          <button
            onClick={handleDecimal}
            className="bg-[var(--color-control-bg)] hover:bg-[var(--color-control-hover)] border border-[var(--color-card-border)] text-[var(--color-text-main)] font-bold rounded-lg flex items-center justify-center text-xl py-2.5 transition-colors accessible-focus"
            aria-label="Decimal point"
          >
            .
          </button>
        </div>

        {/* Large equals button spanning 2 rows vertically */}
        <button
          onClick={handleEqual}
          className="bg-blue-600 hover:bg-blue-700 border border-transparent text-white font-black rounded-lg flex items-center justify-center text-2xl transition-colors accessible-focus"
          style={{ gridRow: "span 2" }}
          aria-label="Equals"
        >
          =
        </button>
      </div>
    </div>
  );
};
