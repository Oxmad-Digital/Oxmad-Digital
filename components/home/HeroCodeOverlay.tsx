import type { CSSProperties } from "react";
import styles from "./HeroCodeOverlay.module.css";

const FRAGMENTS = [
  ["<Experience>", "  <Design />", "</Experience>"],
  [".experience {", "  display: grid;", "  gap: 1.5rem;", "}"],
  ["const experience = {", '  design: "singulier",', "  performance: true,", "};"],
  ["<main>", "  <Ideas />", "</main>"],
  ["export default function Studio() {", "  return <Experience />;", "}"],
  ["const stories = projects.map(", "  (project) => project.story,", ");"],
];

// Keep quoted strings intact and use only two accent tones around the ivory text.
const TOKENS = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|export|default|function|return|true|false|null)\b|\b(?:display|gap)\b(?=\s*:)|\b[A-Z]\w*\b|\b\d+(?:\.\d+)?(?:rem|px)?\b|[{}()[\]<>/=:;,.])/g;
const PUNCTUATION = /^[{}()[\]<>/=:;,.]$/;

function highlight(line: string) {
  return line.split(TOKENS).map((token, index) => {
    if (index % 2 === 0 || token.startsWith('"') || token.startsWith("'")) return token;
    return <span key={index} className={PUNCTUATION.test(token) ? styles.punctuation : styles.keyword}>{token}</span>;
  });
}

/** Decorative, CSS-only typing: two fragments overlap, one at a time on mobile. */
export default function HeroCodeOverlay() {
  return (
    <div className={styles.overlay} aria-hidden="true">
      {FRAGMENTS.map((lines, index) => {
        let elapsed = 350;

        return (
          <pre
            key={lines[0]}
            className={styles.fragment}
            style={{
              "--delay": `${1.2 + index * 4}s`,
              "--columns": Math.max(...lines.map((line) => line.length)),
            } as CSSProperties}
          >
            <code>
              {lines.map((line, lineIndex) => {
                // These durations match the three CSS keyframe endpoints in a 24s cycle.
                const { speed, duration } = line.length > 26
                  ? { speed: "long", duration: 1350 }
                  : line.length > 14
                    ? { speed: "medium", duration: 1000 }
                    : { speed: "short", duration: 650 };
                const delay = elapsed;
                elapsed += duration + 220;

                return (
                  <span
                    key={lineIndex}
                    className={styles.line}
                    data-speed={speed}
                    style={{
                      "--characters": line.length,
                      "--line-delay": `${delay}ms`,
                    } as CSSProperties}
                  >
                    {highlight(line)}
                  </span>
                );
              })}
            </code>
          </pre>
        );
      })}
    </div>
  );
}
