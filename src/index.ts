import type { ElementContext, AxeResults, ImpactValue } from "axe-core";
import chalk from "chalk";

function isHTMLElement(html: ElementContext) {
  return !!html && typeof html === "object" && typeof html.tagName === "string";
}

function isHTMLString(html: ElementContext) {
  return typeof html === "string" && /(<([^>]+)>)/i.test(html);
}

function mount(html: ElementContext) {
  if (isHTMLElement(html)) {
    if (document.body.contains(html as unknown as Node)) {
      return [html, () => undefined] as const;
    }

    const _html = html as unknown as HTMLElement;
    html = _html.outerHTML;
  }

  if (isHTMLString(html)) {
    const originalHTML = document.body.innerHTML;
    const restore = () => {
      document.body.innerHTML = originalHTML;
    };

    document.body.innerHTML = html as unknown as string;
    return [document.body, restore] as const;
  }

  if (typeof html === "string") {
    throw new Error(`html parameter ("${html}") has no elements`);
  }

  throw new Error(`html parameter should be an HTML string or an HTML element`);
}

function filterViolations(
  violations: AxeResults["violations"],
  impactLevels: ImpactValue
) {
  if (impactLevels && impactLevels.length > 0) {
    return violations.filter(
      (v) => v.impact && impactLevels.includes(v.impact)
    );
  }
  return violations;
}

async function axe(html: ElementContext) {
  const options = {};
  // Can eventually be removed
  // https://github.com/capricorn86/happy-dom/issues/978
  Object.assign(window.Node.prototype, { isConnected: false });

  const axe = await import("axe-core");
  axe.setup(window.document.body as unknown as Element);

  const [element, restore] = mount(html);

  return new Promise((resolve, reject) => {
    axe.run(element, options, (err, results) => {
      restore();
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
}

const toHaveNoViolations = {
  toHaveNoViolations(results: AxeResults) {
    if (typeof results.violations === "undefined") {
      throw new Error(
        "Unexpected aXe results object. No violations property found.\nDid you change the `reporter` in your aXe configuration?"
      );
    }

    const violations = filterViolations(
      results.violations,
      // @ts-expect-error
      results.toolOptions ? results.toolOptions.impactLevels : []
    );

    const reporter = (violations: AxeResults["violations"]) => {
      if (violations.length === 0) {
        return [];
      }

      const lineBreak = "\n\n";
      const horizontalLine = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

      return violations
        .map((violation) => {
          const errorBody = violation.nodes
            .map((node) => {
              const selector = node.target.join(", ");
              const expectedText =
                `Expected the HTML found at $('${selector}') to have no violations:` +
                lineBreak;
              return (
                expectedText +
                chalk.grey(node.html) +
                lineBreak +
                `Received:` +
                lineBreak +
                chalk.white(`${violation.help} (${violation.id})`) +
                lineBreak +
                chalk.yellow(node.failureSummary) +
                lineBreak +
                (violation.helpUrl
                  ? `You can find more information on this issue here: \n${chalk.blue(
                      violation.helpUrl
                    )}`
                  : "")
              );
            })
            .join(lineBreak);

          return errorBody;
        })
        .join(lineBreak + horizontalLine + lineBreak);
    };

    const formatedViolations = reporter(violations);
    const pass = formatedViolations.length === 0;

    const message = () => {
      if (pass) {
        return;
      }
      return (
        chalk.red(".toHaveNoViolations") + "\n\n" + `${formatedViolations}`
      );
    };

    return { actual: violations, message, pass };
  },
};

// This can be removed when bun supports extending an expect
const toHaveNoViolationsFn = toHaveNoViolations.toHaveNoViolations;

export { axe, toHaveNoViolations, toHaveNoViolationsFn };
