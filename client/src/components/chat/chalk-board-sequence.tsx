"use client";

export type BoardStep =
  | { type: "title"; content: string; delay?: number }
  | { type: "formula"; latex: string; delay?: number; highlight?: boolean }
  | {
      type: "geometry";
      figure: "right_triangle";
      labels?: Record<string, string>;
      delay?: number;
    };

export interface BoardSequence {
  type: "board_sequence";
  voiceOver?: string;
  steps: BoardStep[];
}

interface ChalkBoardSequenceProps {
  sequence: BoardSequence;
}

function FormulaLine({ latex, highlight }: { latex: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "chalk-formula chalk-highlight" : "chalk-formula"}>
      {latex}
    </div>
  );
}

function RightTriangle({ labels }: { labels?: Record<string, string> }) {
  return (
    <svg viewBox="0 0 260 180" className="chalk-geometry" role="img" aria-label="Triangle rectangle anime">
      <line x1="40" y1="140" x2="200" y2="140" className="chalk-draw chalk-draw-1" />
      <line x1="40" y1="140" x2="40" y2="40" className="chalk-draw chalk-draw-2" />
      <line x1="40" y1="40" x2="200" y2="140" className="chalk-draw chalk-draw-3" />

      <text x="28" y="34" className="chalk-label">A</text>
      <text x="205" y="152" className="chalk-label">C</text>
      <text x="28" y="154" className="chalk-label">B</text>

      {labels?.AB && <text x="90" y="156" className="chalk-label chalk-value">AB = {labels.AB}</text>}
      {labels?.BC && <text x="6" y="95" className="chalk-label chalk-value">BC = {labels.BC}</text>}
      {labels?.AC && <text x="128" y="82" className="chalk-label chalk-value">AC = {labels.AC}</text>}
    </svg>
  );
}

export function ChalkBoardSequence({ sequence }: ChalkBoardSequenceProps) {
  return (
    <div className="chalkboard-root">
      {sequence.voiceOver ? <p className="mb-3 text-sm text-[#efe8cf]">{sequence.voiceOver}</p> : null}
      <div className="chalkboard-panel">
        {sequence.steps.map((step, idx) => {
          const delay = step.delay ?? idx * 1.1;
          return (
            <div
              key={`${step.type}-${idx}`}
              className="chalk-line"
              style={{ animationDelay: `${delay}s` }}
            >
              {step.type === "title" ? <h4 className="chalk-title">{step.content}</h4> : null}
              {step.type === "formula" ? <FormulaLine latex={step.latex} highlight={step.highlight} /> : null}
              {step.type === "geometry" && step.figure === "right_triangle" ? (
                <RightTriangle labels={step.labels} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
