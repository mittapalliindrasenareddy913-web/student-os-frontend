import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Calculator,
  GraduationCap,
  Calendar,
  Wrench,
  Cpu,
  ArrowRightLeft,
  Beaker,
  Flame,
  Clock,
  FileText,
  Bell,
  BookOpen,
  Trash2,
  Plus,
  Circle,
  Copy,
  History,
  X,
  ChevronRight,
  Delete,
  Info,
  CheckCircle
} from 'lucide-react';

// Custom mathematical expression evaluator for CASIO scientific calculator
const evaluateCasioExpression = (expr, lastAns = 0) => {
  // Convert standard math signs
  let formatted = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/\bAns\b/g, `(${lastAns})`);

  // Handle exponents ^
  formatted = formatted.replace(/\^/g, '**');

  // local environment math functions mapping to JavaScript Math
  const MathEnv = {
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => Math.tan(x),
    sqrt: (x) => Math.sqrt(x),
    ln: (x) => Math.log(x),
    log10: (x) => Math.log10(x),
    factorial: (n) => {
      if (n < 0) return NaN;
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    }
  };

  // Convert factorials: match numbers or parenthesis expressions followed by !
  let prevFormatted;
  do {
    prevFormatted = formatted;
    formatted = formatted.replace(/([0-9.]+|\([^)]+\))!/g, 'factorial($1)');
  } while (formatted !== prevFormatted);

  try {
    const fn = new Function(
      'sin', 'cos', 'tan', 'sqrt', 'ln', 'log10', 'factorial',
      `return (${formatted});`
    );
    const result = fn(
      MathEnv.sin, MathEnv.cos, MathEnv.tan, MathEnv.sqrt, MathEnv.ln, MathEnv.log10, MathEnv.factorial
    );
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

// 1. Standard Calculator Component
const StandardCalculator = () => {
  const [expression, setExpression] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleKeyPress = (value) => {
    if (value === '=') {
      try {
        if (!expression.trim()) return;
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        const evalResult = Function(`return ` + sanitized)();
        const resultStr = Number.isFinite(evalResult)
          ? String(parseFloat(evalResult.toFixed(8)))
          : 'Error';
        setHistoryList((prev) => [{ eq: expression, res: resultStr }, ...prev].slice(0, 10));
        setExpression(resultStr);
      } catch {
        toast.error('Invalid expression');
      }
    } else if (value === 'C') {
      setExpression('');
    } else if (value === 'DEL') {
      setExpression((prev) => prev.slice(0, -1));
    } else {
      setExpression((prev) => prev + value);
    }
  };

  const copyToClipboard = () => {
    if (expression) {
      navigator.clipboard.writeText(expression);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative text-white">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-dark-surface transition-colors"
        >
          <History size={16} />
        </button>
        <button
          onClick={copyToClipboard}
          className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-dark-surface transition-colors"
        >
          <Copy size={16} />
        </button>
      </div>

      <div className="bg-dark-bg/80 border border-dark-border rounded-2xl p-4 mb-6 min-h-[100px] flex flex-col justify-end items-end relative overflow-hidden shadow-inner">
        <p className="text-sm text-text-secondary opacity-70 mb-1 tracking-widest min-h-[20px] max-w-full truncate">
          {historyList.length > 0 && !showHistory ? historyList[0].eq + ' =' : ''}
        </p>
        <p className="text-4xl font-mono text-white tracking-tight break-all max-w-full">
          {expression || '0'}
        </p>
      </div>

      {showHistory ? (
        <div className="flex-1 flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
              Calculation History
            </h4>
            <button
              onClick={() => setHistoryList([])}
              className="text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {historyList.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-6">No history yet.</p>
            ) : (
              historyList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setExpression(item.res);
                    setShowHistory(false);
                  }}
                  className="p-3 bg-dark-surface border border-dark-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors text-right"
                >
                  <p className="text-xs text-text-secondary mb-1">{item.eq}</p>
                  <p className="text-lg font-mono text-white font-bold">{item.res}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 flex-1">
          {[
            'C', '(', ')', '÷',
            '7', '8', '9', '×',
            '4', '5', '6', '-',
            '1', '2', '3', '+',
            '0', '.', 'DEL', '='
          ].map((btn) => (
            <button
              key={btn}
              onClick={() => handleKeyPress(btn)}
              className={`rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center ${
                ['÷', '×', '-', '+'].includes(btn)
                  ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                  : btn === '='
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover'
                  : btn === 'C' || btn === 'DEL'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-dark-surface border border-dark-border text-white hover:bg-dark-surface/80 hover:border-dark-border/80'
              }`}
            >
              {btn === 'DEL' ? <Delete size={20} /> : btn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 2. CASIO Calculator Component
const CasioFormulaBook = [
  {
    category: 'Math',
    items: [
      'Quadratic: (-b ± √(b² - 4ac)) / 2a',
      'Pythagoras: a² + b² = c²',
      'Euler: e^(iπ) + 1 = 0',
    ],
  },
  {
    category: 'Physics',
    items: [
      'Newton 2nd Law: F = ma',
      'Kinematics: v = u + at',
      'Energy: E = mc²',
    ],
  },
  {
    category: 'Electronics',
    items: ["Ohm's Law: V = IR", 'Power: P = VI', 'Freq: f = 1/T'],
  },
];

const CasioCalculator = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [showFormulaBook, setShowFormulaBook] = useState(false);
  const [activeModel, setActiveModel] = useState('fx-991EX CLASSWIZ');
  const [shiftActive, setShiftActive] = useState(false);
  const [alphaActive, setAlphaActive] = useState(false);
  const [lastAns, setLastAns] = useState(0);

  useEffect(() => {
    try {
      if (!expression.trim()) {
        setResult('');
        return;
      }
      const evaluated = evaluateCasioExpression(expression, lastAns);
      if (evaluated !== null && evaluated !== undefined && !isNaN(evaluated)) {
        setResult(String(parseFloat(evaluated.toFixed(10))));
      }
    } catch {
      setResult('');
    }
  }, [expression, lastAns]);

  const appendValue = (value, label = '') => {
    setExpression((prev) => prev + value);
    if (label) setActiveModel(label);
    setShiftActive(false);
    setAlphaActive(false);
  };

  const handleEqual = () => {
    if (result) {
      setLastAns(parseFloat(result) || 0);
      setExpression(result);
      setResult('');
      setActiveModel('Ans');
    } else {
      setActiveModel('Syntax Error');
    }
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
    setActiveModel('Cleared');
    setShiftActive(false);
    setAlphaActive(false);
  };

  return (
    <div className="w-full max-w-[400px] mx-auto bg-gradient-to-b from-[#2a2d34] to-[#1c1e23] p-4 rounded-[2rem] border-[3px] border-[#444] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_1px_rgba(255,255,255,0.1)] flex flex-col font-sans select-none relative">
      <style>{`
        .casio-label {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          font-weight: bold;
          white-space: nowrap;
        }
        .casio-btn-ctrl {
          border-width: 2px;
          border-color: #1c1e23;
          transition-property: all;
          transition-duration: 150ms;
        }
        .casio-btn-ctrl:active {
          transform: translateY(2px);
          box-shadow: none;
        }
        .casio-btn-sci {
          background-color: #151515;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          font-weight: bold;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          border-radius: 0.5rem;
          border-width: 2px;
          border-color: #0a0a0a;
          box-shadow: 0 4px 0 #050505;
          transition-property: all;
          transition-duration: 150ms;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, Cambria, "Times New Roman", Times, serif;
          position: relative;
        }
        .casio-btn-sci:hover {
          background-color: #1a1a1a;
        }
        .casio-btn-sci:active {
          box-shadow: none;
          transform: translateY(4px);
        }
        .casio-btn-num {
          background-color: #e6e6e6;
          color: #222;
          font-size: 1.25rem;
          font-weight: bold;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0.5rem;
          border-width: 2px;
          border-color: #d4d4d4;
          box-shadow: 0 4px 0 #a3a3a3;
          transition-property: all;
          transition-duration: 150ms;
        }
        .casio-btn-num:hover {
          background-color: #f0f0f0;
        }
        .casio-btn-num:active {
          box-shadow: none;
          transform: translateY(4px);
        }
        .casio-btn-del, .casio-btn-ac {
          background-color: #ff6b6b;
          color: white;
          font-size: 0.875rem;
          font-weight: 900;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0.5rem;
          border-width: 2px;
          border-color: #e05252;
          box-shadow: 0 4px 0 #b82c2c;
          transition-property: all;
          transition-duration: 150ms;
        }
        .casio-btn-del:hover, .casio-btn-ac:hover {
          background-color: #ff8585;
        }
        .casio-btn-del:active, .casio-btn-ac:active {
          box-shadow: none;
          transform: translateY(4px);
        }
        .casio-btn-eq {
          background-color: #3b82f6;
          color: white;
          font-size: 1.5rem;
          font-weight: 900;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0.5rem;
          border-width: 2px;
          border-color: #2563eb;
          box-shadow: 0 4px 0 #1d4ed8;
          transition-property: all;
          transition-duration: 150ms;
        }
        .casio-btn-eq:hover {
          background-color: #60a5fa;
        }
        .casio-btn-eq:active {
          box-shadow: none;
          transform: translateY(4px);
        }
      `}</style>
      
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-black tracking-widest text-lg italic drop-shadow-md">
            CASIO
          </span>
          <span className="text-white/60 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
            fx-991EX
          </span>
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded border border-black/50 shadow-inner overflow-hidden flex items-center justify-between px-1">
            <div className="w-1.5 h-1.5 bg-[#444] rounded-full" />
            <div className="w-1.5 h-1.5 bg-[#444] rounded-full" />
            <div className="w-1.5 h-1.5 bg-[#444] rounded-full" />
            <div className="w-1.5 h-1.5 bg-[#444] rounded-full" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#b2c8b2] to-[#9cb89c] h-36 rounded-xl border-[6px] border-[#151515] p-2 flex flex-col justify-between font-mono shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden mb-6">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:3px_3px]" />
        <div className="flex justify-between items-start text-[10px] text-black/60 font-bold px-1 relative z-10">
          <div className="flex gap-2">
            {shiftActive && <span className="text-black bg-black/10 px-1">S</span>}
            {alphaActive && <span className="text-black bg-black/10 px-1">A</span>}
            <span>Math</span>
            <span>▲</span>
          </div>
          <span>DEG</span>
        </div>
        <div className="text-black/90 text-xl tracking-wider break-all leading-tight min-h-[3rem] relative z-10 px-1 mt-1">
          {expression || ''}
          <span className="animate-[pulse_1s_ease-in-out_infinite] font-black inline-block w-2 h-4 bg-black/80 ml-0.5 translate-y-0.5" />
        </div>
        <div className="text-black font-black text-3xl text-right relative z-10 break-all px-1 tracking-tighter">
          {result || '0'}
        </div>
      </div>

      <div className="flex justify-between items-center px-3 mb-4 bg-dark-bg/50 border border-dark-border rounded-lg py-1.5 shadow-inner">
        <span className="text-xs font-mono text-primary flex items-center gap-1.5">
          <Info size={12} /> {activeModel}
        </span>
        <button
          onClick={() => setShowFormulaBook(true)}
          className="text-[10px] font-bold text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 px-2 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <BookOpen size={10} /> FORMULAS
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 px-1">
        <div className="flex flex-col items-center">
          <span className="text-[#e2b714] text-[8px] font-bold mb-1">SHIFT</span>
          <button
            onClick={() => setShiftActive(!shiftActive)}
            className={`casio-btn-ctrl w-full rounded-full aspect-[2/1] ${
              shiftActive ? 'bg-[#e2b714] shadow-[#a38000]' : 'bg-[#4a4e59] shadow-[#2a2c33]'
            }`}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#ff6b6b] text-[8px] font-bold mb-1">ALPHA</span>
          <button
            onClick={() => setAlphaActive(!alphaActive)}
            className={`casio-btn-ctrl w-full rounded-full aspect-[2/1] ${
              alphaActive ? 'bg-[#ff6b6b] shadow-[#cc0000]' : 'bg-[#4a4e59] shadow-[#2a2c33]'
            }`}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/60 text-[8px] font-bold mb-1">MODE / SETUP</span>
          <button className="casio-btn-ctrl w-full rounded-full aspect-[2/1] bg-[#4a4e59] shadow-[#2a2c33]" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-white/60 text-[8px] font-bold mb-1">ON</span>
          <button
            onClick={handleClear}
            className="casio-btn-ctrl w-full rounded-full aspect-[2/1] bg-[#4a4e59] shadow-[#2a2c33]"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-x-2 gap-y-4 mb-6 px-1 relative">
        <button onClick={() => appendValue('^(', 'Power')} className="casio-btn-sci relative">
          xⁿ <span className="casio-label text-[#e2b714]">√■</span>
        </button>
        <button onClick={() => appendValue('sqrt(', 'Square Root')} className="casio-btn-sci relative">
          √ <span className="casio-label text-[#e2b714]">³√</span>
        </button>
        <button onClick={() => appendValue('^2', 'Square')} className="casio-btn-sci relative">x²</button>
        <button onClick={() => appendValue('^3', 'Cube')} className="casio-btn-sci relative">x³</button>
        <button onClick={() => appendValue('^(-1)', 'Inverse')} className="casio-btn-sci relative">x⁻¹</button>
        <button onClick={() => appendValue('log10(', 'Base 10 Log')} className="casio-btn-sci relative">
          log <span className="casio-label text-[#e2b714]">10^x</span>
        </button>
        <button onClick={() => appendValue('ln(', 'Natural Log')} className="casio-btn-sci relative">
          ln <span className="casio-label text-[#e2b714]">e^x</span>
        </button>
        <button onClick={() => appendValue('!', 'Factorial')} className="casio-btn-sci relative">x!</button>
        <button onClick={() => appendValue('(', 'Open Bracket')} className="casio-btn-sci relative">
          ( <span className="casio-label text-[#ff6b6b]">A</span>
        </button>
        <button onClick={() => appendValue(')', 'Close Bracket')} className="casio-btn-sci relative">
          ) <span className="casio-label text-[#ff6b6b]">B</span>
        </button>
        <button onClick={() => appendValue('sin(', 'Sine')} className="casio-btn-sci relative">
          sin <span className="casio-label text-[#e2b714]">sin⁻¹</span>
        </button>
        <button onClick={() => appendValue('cos(', 'Cosine')} className="casio-btn-sci relative">
          cos <span className="casio-label text-[#e2b714]">cos⁻¹</span>
        </button>
        <button onClick={() => appendValue('tan(', 'Tangent')} className="casio-btn-sci relative">
          tan <span className="casio-label text-[#e2b714]">tan⁻¹</span>
        </button>
        <button onClick={() => appendValue('π', 'Pi (3.14159)')} className="casio-btn-sci relative">
          π <span className="casio-label text-[#ff6b6b]">e</span>
        </button>
        <button onClick={() => appendValue('e', "Euler's number")} className="casio-btn-sci relative">e</button>
      </div>

      <div className="bg-[#22242a] p-3 rounded-2xl shadow-inner grid grid-cols-5 gap-3 flex-1">
        <button onClick={() => appendValue('7')} className="casio-btn-num">7</button>
        <button onClick={() => appendValue('8')} className="casio-btn-num">8</button>
        <button onClick={() => appendValue('9')} className="casio-btn-num">9</button>
        <button onClick={() => setExpression((prev) => prev.slice(0, -1))} className="casio-btn-del">DEL</button>
        <button onClick={handleClear} className="casio-btn-ac">AC</button>

        <button onClick={() => appendValue('4')} className="casio-btn-num">4</button>
        <button onClick={() => appendValue('5')} className="casio-btn-num">5</button>
        <button onClick={() => appendValue('6')} className="casio-btn-num">6</button>
        <button onClick={() => appendValue('×', 'Multiply')} className="casio-btn-num">×</button>
        <button onClick={() => appendValue('÷', 'Divide')} className="casio-btn-num">÷</button>

        <button onClick={() => appendValue('1')} className="casio-btn-num">1</button>
        <button onClick={() => appendValue('2')} className="casio-btn-num">2</button>
        <button onClick={() => appendValue('3')} className="casio-btn-num">3</button>
        <button onClick={() => appendValue('+', 'Add')} className="casio-btn-num">+</button>
        <button onClick={() => appendValue('-', 'Subtract')} className="casio-btn-num">-</button>

        <button onClick={() => appendValue('0')} className="casio-btn-num">0</button>
        <button onClick={() => appendValue('.')} className="casio-btn-num">.</button>
        <button onClick={() => appendValue('*10^(', 'Times 10 power')} className="casio-btn-num text-[10px]">x10^x</button>
        <button onClick={() => appendValue('Ans', 'Previous Answer')} className="casio-btn-num text-xs">Ans</button>
        <button onClick={handleEqual} className="casio-btn-eq">=</button>
      </div>

      {showFormulaBook && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm rounded-[2rem] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <BookOpen className="text-blue-400" /> Formula Book
            </h3>
            <button
              onClick={() => setShowFormulaBook(false)}
              className="text-white/50 hover:text-white p-1 bg-white/5 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
            {CasioFormulaBook.map((section, sectionIdx) => (
              <div key={sectionIdx} className="bg-dark-surface/50 border border-dark-border p-4 rounded-xl">
                <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">
                  {section.category}
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => {
                    const [title, formula] = item.split(': ');
                    return (
                      <div key={itemIdx} className="flex flex-col">
                        <span className="text-text-secondary text-[10px]">{title}</span>
                        <span className="text-white font-mono text-sm">{formula}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Unit Converter Component
const UnitConverter = () => {
  const unitsData = {
    Length: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      inch: 0.0254,
      ft: 0.3048,
      mi: 1609.34,
    },
    Weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
    Area: {
      "m²": 1,
      "km²": 1000000,
      "cm²": 0.0001,
      sq_ft: 0.092903,
      acre: 4046.86,
      hectare: 10000,
    },
    Volume: { L: 1, mL: 0.001, m3: 1000, gal: 3.78541 },
    Speed: { "m/s": 1, "km/h": 0.277778, mph: 0.44704 },
    Data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
  };

  const [category, setCategory] = useState('Length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [inputValue, setInputValue] = useState('1');
  const [resultValue, setResultValue] = useState('');

  useEffect(() => {
    const units = Object.keys(unitsData[category]);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  }, [category]);

  useEffect(() => {
    if (inputValue === '') {
      setResultValue('');
      return;
    }
    const parsedInput = parseFloat(inputValue);
    if (isNaN(parsedInput)) {
      setResultValue('Invalid');
      return;
    }
    const fromRatio = unitsData[category][fromUnit];
    const toRatio = unitsData[category][toUnit];
    const converted = (parsedInput * fromRatio) / toRatio;
    setResultValue(String(parseFloat(converted.toFixed(6))));
  }, [inputValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {Object.keys(unitsData).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
              category === cat ? 'bg-primary text-white' : 'bg-dark-surface text-text-secondary hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-dark-surface p-4 rounded-xl border border-dark-border flex flex-col gap-4">
        <div>
          <label className="text-xs text-text-secondary uppercase font-bold mb-2 block">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-2/3 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-1/3 bg-dark-bg border border-dark-border rounded-xl px-2 py-3 text-white outline-none"
            >
              {Object.keys(unitsData[category] || {}).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={swapUnits}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
          >
            <ArrowRightLeft size={16} className="rotate-90 md:rotate-0" />
          </button>
        </div>

        <div>
          <label className="text-xs text-text-secondary uppercase font-bold mb-2 block">To</label>
          <div className="flex gap-2">
            <div className="w-2/3 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white font-mono text-xl flex items-center overflow-x-auto">
              {resultValue}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-1/3 bg-dark-bg border border-dark-border rounded-xl px-2 py-3 text-white outline-none"
            >
              {Object.keys(unitsData[category] || {}).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Engineering Toolbox Component
const EngineeringToolbox = () => {
  const [activeTab, setActiveTab] = useState('ohm');
  const [voltage, setVoltage] = useState('');
  const [current, setCurrent] = useState('');
  const [resistance, setResistance] = useState('');
  const [decimalVal, setDecimalVal] = useState('');
  const [binaryVal, setBinaryVal] = useState('');

  const calculateOhm = () => {
    const v = parseFloat(voltage);
    const i = parseFloat(current);
    const r = parseFloat(resistance);

    if (voltage && current && !resistance) {
      setResistance((v / i).toFixed(2));
    } else if (voltage && resistance && !current) {
      setCurrent((v / r).toFixed(2));
    } else if (current && resistance && !voltage) {
      setVoltage((i * r).toFixed(2));
    }
  };

  const clearOhm = () => {
    setVoltage('');
    setCurrent('');
    setResistance('');
  };

  const handleDecimalChange = (val) => {
    setDecimalVal(val);
    if (!val) {
      setBinaryVal('');
      return;
    }
    const num = parseInt(val, 10);
    setBinaryVal(isNaN(num) ? 'Invalid' : num.toString(2));
  };

  const handleBinaryChange = (val) => {
    setBinaryVal(val);
    if (!val) {
      setDecimalVal('');
      return;
    }
    const cleaned = val.replace(/[^01]/g, '');
    const num = parseInt(cleaned, 2);
    setDecimalVal(isNaN(num) ? 'Invalid' : num.toString(10));
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex bg-dark-surface p-1 rounded-xl gap-1">
        {['ohm', 'binary', 'formulas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
              activeTab === tab ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-white'
            }`}
          >
            {tab === 'ohm' ? "Ohm's Law" : tab === 'binary' ? 'Binary' : 'Formulas'}
          </button>
        ))}
      </div>

      <div className="bg-dark-surface p-5 rounded-xl border border-dark-border">
        {activeTab === 'ohm' && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm">Ohm's Law Calculator</h4>
            <p className="text-xs text-text-secondary mb-4">Enter any 2 values to calculate the 3rd.</p>
            <div>
              <label className="text-xs font-bold text-text-secondary">Voltage (V)</label>
              <input
                type="number"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Current (I) in Amps</label>
              <input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Resistance (R) in Ohms</label>
              <input
                type="number"
                value={resistance}
                onChange={(e) => setResistance(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={calculateOhm} className="flex-1 bg-primary text-white py-2 rounded-lg font-bold">
                Calculate
              </button>
              <button onClick={clearOhm} className="px-4 bg-dark-bg border border-dark-border text-text-secondary rounded-lg font-bold">
                Clear
              </button>
            </div>
          </div>
        )}

        {activeTab === 'binary' && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm">Decimal / Binary Converter</h4>
            <div>
              <label className="text-xs font-bold text-text-secondary">Decimal (Base 10)</label>
              <input
                type="number"
                value={decimalVal}
                onChange={(e) => handleDecimalChange(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary">Binary (Base 2)</label>
              <input
                type="text"
                value={binaryVal}
                onChange={(e) => handleBinaryChange(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <h4 className="font-bold text-sm sticky top-0 bg-dark-surface py-2">Cheat Sheet</h4>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <h5 className="text-xs font-bold text-primary mb-1">Ohm's Law</h5>
              <p className="text-sm font-mono">V = I × R</p>
              <p className="text-sm font-mono">P = V × I = I² × R</p>
            </div>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <h5 className="text-xs font-bold text-primary mb-1">Voltage Divider</h5>
              <p className="text-sm font-mono text-text-secondary whitespace-pre">V_out = V_in × (R2 / (R1 + R2))</p>
            </div>
            <div className="p-3 bg-dark-bg rounded-lg border border-dark-border">
              <h5 className="text-xs font-bold text-primary mb-1">Series & Parallel Resistors</h5>
              <p className="text-xs font-mono text-text-secondary mb-1">Series: R_total = R1 + R2 + ...</p>
              <p className="text-xs font-mono text-text-secondary">Parallel: 1/R_total = 1/R1 + 1/R2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. CGPA Calculator Component
const CgpaCalculator = () => {
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Subject 1', credits: 3, grade: 'A+' },
    { id: 2, name: 'Subject 2', credits: 4, grade: 'O' },
  ]);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        id: Date.now(),
        name: `Subject ${subjects.length + 1}`,
        credits: 3,
        grade: 'A',
      },
    ]);
  };

  const removeSubject = (id) => {
    setSubjects(subjects.filter((sub) => sub.id !== id));
  };

  const updateSubject = (id, key, value) => {
    setSubjects(
      subjects.map((sub) => (sub.id === id ? { ...sub, [key]: value } : sub))
    );
  };

  const gradeValues = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, F: 0 };

  let totalCredits = 0;
  let totalGradePoints = 0;
  subjects.forEach((sub) => {
    const credits = parseFloat(sub.credits) || 0;
    const gradePoint = gradeValues[sub.grade] || 0;
    totalCredits += credits;
    totalGradePoints += credits * gradePoint;
  });

  const semesterGpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white flex items-center justify-between shadow-lg">
        <div>
          <h3 className="text-sm font-bold opacity-90 uppercase tracking-widest">Semester GPA</h3>
          <p className="text-4xl font-black mt-1">{semesterGpa}</p>
        </div>
        <GraduationCap size={48} className="opacity-20" />
      </div>

      <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 bg-dark-bg/50 border-b border-dark-border text-xs font-bold text-text-secondary">
          <div className="col-span-5">Subject</div>
          <div className="col-span-3 text-center">Credits</div>
          <div className="col-span-3 text-center">Grade</div>
          <div className="col-span-1"></div>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-2">
          {subjects.map((sub) => (
            <div key={sub.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={sub.name}
                onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                className="col-span-5 bg-dark-bg border border-dark-border rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-primary"
              />
              <input
                type="number"
                value={sub.credits}
                onChange={(e) => updateSubject(sub.id, 'credits', e.target.value)}
                className="col-span-3 bg-dark-bg border border-dark-border rounded-lg px-2 py-2 text-sm text-center text-white outline-none focus:border-primary"
              />
              <select
                value={sub.grade}
                onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                className="col-span-3 bg-dark-bg border border-dark-border rounded-lg px-2 py-2 text-sm text-center text-white outline-none focus:border-primary"
              >
                {Object.keys(gradeValues).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeSubject(sub.id)}
                className="col-span-1 flex justify-center text-text-secondary hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 bg-dark-bg/50 border-t border-dark-border">
          <button
            onClick={addSubject}
            className="w-full py-2 border border-dashed border-primary text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors"
          >
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. Backlog Tracker Component
const BacklogTracker = () => {
  const [backlogs, setBacklogs] = useState([
    {
      id: 1,
      subject: 'Engineering Mathematics II',
      sem: 'Sem 2',
      cleared: false,
    },
    { id: 2, subject: 'Data Structures', sem: 'Sem 3', cleared: true },
  ]);
  const [newSubject, setNewSubject] = useState('');

  const addBacklog = () => {
    if (newSubject.trim()) {
      setBacklogs([
        {
          id: Date.now(),
          subject: newSubject,
          sem: `Sem ` + Math.floor(Math.random() * 8 + 1),
          cleared: false,
        },
        ...backlogs,
      ]);
      setNewSubject('');
    }
  };

  const toggleCleared = (id) => {
    setBacklogs(
      backlogs.map((item) =>
        item.id === id ? { ...item, cleared: !item.cleared } : item
      )
    );
  };

  const deleteBacklog = (id) => {
    setBacklogs(backlogs.filter((item) => item.id !== id));
  };

  const totalBacklogs = backlogs.length;
  const clearedCount = backlogs.filter((item) => item.cleared).length;
  const pendingCount = totalBacklogs - clearedCount;
  const progressPercent = totalBacklogs === 0 ? 100 : Math.round((clearedCount / totalBacklogs) * 100);

  return (
    <div className="flex flex-col space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
          <p className="text-3xl font-black text-red-400">{pendingCount}</p>
          <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-widest mt-1">Pending</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
          <p className="text-3xl font-black text-emerald-400">{clearedCount}</p>
          <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mt-1">Cleared</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold mb-2">
          <span>Clearance Progress</span>
          <span className={progressPercent === 100 ? 'text-success' : 'text-primary'}>
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Subject name..."
          onKeyDown={(e) => e.key === 'Enter' && addBacklog()}
          className="flex-1 bg-dark-surface border border-dark-border rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary"
        />
        <button
          onClick={addBacklog}
          className="bg-primary text-white p-2 rounded-xl hover:bg-primary-hover"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2">
        {backlogs.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-4">No backlogs! Great job! 🎉</p>
        ) : (
          backlogs.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                item.cleared ? 'bg-success/5 border-success/20' : 'bg-dark-surface border-dark-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleCleared(item.id)}
                  className={item.cleared ? 'text-success' : 'text-text-secondary hover:text-white'}
                >
                  {item.cleared ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                <div>
                  <p className={`text-sm font-bold ${item.cleared ? 'line-through text-text-secondary' : 'text-white'}`}>
                    {item.subject}
                  </p>
                  <p className="text-[10px] text-text-secondary">{item.sem}</p>
                </div>
              </div>
              <button
                onClick={() => deleteBacklog(item.id)}
                className="text-text-secondary hover:text-red-400 p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 7. Semester Progress Component
const SemesterProgress = () => {
  const [totalCredits, setTotalCredits] = useState(160);
  const [completedCredits, setCompletedCredits] = useState(45);

  const total = parseFloat(totalCredits) || 1;
  const completed = parseFloat(completedCredits) || 0;
  const progressPercent = Math.min(Math.round((completed / total) * 100), 100);

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-48 h-48 flex items-center justify-center mt-4">
        <svg width="100%" height="100%" className="transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={60}
            fill="none"
            stroke="var(--color-dark-border)"
            strokeWidth="12"
          />
          <circle
            cx="96"
            cy="96"
            r={60}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {progressPercent}%
          </span>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">
            Degree Done
          </span>
        </div>
      </div>

      <div className="w-full space-y-4 bg-dark-surface p-5 rounded-xl border border-dark-border">
        <div>
          <label className="text-xs font-bold text-text-secondary">Total Degree Credits Required</label>
          <input
            type="number"
            value={totalCredits}
            onChange={(e) => setTotalCredits(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary">Credits Completed So Far</label>
          <input
            type="number"
            value={completedCredits}
            onChange={(e) => setCompletedCredits(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 mt-1 text-white font-mono"
          />
        </div>
        <div className="pt-2">
          <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
            <span>{completed} Credits</span>
            <span>{total} Credits</span>
          </div>
          <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// 8. Exam Planner Component
const ExamPlanner = () => {
  const [exams, setExams] = useState([
    {
      id: 1,
      subject: 'Mid-Sem Data Structures',
      date: new Date(Date.now() + 14400 * 60 * 1000).toISOString().split('T')[0],
    },
  ]);
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState('');

  const addExam = () => {
    if (!subjectName || !examDate) return;
    const newExam = {
      id: Date.now(),
      subject: subjectName,
      date: examDate,
    };
    setExams([...exams, newExam].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setSubjectName('');
    setExamDate('');
  };

  const removeExam = (id) => {
    setExams(exams.filter((ex) => ex.id !== id));
  };

  const getDaysRemaining = (dateStr) => {
    const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col space-y-5">
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Add Exam
        </h4>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="Subject / Exam Name"
          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          />
          <button
            onClick={addExam}
            className="bg-primary text-white px-4 rounded-lg hover:bg-primary-hover font-bold text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {exams.length === 0 ? (
          <p className="text-xs text-text-secondary text-center py-4">No upcoming exams scheduled!</p>
        ) : (
          exams.map((ex) => {
            const daysRemaining = getDaysRemaining(ex.date);
            const isCritical = daysRemaining >= 0 && daysRemaining <= 3;
            const isPast = daysRemaining < 0;

            return (
              <div
                key={ex.id}
                className={`relative p-4 rounded-xl border overflow-hidden ${
                  isPast
                    ? 'bg-dark-surface/50 border-dark-border opacity-50'
                    : isCritical
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-dark-surface border-dark-border'
                }`}
              >
                {isCritical && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className={`font-bold ${isPast ? 'line-through text-text-secondary' : 'text-white'}`}>
                      {ex.subject}
                    </h5>
                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                      <Calendar size={12} />{' '}
                      {new Date(ex.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeExam(ex.id)} className="text-text-secondary hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                    {!isPast && (
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-md ${
                          isCritical ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {daysRemaining === 0 ? 'TODAY' : `${daysRemaining} DAYS`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Categories configuration
const categories = [
  { id: 'all', label: 'All Tools', icon: <Compass size={14} /> },
  { id: 'math', label: 'Math & Engineering', icon: <Calculator size={14} /> },
  { id: 'academic', label: 'Academic Tracking', icon: <GraduationCap size={14} /> },
  { id: 'planners', label: 'Planners', icon: <Calendar size={14} /> },
  { id: 'utilities', label: 'Utilities', icon: <Wrench size={14} /> },
];

// Tools configuration
const toolsList = [
  {
    id: 'calc',
    name: 'Standard Calculator',
    category: 'math',
    icon: Calculator,
    desc: 'Basic arithmetic with history log.',
    color: 'from-blue-500 to-cyan-500',
    action: 'modal',
    component: StandardCalculator,
  },
  {
    id: 'casio',
    name: 'CASIO Calculator',
    category: 'math',
    icon: Cpu,
    desc: 'Trig, logs, matrices, and complex numbers.',
    color: 'from-purple-500 to-pink-500',
    action: 'modal',
    component: CasioCalculator,
    isPro: true,
  },
  {
    id: 'unit',
    name: 'Unit Converter',
    category: 'math',
    icon: ArrowRightLeft,
    desc: 'Length, weight, temp, area, volume.',
    color: 'from-emerald-500 to-teal-500',
    action: 'modal',
    component: UnitConverter,
  },
  {
    id: 'engineering',
    name: 'Engineering Toolbox',
    category: 'math',
    icon: Beaker,
    desc: "Ohm's law, logic gates, and formulas.",
    color: 'from-orange-500 to-red-500',
    action: 'modal',
    component: EngineeringToolbox,
  },
  {
    id: 'cgpa',
    name: 'CGPA Calculator',
    category: 'academic',
    icon: GraduationCap,
    desc: 'Predict and calculate Semester/Overall GPA.',
    color: 'from-indigo-500 to-blue-600',
    action: 'modal',
    component: CgpaCalculator,
  },
  {
    id: 'backlog',
    name: 'Backlog Tracker',
    category: 'academic',
    icon: BookOpen,
    desc: 'Manage pending subjects and clearance.',
    color: 'from-slate-600 to-slate-800',
    action: 'modal',
    component: BacklogTracker,
  },
  {
    id: 'semester',
    name: 'Semester Progress',
    category: 'academic',
    icon: Flame,
    desc: 'Visualize degree completion.',
    color: 'from-amber-500 to-orange-600',
    action: 'modal',
    component: SemesterProgress,
  },
  {
    id: 'exam',
    name: 'Exam Planner',
    category: 'planners',
    icon: Calendar,
    desc: 'Countdowns and revision tracking.',
    color: 'from-violet-500 to-fuchsia-500',
    action: 'modal',
    component: ExamPlanner,
  },
  {
    id: 'attendance',
    name: 'Attendance Tools',
    category: 'academic',
    icon: Clock,
    desc: 'Current %, required classes, safe leaves.',
    color: 'from-rose-500 to-pink-600',
    action: 'navigate',
    path: '/attendance',
  },
  {
    id: 'timetable',
    name: 'Timetable Gen',
    category: 'planners',
    icon: Clock,
    desc: 'Auto-generate optimal study schedules.',
    color: 'from-sky-400 to-blue-500',
    action: 'navigate',
    path: '/timetable',
  },
  {
    id: 'notes',
    name: 'Notes Vault',
    category: 'utilities',
    icon: FileText,
    desc: 'Offline storage for critical materials.',
    color: 'from-green-500 to-emerald-600',
    action: 'navigate',
    path: '/notes',
  },
  {
    id: 'reminders',
    name: 'Academic Alerts',
    category: 'utilities',
    icon: Bell,
    desc: 'Assignment deadlines & study goals.',
    color: 'from-yellow-400 to-amber-500',
    action: 'navigate',
    path: '/tasks',
  },
  {
    id: 'papers',
    name: 'Previous Papers',
    category: 'utilities',
    icon: BookOpen,
    desc: 'Library of past examination papers.',
    color: 'from-cyan-500 to-blue-600',
    action: 'navigate',
    path: '/study-materials',
  },
];

// Main ToolsHub Component
export default function ToolsHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedToolId, setSelectedToolId] = useState(null);

  const handleToolClick = (tool) => {
    if (tool.id !== 'calc' && tool.id !== 'casio' && tool.id !== 'unit' && tool.id !== 'engineering') {
      if (!user?.isCollegeConnected) {
        toast.error(`"${tool.name}" is locked. This feature is available only when your college is integrated with Campus OS. Please contact your college administration.`, {
          duration: 5000
        });
        return;
      }
    }
    if (tool.action === 'navigate') {
      navigate(tool.path);
    } else {
      setSelectedToolId(tool.id);
    }
  };

  const filteredTools = activeCategory === 'all'
    ? toolsList
    : toolsList.filter((tool) => tool.category === activeCategory);

  const ActiveComponent = selectedToolId
    ? toolsList.find((tool) => tool.id === selectedToolId)?.component
    : null;

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Academic Tools Hub
          </h1>
          <p className="text-text-secondary text-sm mt-1 max-w-xl">
            A comprehensive suite of utilities for engineering students, planners, and academic trackers.
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              activeCategory === cat.id
                ? 'bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/10'
                : 'bg-dark-surface/50 border-dark-border text-text-secondary hover:text-white hover:bg-dark-surface'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className="glass-card p-5 group cursor-pointer hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden flex flex-col h-full"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-start gap-4 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} p-[1px] shadow-lg shrink-0`}>
                  <div className="w-full h-full bg-dark-bg rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <ToolIcon size={22} className="text-white drop-shadow-md" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors flex items-center gap-2">
                    {tool.name}
                    {tool.isPro && (
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider border border-primary/30">
                        PRO
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">
                    {tool.desc}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-dark-border/40">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  {categories.find((c) => c.id === tool.category)?.label}
                </span>
                <ChevronRight size={14} className="text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      {selectedToolId && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            selectedToolId === 'casio' ? 'bg-[#0B0F17]' : 'bg-black/80 backdrop-blur-sm'
          }`}
          onClick={() => setSelectedToolId(null)}
        >
          {selectedToolId === 'casio' ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <button
                onClick={() => setSelectedToolId(null)}
                className="absolute -top-12 right-0 md:-right-12 md:top-0 text-text-secondary hover:text-white bg-[#10131A] border border-[#2d313a] p-3 rounded-full shadow-lg z-50"
                title="Close Calculator"
              >
                <X size={20} />
              </button>
              <div className="shadow-[0_40px_80px_rgba(0,0,0,0.9)] rounded-[2rem]">
                {ActiveComponent && <ActiveComponent />}
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-surface border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-w-md min-h-[400px]"
            >
              <div className="flex justify-between items-center p-4 border-b border-dark-border/50 bg-dark-bg/50">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Wrench size={14} className="text-primary" />
                  {toolsList.find((tool) => tool.id === selectedToolId)?.name}
                </h3>
                <button
                  onClick={() => setSelectedToolId(null)}
                  className="text-text-secondary hover:text-white p-1 rounded bg-dark-bg transition-colors border border-transparent hover:border-dark-border"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col overflow-hidden bg-dark-bg/20">
                {ActiveComponent ? <ActiveComponent /> : <p className="text-white text-center">Tool Loading...</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
